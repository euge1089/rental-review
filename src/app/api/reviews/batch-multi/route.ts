import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectLikelyPersonNames } from "@/lib/moderation";
import {
  PRODUCT_POLICY,
  isAllowedBathroomsSubmitValue,
} from "@/lib/policy";
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

const rentalBlockSchema = z.object({
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
  overallScore: z.number().int().min(1).max(10),
  landlordScore: z.number().int().min(1).max(10),
  yearEntries: z.array(yearEntrySchema).min(1).max(20),
});

const multiSchema = z.object({
  rentals: z.array(rentalBlockSchema).min(1).max(5),
  majorityYearAttestation: z.literal(true),
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
    const body = multiSchema.parse(rawBody);
    const { rentals } = body;

    for (const r of rentals) {
      if (r.city.toLowerCase() !== PRODUCT_POLICY.geography.city.toLowerCase()) {
        return NextResponse.json(
          { ok: false, error: "Only City of Boston addresses are supported in v1." },
          { status: 400 },
        );
      }
    }

    const normalizedKeys = new Set<string>();
    const prepared: {
      rental: z.infer<typeof rentalBlockSchema>;
      normalizedAddress: string;
      addressLine1: string;
      entries: { reviewYear: number; monthlyRent: number }[];
    }[] = [];

    for (const rental of rentals) {
      const byYear = new Map<number, number>();
      for (const e of rental.yearEntries) {
        if (byYear.has(e.reviewYear)) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "Each lease-start year can only appear once per address in this submission.",
            },
            { status: 400 },
          );
        }
        byYear.set(e.reviewYear, e.monthlyRent);
      }
      const entries = [...byYear.entries()].map(([reviewYear, monthlyRent]) => ({
        reviewYear,
        monthlyRent,
      }));

      const normalizedAddress = normalizePropertyAddress(
        rental.address,
        rental.city,
        rental.state,
      );
      if (normalizedKeys.has(normalizedAddress)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "The same building appears more than once. Combine those years into one place card, or remove the duplicate.",
          },
          { status: 400 },
        );
      }
      normalizedKeys.add(normalizedAddress);

      prepared.push({
        rental,
        normalizedAddress,
        addressLine1: formatAddressLine1ForDisplay(rental.address),
        entries,
      });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, displayName: session?.user?.name ?? null },
    });

    for (const { entries } of prepared) {
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
    }

    for (const { rental, normalizedAddress, entries } of prepared) {
      const property = await prisma.property.findUnique({
        where: { normalizedAddress },
        select: { id: true },
      });
      if (!property) continue;
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
            error: `You already have reviews for an address in this submission for: ${ys.join(", ")}. Edit those on your profile or change that place card.`,
          },
          { status: 400 },
        );
      }
    }

    const totalNew = prepared.reduce((n, p) => n + p.entries.length, 0);
    const reviewCount = await prisma.review.count({
      where: { userId: user.id },
    });
    if (reviewCount + totalNew > PRODUCT_POLICY.reviews.maxReviewsPerUser) {
      const left = PRODUCT_POLICY.reviews.maxReviewsPerUser - reviewCount;
      return NextResponse.json(
        {
          ok: false,
          error: `This submission would create ${totalNew} reviews but you only have ${Math.max(0, left)} slot(s) left. Remove some years or places, or delete old reviews on your profile.`,
        },
        { status: 400 },
      );
    }

    const moderationPerRental = prepared.map(({ rental }) => {
      const names = detectLikelyPersonNames(rental.reviewText ?? "");
      return resolveReviewModeration(names, Boolean(user.phoneVerified));
    });

    const reviewIds: string[] = [];
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < prepared.length; i++) {
        const { rental, normalizedAddress, addressLine1, entries } = prepared[i]!;
        const { moderationStatus, moderationReasons } = moderationPerRental[i]!;

        const property = await tx.property.upsert({
          where: { normalizedAddress },
          update: { addressLine1 },
          create: {
            addressLine1,
            city: rental.city,
            state: rental.state,
            postalCode: rental.postalCode,
            normalizedAddress,
          },
        });

        for (const { reviewYear, monthlyRent } of entries) {
          const created = await tx.review.create({
            data: {
              propertyId: property.id,
              userId: user.id,
              reviewYear,
              unit: rental.unit,
              bedroomCount: rental.bedroomCount,
              monthlyRent,
              bathrooms: rental.bathrooms,
              body: rental.reviewText,
              hasParking: rental.hasParking ?? false,
              hasCentralHeatCooling: rental.hasCentralHeatCooling ?? false,
              hasInUnitLaundry: rental.hasInUnitLaundry ?? false,
              hasStorageSpace: rental.hasStorageSpace ?? false,
              hasOutdoorSpace: rental.hasOutdoorSpace ?? false,
              petFriendly: rental.petFriendly ?? false,
              overallScore: rental.overallScore,
              landlordScore: rental.landlordScore,
              majorityYearAttested: body.majorityYearAttestation,
              displayFullyAnonymous: true,
              moderationStatus,
              moderationReasons,
            },
          });
          reviewIds.push(created.id);
        }
      }
    });

    const count = reviewIds.length;
    const anyPending = moderationPerRental.some(
      (m) => m.moderationStatus === "PENDING_REVIEW",
    );
    const namePending = moderationPerRental.some((m) =>
      m.moderationReasons.some((r) => r.startsWith("Detected names:")),
    );

    let userMessage: string;
    if (count > 1) {
      userMessage = anyPending
        ? namePending
          ? `${count} reviews submitted. ${PRODUCT_POLICY.reviews.pendingNamesUserMessage}`
          : `${count} reviews submitted. ${PRODUCT_POLICY.reviews.pendingManualReviewMessage}`
        : `${count} reviews submitted. ${PRODUCT_POLICY.reviews.liveNowUserMessage}`;
    } else {
      const m = moderationPerRental[0]!;
      userMessage =
        m.userMessage ??
        (m.moderationStatus === "PENDING_REVIEW"
          ? "Submitted — your review is being reviewed."
          : "Submitted successfully.");
    }

    return NextResponse.json({
      ok: true,
      reviewIds,
      count,
      moderationStatus: anyPending ? "PENDING_REVIEW" : "APPROVED",
      userMessage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit reviews right now.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
