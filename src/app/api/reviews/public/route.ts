import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { serializeReviewForPublic } from "@/lib/serialization";

const querySchema = z.object({
  propertyId: z.string().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    propertyId: url.searchParams.get("propertyId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query parameters." },
      { status: 400 },
    );
  }

  const { propertyId } = parsed.data;

  const reviews = await prisma.review.findMany({
    where: {
      moderationStatus: "APPROVED",
      ...(propertyId ? { propertyId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      reviewYear: true,
      majorityYearAttested: true,
      body: true,
    },
  });

  const payload = reviews.map((review) =>
    serializeReviewForPublic({
      id: review.id,
      reviewYear: review.reviewYear,
      majorityYearAttested: review.majorityYearAttested,
      body: review.body,
    }),
  );

  return NextResponse.json({ ok: true, reviews: payload });
}

