import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Sign in to vote." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`review:vote:${email}`, 120, 86_400_000);
  const rlIp = await rateLimit(`review:vote:ip:${ip}`, 300, 86_400_000);
  if (!rl.ok || !rlIp.ok) {
    const retryAfterSec = Math.max(
      rl.ok ? 0 : rl.retryAfterSec,
      rlIp.ok ? 0 : rlIp.retryAfterSec,
    );
    return NextResponse.json(
      { ok: false, error: "Too many votes. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  const { id: reviewId } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid vote." }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, moderationStatus: true },
  });

  if (!review || review.moderationStatus !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "Review not found." }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: session?.user?.name ?? null },
  });

  if (user.id === review.userId) {
    return NextResponse.json(
      { ok: false, error: "You can’t vote on your own review." },
      { status: 400 },
    );
  }

  const { value } = parsed.data;

  if (value === 0) {
    await prisma.reviewVote.deleteMany({
      where: { reviewId, userId: user.id },
    });
  } else {
    await prisma.reviewVote.upsert({
      where: {
        reviewId_userId: { reviewId, userId: user.id },
      },
      create: { reviewId, userId: user.id, value },
      update: { value },
    });
  }

  const tallies = await prisma.reviewVote.groupBy({
    by: ["value"],
    where: { reviewId },
    _count: { _all: true },
  });

  let up = 0;
  let down = 0;
  for (const row of tallies) {
    if (row.value === 1) up = row._count._all;
    if (row.value === -1) down = row._count._all;
  }

  const mine = await prisma.reviewVote.findUnique({
    where: { reviewId_userId: { reviewId, userId: user.id } },
    select: { value: true },
  });

  return NextResponse.json({
    ok: true,
    up,
    down,
    myVote: mine?.value ?? null,
  });
}
