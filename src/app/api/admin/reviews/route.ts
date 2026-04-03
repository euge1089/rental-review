import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { serializeReviewForAdmin } from "@/lib/serialization";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const userId = searchParams.get("userId")?.trim() ?? "";
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "100", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 200)
    : 100;

  const where: Prisma.ReviewWhereInput = {};
  if (userId.length > 0) {
    where.userId = userId;
  }
  if (q.length > 0) {
    where.OR = [
      { body: { contains: q, mode: "insensitive" } },
      { property: { addressLine1: { contains: q, mode: "insensitive" } } },
      { property: { city: { contains: q, mode: "insensitive" } } },
      { property: { postalCode: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { displayName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const rows = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      user: {
        select: { email: true, displayName: true },
      },
    },
    take: limit,
  });

  const reviews = rows.map((review) =>
    serializeReviewForAdmin({
      id: review.id,
      propertyId: review.propertyId,
      userId: review.userId,
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

  return NextResponse.json({ ok: true, reviews, total: reviews.length });
}
