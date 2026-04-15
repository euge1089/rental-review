import { prisma } from "@/lib/prisma";

const MAX_CONSECUTIVE_SAME_SENDER = 2;

export type ThreadGateState = {
  canPost: boolean;
  reason?: string;
};

/**
 * Pending: only the starter's first message exists until the review author accepts.
 * After accept: at most two messages in a row from the same person without a reply.
 */
export async function assertCanPostMessage(input: {
  threadId: string;
  senderUserId: string;
  reviewAuthorId: string;
  starterUserId: string;
  acceptedAt: Date | null;
  declinedAt: Date | null;
}): Promise<ThreadGateState> {
  if (input.declinedAt) {
    return { canPost: false, reason: "This conversation was declined." };
  }

  if (!input.acceptedAt) {
    if (input.senderUserId === input.reviewAuthorId) {
      return {
        canPost: false,
        reason: "Accept the conversation before replying.",
      };
    }
    const count = await prisma.reviewThreadMessage.count({
      where: { threadId: input.threadId },
    });
    if (count >= 1) {
      return {
        canPost: false,
        reason:
          "Wait for the review author to accept your message before sending more.",
      };
    }
  }

  const trailing = await countTrailingSameSender(input.threadId, input.senderUserId);
  if (trailing >= MAX_CONSECUTIVE_SAME_SENDER) {
    return {
      canPost: false,
      reason: `Send at most ${MAX_CONSECUTIVE_SAME_SENDER} messages in a row—wait for a reply before sending another.`,
    };
  }

  return { canPost: true };
}

export async function countTrailingSameSender(
  threadId: string,
  senderUserId: string,
): Promise<number> {
  const recent = await prisma.reviewThreadMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: { senderUserId: true },
  });
  let n = 0;
  for (const m of recent) {
    if (m.senderUserId === senderUserId) n += 1;
    else break;
  }
  return n;
}
