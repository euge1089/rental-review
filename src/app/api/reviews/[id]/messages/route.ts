import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { assertMessageContentAllowed } from "@/lib/message-moderation";
import { assertCanPostMessage } from "@/lib/review-message-thread-rules";
import { isEitherUserBlocking } from "@/lib/user-blocks";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  body: z.string().trim().min(1).max(100),
});

/** Asker: load the thread they started on this review (if any). */
export async function GET(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  const { id: reviewId } = await params;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 401 });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      moderationStatus: true,
      property: { select: { addressLine1: true, id: true } },
    },
  });

  if (!review || review.moderationStatus !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "Review not found." }, { status: 404 });
  }

  if (review.userId === user.id) {
    return NextResponse.json(
      { ok: false, error: "Use your inbox for conversations about your reviews." },
      { status: 400 },
    );
  }

  if (await isEitherUserBlocking(user.id, review.userId)) {
    return NextResponse.json(
      { ok: false, error: "Messaging isn’t available with this renter." },
      { status: 403 },
    );
  }

  const thread = await prisma.reviewMessageThread.findUnique({
    where: {
      reviewId_starterUserId: { reviewId, starterUserId: user.id },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          senderUserId: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    thread: thread
      ? {
          id: thread.id,
          acceptedAt: thread.acceptedAt?.toISOString() ?? null,
          declinedAt: thread.declinedAt?.toISOString() ?? null,
          messages: thread.messages,
        }
      : null,
    review: {
      id: review.id,
      propertyAddress: review.property.addressLine1,
      propertyId: review.property.id,
    },
  });
}

/** Asker: start a thread (first message) or send follow-up after author accepted / within burst rules. */
export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`review:dm:${email}`, 40, 86_400_000);
  const rlIp = await rateLimit(`review:dm:ip:${ip}`, 80, 86_400_000);
  if (!rl.ok || !rlIp.ok) {
    const retryAfterSec = Math.max(
      rl.ok ? 0 : rl.retryAfterSec,
      rlIp.ok ? 0 : rlIp.retryAfterSec,
    );
    return NextResponse.json(
      { ok: false, error: "Too many messages. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  const { id: reviewId } = await params;
  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Message must be 1–100 characters." },
      { status: 400 },
    );
  }

  const moderated = assertMessageContentAllowed(parsed.data.body);
  if (!moderated.ok) {
    return NextResponse.json({ ok: false, error: moderated.error }, { status: 400 });
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
      { ok: false, error: "You can’t message yourself about your own review." },
      { status: 400 },
    );
  }

  if (await isEitherUserBlocking(user.id, review.userId)) {
    return NextResponse.json(
      { ok: false, error: "Messaging isn’t available with this renter." },
      { status: 403 },
    );
  }

  const existing = await prisma.reviewMessageThread.findUnique({
    where: {
      reviewId_starterUserId: { reviewId, starterUserId: user.id },
    },
    include: {
      review: { select: { userId: true } },
    },
  });

  if (existing) {
    const gate = await assertCanPostMessage({
      threadId: existing.id,
      senderUserId: user.id,
      reviewAuthorId: existing.review.userId,
      starterUserId: existing.starterUserId,
      acceptedAt: existing.acceptedAt,
      declinedAt: existing.declinedAt,
    });
    if (!gate.canPost) {
      return NextResponse.json(
        { ok: false, error: gate.reason ?? "Cannot send right now." },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.reviewThreadMessage.create({
        data: {
          threadId: existing.id,
          senderUserId: user.id,
          body: parsed.data.body,
        },
      }),
      prisma.reviewMessageThread.update({
        where: { id: existing.id },
        data: { updatedAt: new Date() },
      }),
    ]);
    const messages = await prisma.reviewThreadMessage.findMany({
      where: { threadId: existing.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, body: true, createdAt: true, senderUserId: true },
    });

    return NextResponse.json({ ok: true, threadId: existing.id, messages });
  }

  const thread = await prisma.$transaction(async (tx) => {
    const t = await tx.reviewMessageThread.create({
      data: {
        reviewId,
        starterUserId: user.id,
      },
    });
    await tx.reviewThreadMessage.create({
      data: {
        threadId: t.id,
        senderUserId: user.id,
        body: parsed.data.body,
      },
    });
    return t;
  });

  const messages = await prisma.reviewThreadMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, createdAt: true, senderUserId: true },
  });

  return NextResponse.json({
    ok: true,
    threadId: thread.id,
    messages,
  });
}
