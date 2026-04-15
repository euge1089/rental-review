import { prisma } from "@/lib/prisma";

export type ThreadGateState = {
  canPost: boolean;
  reason?: string;
};

/**
 * Pending: only the starter's first message exists until the review author accepts.
 * After accept: both participants may reply without a consecutive-message cap.
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

  return { canPost: true };
}
