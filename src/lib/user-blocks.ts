import { prisma } from "@/lib/prisma";

/** True if either user has blocked the other (symmetric). */
export async function isEitherUserBlocking(userIdA: string, userIdB: string): Promise<boolean> {
  if (userIdA === userIdB) return false;
  const row = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedUserId: userIdB },
        { blockerId: userIdB, blockedUserId: userIdA },
      ],
    },
    select: { id: true },
  });
  return Boolean(row);
}
