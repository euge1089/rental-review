import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

const schema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
});

const patchSchema = z.object({
  /** Whole-dollar total monthly rent for the unit (not per bedroom). */
  monthlyRent: z.number().int().min(0),
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

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Expected { monthlyRent: number } (whole dollars, ≥ 0)." },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.review.update({
      where: { id },
      data: { monthlyRent: parsed.data.monthlyRent },
    });
    return NextResponse.json({
      ok: true,
      reviewId: updated.id,
      monthlyRent: updated.monthlyRent,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Review not found." },
      { status: 404 },
    );
  }
}

