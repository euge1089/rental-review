import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectLikelyPersonNames } from "@/lib/moderation";
import { PRODUCT_POLICY } from "@/lib/policy";
import { normalizePropertyAddress } from "@/lib/normalize-address";
import { resolveReviewModeration } from "@/lib/review-moderation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  address: z.string().min(5),
  unit: z.string().max(50).optional(),
  city: z.string().default("Boston"),
  state: z.string().default("MA"),
  postalCode: z.string().min(3),
  reviewYear: z.number().int().min(2017),
  bedroomCount: z.number().int().min(0).max(5),
  monthlyRent: z.number().int().min(0),
  bathrooms: z.number().min(0.5).max(10).multipleOf(0.5),
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
  displayFullyAnonymous: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Please sign in before submitting a review." },
      { status: 401 },
    );
  }

  const ip = getClientIp(request);
  const byAccount = await rateLimit(`review:post:${email}`, 15, 86_400_000);
  const byIp = await rateLimit(`review:post:ip:${ip}`, 50, 86_400_000);
  if (!byAccount.ok || !byIp.ok) {
    const retryAfterSec = Math.max(
      byAccount.ok ? 0 : byAccount.retryAfterSec,
      byIp.ok ? 0 : byIp.retryAfterSec,
    );
    return NextResponse.json(
      { ok: false, error: "Too many review submissions. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      },
    );
  }

  try {
    const rawBody = await request.json();
    const body = schema.parse(rawBody);

    if (body.city.toLowerCase() !== PRODUCT_POLICY.geography.city.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "Only City of Boston addresses are supported in v1." },
        { status: 400 },
      );
    }

    const names = detectLikelyPersonNames(body.reviewText ?? "");
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, displayName: session.user?.name ?? null },
    });

    const { moderationStatus, moderationReasons, userMessage } =
      resolveReviewModeration(names, Boolean(user.phoneVerified));

    const normalizedAddress = normalizePropertyAddress(
      body.address,
      body.city,
      body.state,
    );
    const property = await prisma.property.upsert({
      where: { normalizedAddress },
      update: {},
      create: {
        addressLine1: body.address,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        normalizedAddress,
      },
    });

    const reviewCompoundKey = {
      propertyId: property.id,
      userId: user.id,
      reviewYear: body.reviewYear,
    };
    const existingReview = await prisma.review.findUnique({
      where: { propertyId_userId_reviewYear: reviewCompoundKey },
    });
    if (!existingReview) {
      const reviewCount = await prisma.review.count({
        where: { userId: user.id },
      });
      if (reviewCount >= PRODUCT_POLICY.reviews.maxReviewsPerUser) {
        return NextResponse.json(
          {
            ok: false,
            error: `You can post up to ${PRODUCT_POLICY.reviews.maxReviewsPerUser} reviews on the site. Edit or remove an existing review on your profile if you need to make a change.`,
          },
          { status: 400 },
        );
      }
    }

    const review = await prisma.review.upsert({
      where: {
        propertyId_userId_reviewYear: reviewCompoundKey,
      },
      update: {
        unit: body.unit,
        bedroomCount: body.bedroomCount,
        monthlyRent: body.monthlyRent,
        bathrooms: body.bathrooms,
        body: body.reviewText,
        hasParking: body.hasParking ?? false,
        hasCentralHeatCooling: body.hasCentralHeatCooling ?? false,
        hasInUnitLaundry: body.hasInUnitLaundry ?? false,
        hasStorageSpace: body.hasStorageSpace ?? false,
        hasOutdoorSpace: body.hasOutdoorSpace ?? false,
        petFriendly: body.petFriendly ?? false,
        overallScore: body.overallScore,
        landlordScore: body.landlordScore,
        majorityYearAttested: body.majorityYearAttestation,
        displayFullyAnonymous: body.displayFullyAnonymous,
        moderationStatus,
        moderationReasons,
      },
      create: {
        propertyId: property.id,
        userId: user.id,
        reviewYear: body.reviewYear,
        unit: body.unit,
        bedroomCount: body.bedroomCount,
        monthlyRent: body.monthlyRent,
        bathrooms: body.bathrooms,
        body: body.reviewText,
        hasParking: body.hasParking ?? false,
        hasCentralHeatCooling: body.hasCentralHeatCooling ?? false,
        hasInUnitLaundry: body.hasInUnitLaundry ?? false,
        hasStorageSpace: body.hasStorageSpace ?? false,
        hasOutdoorSpace: body.hasOutdoorSpace ?? false,
        petFriendly: body.petFriendly ?? false,
        overallScore: body.overallScore,
        landlordScore: body.landlordScore,
        majorityYearAttested: body.majorityYearAttestation,
        displayFullyAnonymous: body.displayFullyAnonymous,
        moderationStatus,
        moderationReasons,
      },
    });

    return NextResponse.json({
      ok: true,
      reviewId: review.id,
      moderationStatus,
      userMessage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit review right now.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
