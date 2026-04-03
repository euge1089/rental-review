import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

const schema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid action." },
      { status: 400 },
    );
  }

  const { id } = await params;

  const updated = await prisma.review.update({
    where: { id },
    data: {
      moderationStatus: parsed.data.action,
    },
  });

  return NextResponse.json({ ok: true, reviewId: updated.id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await prisma.review.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Review not found or could not be deleted." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}

