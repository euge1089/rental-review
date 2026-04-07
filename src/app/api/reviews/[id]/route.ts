import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectLikelyPersonNames } from "@/lib/moderation";
import { resolveReviewModeration } from "@/lib/review-moderation";
import { assertReviewYearMeetsBostonFloor } from "@/lib/review-boston-floor";
import { isAllowedBathroomsSubmitValue } from "@/lib/policy";

const schema = z.object({
  reviewYear: z.number().int().min(2017),
  unit: z.string().max(50).optional(),
  bedroomCount: z.number().int().min(0).max(5).optional(),
  monthlyRent: z.number().int().min(0).optional(),
  bathrooms: z
    .number()
    .refine(isAllowedBathroomsSubmitValue, "Invalid bathroom count.")
    .optional(),
  reviewText: z.string().max(4000).optional(),
  hasParking: z.boolean().optional(),
  hasCentralHeatCooling: z.boolean().optional(),
  hasInUnitLaundry: z.boolean().optional(),
  hasStorageSpace: z.boolean().optional(),
  hasOutdoorSpace: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  overallScore: z.number().int().min(1).max(10).optional(),
  landlordScore: z.number().int().min(1).max(10).optional(),
  majorityYearAttestation: z.literal(true),
  displayFullyAnonymous: z.boolean().optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Please sign in before editing a review." },
      { status: 401 },
    );
  }

  const { id } = await params;

  const existing = await prisma.review.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          phoneVerified: true,
          bostonRentingSinceYear: true,
        },
      },
    },
  });

  if (!existing || existing.user.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "Review not found." },
      { status: 404 },
    );
  }

  try {
    const rawBody = await request.json();
    const body = schema.parse(rawBody);

    const floorCheck = assertReviewYearMeetsBostonFloor(
      body.reviewYear,
      existing.user.bostonRentingSinceYear,
    );
    if (!floorCheck.ok) {
      return NextResponse.json(
        { ok: false, error: floorCheck.error },
        { status: 400 },
      );
    }

    const names = detectLikelyPersonNames(body.reviewText ?? "");
    const { moderationStatus, moderationReasons, userMessage } =
      resolveReviewModeration(names, Boolean(existing.user.phoneVerified));

    const updated = await prisma.review.update({
      where: { id },
      data: {
        reviewYear: body.reviewYear,
        unit: body.unit,
        bedroomCount:
          body.bedroomCount !== undefined
            ? body.bedroomCount
            : existing.bedroomCount,
        monthlyRent: body.monthlyRent,
        bathrooms: body.bathrooms,
        body: body.reviewText,
        hasParking: body.hasParking ?? existing.hasParking,
        hasCentralHeatCooling:
          body.hasCentralHeatCooling ?? existing.hasCentralHeatCooling,
        hasInUnitLaundry: body.hasInUnitLaundry ?? existing.hasInUnitLaundry,
        hasStorageSpace: body.hasStorageSpace ?? existing.hasStorageSpace,
        hasOutdoorSpace: body.hasOutdoorSpace ?? existing.hasOutdoorSpace,
        petFriendly: body.petFriendly ?? existing.petFriendly,
        overallScore: body.overallScore,
        landlordScore: body.landlordScore,
        majorityYearAttested: body.majorityYearAttestation,
        displayFullyAnonymous: true,
        moderationStatus,
        moderationReasons,
      },
    });

    return NextResponse.json({
      ok: true,
      reviewId: updated.id,
      moderationStatus,
      userMessage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update review right now.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Please sign in before deleting a review." },
      { status: 401 },
    );
  }

  const { id } = await params;

  const existing = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
    },
  });

  if (!existing || existing.user.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "Review not found." },
      { status: 404 },
    );
  }

  await prisma.review.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
