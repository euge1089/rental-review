import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isEitherUserBlocking } from "@/lib/user-blocks";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  value: z.union([z.literal(1), z.literal(0)]),
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

  if (await isEitherUserBlocking(user.id, review.userId)) {
    return NextResponse.json(
      { ok: false, error: "You can’t vote on this review while someone is blocked." },
      { status: 403 },
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
      create: { reviewId, userId: user.id, value: 1 },
      update: { value: 1 },
    });
  }

  const upRow = await prisma.reviewVote.aggregate({
    where: { reviewId, value: 1 },
    _count: { _all: true },
  });

  const mine = await prisma.reviewVote.findUnique({
    where: { reviewId_userId: { reviewId, userId: user.id } },
    select: { value: true },
  });

  return NextResponse.json({
    ok: true,
    up: upRow._count._all,
    myVote: mine?.value === 1 ? 1 : null,
  });
}
