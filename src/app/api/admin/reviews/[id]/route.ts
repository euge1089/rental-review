import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const schema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  if (!ADMIN_EMAIL) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_EMAIL is not configured." },
      { status: 500 },
    );
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "Not authorized." },
      { status: 403 },
    );
  }

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

