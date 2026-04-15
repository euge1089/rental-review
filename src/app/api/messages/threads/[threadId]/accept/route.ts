import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ threadId: string }> };

export async function POST(_request: Request, { params }: Params) {
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

  const thread = await prisma.reviewMessageThread.findFirst({
    where: {
      id: threadId,
      review: { userId: user.id },
    },
    select: {
      id: true,
      acceptedAt: true,
      declinedAt: true,
    },
  });

  if (!thread) {
    return NextResponse.json({ ok: false, error: "Thread not found." }, { status: 404 });
  }

  if (thread.declinedAt) {
    return NextResponse.json(
      { ok: false, error: "This conversation was already declined." },
      { status: 400 },
    );
  }

  if (thread.acceptedAt) {
    return NextResponse.json({ ok: true, alreadyAccepted: true });
  }

  await prisma.reviewMessageThread.update({
    where: { id: thread.id },
    data: { acceptedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
