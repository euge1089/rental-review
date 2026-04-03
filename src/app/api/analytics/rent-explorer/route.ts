import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeRents, effectiveBedroomBand } from "@/lib/analytics";

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

  try {
    const rawBody = await request.json();
    const body = bodySchema.parse(rawBody);

    const filters = body;

    let createdAtCutoff: Date | undefined;
    let recentWindowMonths = 12;
    if (filters.timeWindow !== "all") {
      const years =
        filters.timeWindow === "1y"
          ? 1
          : filters.timeWindow === "2y"
            ? 2
            : filters.timeWindow === "3y"
              ? 3
              : 10;
      recentWindowMonths = years * 12;
      const now = new Date();
      createdAtCutoff = new Date(
        now.getFullYear() - years,
        now.getMonth(),
        now.getDate(),
      );
    }

    const where: import("@prisma/client").Prisma.ReviewWhereInput = {
      moderationStatus: "APPROVED",
      monthlyRent: { not: null },
      property: {
        city: "Boston",
        ...(filters.zipCodes && filters.zipCodes.length > 0
          ? { postalCode: { in: filters.zipCodes } }
          : {}),
      },
      ...(filters.minMonthlyRent != null || filters.maxMonthlyRent != null
        ? {
            monthlyRent: {
              ...(filters.minMonthlyRent != null
                ? { gte: filters.minMonthlyRent }
                : {}),
              ...(filters.maxMonthlyRent != null
                ? { lte: filters.maxMonthlyRent }
                : {}),
            },
          }
        : {}),
      ...(createdAtCutoff
        ? {
            createdAt: {
              gte: createdAtCutoff,
            },
          }
        : {}),
    };

    if (filters.minBathrooms !== "Any") {
      const minBaths =
        filters.minBathrooms === "1"
          ? 1
          : filters.minBathrooms === "1.5"
            ? 1.5
            : 2;
      where.bathrooms = { gte: minBaths };
    }

    const amenityFilters = filters.amenities ?? {};
    for (const [key, value] of Object.entries(amenityFilters)) {
      if (value) {
        // @ts-expect-error dynamic where field
        where[key] = true;
      }
    }

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

    const bandOrder: Array<"Studio" | "1BR" | "2BR" | "3BR" | "4BR" | "5BR+"> = [
      "Studio",
      "1BR",
      "2BR",
      "3BR",
      "4BR",
      "5BR+",
    ];

    const minBand =
      filters.minBedroomBand === "Any" ? undefined : filters.minBedroomBand;
    const maxBand =
      filters.maxBedroomBand === "Any" ? undefined : filters.maxBedroomBand;

    const filteredByBedroom = allMatching.filter((review) => {
      if (!minBand && !maxBand) return true;
      const band = effectiveBedroomBand(review.unit, review.bedroomCount);
      if (band === "Unknown") return false;
      const idx = bandOrder.indexOf(band as (typeof bandOrder)[number]);
      if (idx === -1) return false;
      if (minBand && idx < bandOrder.indexOf(minBand)) return false;
      if (maxBand && idx > bandOrder.indexOf(maxBand)) return false;
      return true;
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

