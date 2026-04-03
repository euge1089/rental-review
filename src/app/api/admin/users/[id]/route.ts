import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing user id." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email?.toLowerCase() ?? null;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  });

  if (!target) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  if (adminEmail && target.email.toLowerCase() === adminEmail) {
    return NextResponse.json(
      { ok: false, error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  await prisma.emailVerification.deleteMany({
    where: { email: target.email },
  });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
