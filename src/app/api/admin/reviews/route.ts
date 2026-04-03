import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeReviewForAdmin } from "@/lib/serialization";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET() {
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

  const rows = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      user: {
        select: { email: true, displayName: true },
      },
    },
    take: 100,
  });

  const reviews = rows.map((review) =>
    serializeReviewForAdmin({
      id: review.id,
      reviewYear: review.reviewYear,
      monthlyRent: review.monthlyRent,
      bathrooms: review.bathrooms,
      unit: review.unit,
      overallScore: review.overallScore,
      landlordScore: review.landlordScore,
      majorityYearAttested: review.majorityYearAttested,
      moderationStatus: review.moderationStatus,
      moderationReasons: review.moderationReasons,
      body: review.body,
      property: {
        addressLine1: review.property.addressLine1,
        city: review.property.city,
        state: review.property.state,
      },
      user: {
        email: review.user.email,
        displayName: review.user.displayName,
      },
    }),
  );

  return NextResponse.json({ ok: true, reviews });
}

