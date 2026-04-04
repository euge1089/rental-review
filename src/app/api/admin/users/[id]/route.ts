import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

const patchSchema = z.object({
  bostonRentingSinceYear: z.union([
    z.number().int().min(1990).max(new Date().getFullYear() + 1),
    z.null(),
  ]),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing user id." }, { status: 400 });
  }

  let parsed: z.infer<typeof patchSchema>;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { bostonRentingSinceYear: parsed.bostonRentingSinceYear },
    select: { bostonRentingSinceYear: true },
  });

  return NextResponse.json({ ok: true, bostonRentingSinceYear: updated.bostonRentingSinceYear });
}

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
