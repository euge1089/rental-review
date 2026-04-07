import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectLikelyPersonNames } from "@/lib/moderation";
import { PRODUCT_POLICY, isAllowedBathroomsSubmitValue } from "@/lib/policy";
import { assertReviewYearMeetsBostonFloor } from "@/lib/review-boston-floor";
import {
  formatAddressLine1ForDisplay,
  normalizePropertyAddress,
} from "@/lib/normalize-address";
import { resolveReviewModeration } from "@/lib/review-moderation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const yearEntrySchema = z.object({
  reviewYear: z.number().int().min(2017),
  monthlyRent: z.number().int().min(0),
});

const batchSchema = z.object({
  address: z.string().min(5),
  unit: z.string().max(50).optional(),
  city: z.string().default("Boston"),
  state: z.string().default("MA"),
  postalCode: z.string().min(3),
  bedroomCount: z.number().int().min(0).max(5),
  bathrooms: z
    .number()
    .refine(isAllowedBathroomsSubmitValue, "Invalid bathroom count."),
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
  yearEntries: z.array(yearEntrySchema).min(1).max(20),
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
    const body = batchSchema.parse(rawBody);

    if (body.city.toLowerCase() !== PRODUCT_POLICY.geography.city.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "Only City of Boston addresses are supported in v1." },
        { status: 400 },
      );
    }

    const byYear = new Map<number, number>();
    for (const e of body.yearEntries) {
      if (byYear.has(e.reviewYear)) {
        return NextResponse.json(
          { ok: false, error: "Each lease-start year can only appear once in a batch." },
          { status: 400 },
        );
      }
      byYear.set(e.reviewYear, e.monthlyRent);
    }
    const entries = [...byYear.entries()].map(([reviewYear, monthlyRent]) => ({
      reviewYear,
      monthlyRent,
    }));

    const names = detectLikelyPersonNames(body.reviewText ?? "");
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, displayName: session.user?.name ?? null },
    });

    for (const { reviewYear } of entries) {
      const floorCheck = assertReviewYearMeetsBostonFloor(
        reviewYear,
        user.bostonRentingSinceYear,
      );
      if (!floorCheck.ok) {
        return NextResponse.json(
          { ok: false, error: `${reviewYear}: ${floorCheck.error}` },
          { status: 400 },
        );
      }
    }

    const { moderationStatus, moderationReasons, userMessage } =
      resolveReviewModeration(names, Boolean(user.phoneVerified));

    const normalizedAddress = normalizePropertyAddress(
      body.address,
      body.city,
      body.state,
    );
    const addressLine1 = formatAddressLine1ForDisplay(body.address);
    const property = await prisma.property.upsert({
      where: { normalizedAddress },
      update: { addressLine1 },
      create: {
        addressLine1,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        normalizedAddress,
      },
    });

    const existingForBatch = await prisma.review.findMany({
      where: {
        propertyId: property.id,
        userId: user.id,
        reviewYear: { in: entries.map((e) => e.reviewYear) },
      },
      select: { reviewYear: true },
    });
    if (existingForBatch.length > 0) {
      const ys = existingForBatch.map((r) => r.reviewYear).sort((a, b) => b - a);
      return NextResponse.json(
        {
          ok: false,
          error: `You already have reviews for this address for: ${ys.join(", ")}. Edit those on your profile or deselect those years.`,
        },
        { status: 400 },
      );
    }

    const reviewCount = await prisma.review.count({
      where: { userId: user.id },
    });
    const newCount = entries.length;
    if (reviewCount + newCount > PRODUCT_POLICY.reviews.maxReviewsPerUser) {
      return NextResponse.json(
        {
          ok: false,
          error: `This batch would create ${newCount} reviews but you only have ${PRODUCT_POLICY.reviews.maxReviewsPerUser - reviewCount} slot(s) left. Remove some years or delete old reviews on your profile.`,
        },
        { status: 400 },
      );
    }

    const reviewIds: string[] = [];
    await prisma.$transaction(async (tx) => {
      for (const { reviewYear, monthlyRent } of entries) {
        const created = await tx.review.create({
          data: {
            propertyId: property.id,
            userId: user.id,
            reviewYear,
            unit: body.unit,
            bedroomCount: body.bedroomCount,
            monthlyRent,
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
            displayFullyAnonymous: true,
            moderationStatus,
            moderationReasons,
          },
        });
        reviewIds.push(created.id);
      }
    });

    const count = reviewIds.length;
    const plural = count > 1 ? "s" : "";
    const combinedMessage =
      count > 1
        ? `${count} reviews submitted. ${userMessage ?? "Thanks for sharing."}`
        : (userMessage ??
          (moderationStatus === "PENDING_REVIEW"
            ? "Submitted — your review is being reviewed."
            : "Submitted successfully."));

    return NextResponse.json({
      ok: true,
      reviewIds,
      count,
      moderationStatus,
      userMessage: combinedMessage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit reviews right now.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
