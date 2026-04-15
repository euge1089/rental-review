import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { assertMessageContentAllowed } from "@/lib/message-moderation";
import { assertCanPostMessage } from "@/lib/review-message-thread-rules";
import { isEitherUserBlocking } from "@/lib/user-blocks";

type Params = { params: Promise<{ threadId: string }> };

const postSchema = z.object({
  body: z.string().trim().min(1).max(100),
});

async function loadParticipantThread(threadId: string, userId: string) {
  return prisma.reviewMessageThread.findFirst({
    where: {
      id: threadId,
      OR: [{ starterUserId: userId }, { review: { userId } }],
    },
    include: {
      review: {
        select: {
          id: true,
          userId: true,
          moderationStatus: true,
          property: { select: { addressLine1: true, id: true } },
        },
      },
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
}

export async function GET(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  const { threadId } = await params;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 401 });
  }

  const thread = await loadParticipantThread(threadId, user.id);
  if (!thread || thread.review.moderationStatus !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "Thread not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    thread: {
      id: thread.id,
      reviewId: thread.review.id,
      propertyAddress: thread.review.property.addressLine1,
      propertyId: thread.review.property.id,
      reviewAuthorId: thread.review.userId,
      starterUserId: thread.starterUserId,
      acceptedAt: thread.acceptedAt?.toISOString() ?? null,
      declinedAt: thread.declinedAt?.toISOString() ?? null,
      messages: thread.messages,
    },
  });
}

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

  const { threadId } = await params;
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

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: session?.user?.name ?? null },
  });

  const thread = await loadParticipantThread(threadId, user.id);
  if (!thread || thread.review.moderationStatus !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "Thread not found." }, { status: 404 });
  }

  const isAuthor = thread.review.userId === user.id;
  const isStarter = thread.starterUserId === user.id;
  if (!isAuthor && !isStarter) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  }

  if (await isEitherUserBlocking(thread.review.userId, thread.starterUserId)) {
    return NextResponse.json(
      { ok: false, error: "Messaging isn’t available in this conversation." },
      { status: 403 },
    );
  }

  const gate = await assertCanPostMessage({
    threadId: thread.id,
    senderUserId: user.id,
    reviewAuthorId: thread.review.userId,
    starterUserId: thread.starterUserId,
    acceptedAt: thread.acceptedAt,
    declinedAt: thread.declinedAt,
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
        threadId: thread.id,
        senderUserId: user.id,
        body: parsed.data.body,
      },
    }),
    prisma.reviewMessageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  const messages = await prisma.reviewThreadMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, createdAt: true, senderUserId: true },
  });

  return NextResponse.json({ ok: true, messages });
}
