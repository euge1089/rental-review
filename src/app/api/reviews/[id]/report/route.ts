import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

type Params = {
  params: Promise<{ id: string }>;
};

const schema = z.object({
  reason: z.string().min(5).max(500),
});

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please sign in before reporting a review.",
      },
      { status: 401 },
    );
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`review:report:${email}`, 25, 86_400_000);
  const rlIp = await rateLimit(`review:report:ip:${ip}`, 40, 86_400_000);
  if (!rl.ok || !rlIp.ok) {
    const retryAfterSec = Math.max(
      rl.ok ? 0 : rl.retryAfterSec,
      rlIp.ok ? 0 : rlIp.retryAfterSec,
    );
    return NextResponse.json(
      { ok: false, error: "Too many reports. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      },
    );
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Reason is required." },
      { status: 400 },
    );
  }

  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, moderationStatus: true, moderationReasons: true },
  });

  if (!review) {
    return NextResponse.json({ ok: false, error: "Review not found." }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: session?.user?.name ?? null },
  });

  const existingReport = await prisma.reviewReport.findUnique({
    where: {
      reviewId_userId: {
        reviewId: review.id,
        userId: user.id,
      },
    },
  });

  if (existingReport) {
    return NextResponse.json(
      { ok: false, error: "You have already reported this review." },
      { status: 400 },
    );
  }

  const trimmedReason = parsed.data.reason.trim();

  const updatedReasons = [...review.moderationReasons, `Report: ${trimmedReason}`];

  await prisma.review.update({
    where: { id },
    data: {
      moderationStatus: review.moderationStatus === "APPROVED"
        ? "PENDING_REVIEW"
        : review.moderationStatus,
      moderationReasons: updatedReasons,
    },
  });

  await prisma.reviewReport.create({
    data: {
      reviewId: review.id,
      userId: user.id,
      reason: trimmedReason,
    },
  });

  return NextResponse.json({ ok: true });
}

