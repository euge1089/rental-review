import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { normalizeEmail } from "@/lib/normalize-email";
import { prisma } from "@/lib/prisma";
import { summarizeRents, effectiveBedroomBand } from "@/lib/analytics";
import {
  buildBaseWhere,
  matchesBedroomBand,
  resolveTimeWindow,
} from "@/lib/rent-explorer-filters";

const bodySchema = z.object({
  zipCodes: z.array(z.string()).optional(),
  minBedroomBand: z
    .enum(["Any", "Studio", "1BR", "2BR", "3BR", "4BR", "5BR+"])
    .default("Any"),
  maxBedroomBand: z
    .enum(["Any", "Studio", "1BR", "2BR", "3BR", "4BR", "5BR+"])
    .default("Any"),
  minMonthlyRent: z.number().int().min(0).optional(),
  maxMonthlyRent: z.number().int().min(0).optional(),
  minBathrooms: z.enum(["Any", "1", "1.5", "2"]).default("Any"),
  amenities: z
    .object({
      hasParking: z.boolean().optional(),
      hasCentralHeatCooling: z.boolean().optional(),
      hasInUnitLaundry: z.boolean().optional(),
      hasStorageSpace: z.boolean().optional(),
      hasOutdoorSpace: z.boolean().optional(),
      petFriendly: z.boolean().optional(),
    })
    .partial()
    .optional(),
  timeWindow: z.enum(["1y", "2y", "3y", "10y", "all"]).default("1y"),
  page: z.number().int().min(0).default(0),
});

const PAGE_SIZE = 10;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to explore rent analytics." },
      { status: 401 },
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const userRow = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { _count: { select: { reviews: true } } },
  });
  const userReviewCount = userRow?._count.reviews ?? 0;
  if (userReviewCount < 1) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Submit at least one lease-year review to use Rent Explorer.",
        code: "EXPLORER_REQUIRES_REVIEW",
      },
      { status: 403 },
    );
  }

  try {
    const rawBody = await request.json();
    const body = bodySchema.parse(rawBody);

    const filters = body;
    const { createdAtCutoff, recentWindowMonths } = resolveTimeWindow(filters);
    const where = buildBaseWhere(filters, createdAtCutoff);

    const allMatching = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            addressLine1: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },
      },
    });

    const filteredByBedroom = allMatching.filter((review) => {
      return matchesBedroomBand(
        review.unit,
        review.bedroomCount,
        filters.minBedroomBand,
        filters.maxBedroomBand,
      );
    });

    const rents = filteredByBedroom
      .map((r) => r.monthlyRent)
      .filter((v): v is number => typeof v === "number");

    const { median, min, max } = summarizeRents(rents);

    const n = filteredByBedroom.length;

    const now = new Date();
    const recentCutoff = new Date(
      now.getFullYear(),
      now.getMonth() - recentWindowMonths,
      now.getDate(),
    );
    const recentCount = filteredByBedroom.filter(
      (r) => r.createdAt >= recentCutoff,
    ).length;

    const amenityTotals = {
      hasParking: 0,
      hasCentralHeatCooling: 0,
      hasInUnitLaundry: 0,
      hasStorageSpace: 0,
      hasOutdoorSpace: 0,
      petFriendly: 0,
    };

    for (const review of filteredByBedroom) {
      if (review.hasParking) amenityTotals.hasParking += 1;
      if (review.hasCentralHeatCooling) amenityTotals.hasCentralHeatCooling += 1;
      if (review.hasInUnitLaundry) amenityTotals.hasInUnitLaundry += 1;
      if (review.hasStorageSpace) amenityTotals.hasStorageSpace += 1;
      if (review.hasOutdoorSpace) amenityTotals.hasOutdoorSpace += 1;
      if (review.petFriendly) amenityTotals.petFriendly += 1;
    }

    const amenityPercentages =
      n === 0
        ? amenityTotals
        : {
            hasParking: Math.round((amenityTotals.hasParking / n) * 100),
            hasCentralHeatCooling: Math.round(
              (amenityTotals.hasCentralHeatCooling / n) * 100,
            ),
            hasInUnitLaundry: Math.round(
              (amenityTotals.hasInUnitLaundry / n) * 100,
            ),
            hasStorageSpace: Math.round(
              (amenityTotals.hasStorageSpace / n) * 100,
            ),
            hasOutdoorSpace: Math.round(
              (amenityTotals.hasOutdoorSpace / n) * 100,
            ),
            petFriendly: Math.round((amenityTotals.petFriendly / n) * 100),
          };

    const start = filters.page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = filteredByBedroom.slice(start, end);

    const items = pageItems.map((review) => ({
      id: review.id,
      propertyId: review.property.id,
      addressLine1: review.property.addressLine1,
      city: review.property.city,
      state: review.property.state,
      postalCode: review.property.postalCode,
      monthlyRent: review.monthlyRent,
      bathrooms: review.bathrooms,
      bedroomBand: effectiveBedroomBand(review.unit, review.bedroomCount),
      hasParking: review.hasParking,
      hasCentralHeatCooling: review.hasCentralHeatCooling,
      hasInUnitLaundry: review.hasInUnitLaundry,
      hasStorageSpace: review.hasStorageSpace,
      hasOutdoorSpace: review.hasOutdoorSpace,
      petFriendly: review.petFriendly,
      reviewYear: review.reviewYear,
      createdAt: review.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      snapshot: {
        median,
        min,
        max,
        n,
        recentCount,
        recentWindowMonths,
        amenityPercentages,
      },
      items,
      hasMore: end < filteredByBedroom.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load analytics.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

