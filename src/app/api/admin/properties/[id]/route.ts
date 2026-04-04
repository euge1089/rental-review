import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: { _count: { select: { reviews: true } } },
  });

  if (!property) {
    return NextResponse.json(
      { ok: false, error: "Property not found." },
      { status: 404 },
    );
  }

  if (property._count.reviews > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `This property still has ${property._count.reviews} review(s). Remove them before deleting the property.`,
      },
      { status: 400 },
    );
  }

  await prisma.property.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
