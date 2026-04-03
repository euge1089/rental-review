import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import { PRODUCT_POLICY } from "@/lib/policy";

export async function GET() {
  const session = await getServerSession(authOptions);
  const emailRaw = session?.user?.email;
  if (!emailRaw) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const email = normalizeEmail(emailRaw);

  const row = await prisma.user.findUnique({
    where: { email },
    select: { _count: { select: { reviews: true } } },
  });

  const count = row?._count.reviews ?? 0;
  const max = PRODUCT_POLICY.reviews.maxReviewsPerUser;

  return NextResponse.json({
    ok: true,
    count,
    max,
    atCap: count >= max,
  });
}
