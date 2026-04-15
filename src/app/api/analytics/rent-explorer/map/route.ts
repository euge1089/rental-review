import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { normalizeEmail } from "@/lib/normalize-email";
import { prisma } from "@/lib/prisma";
import { effectiveBedroomBand, summarizeRents } from "@/lib/analytics";
import {
  buildBaseWhere,
  matchesBedroomBand,
  resolveTimeWindow,
} from "@/lib/rent-explorer-filters";
import { snapToBlockLevel } from "@/lib/map-privacy";

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
  timeWindow: z.enum(["1y", "2y", "3y", "10y", "all"]).default("all"),
  bounds: z
    .object({
      minLat: z.number(),
      maxLat: z.number(),
      minLng: z.number(),
      maxLng: z.number(),
    })
    .optional(),
  zoom: z.number().min(8).max(20).optional(),
});

export const dynamic = "force-dynamic";

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
        error: "Submit at least one lease-year review to use Rent Explorer.",
        code: "EXPLORER_REQUIRES_REVIEW",
      },
      { status: 403 },
    );
  }

  try {
    const body = bodySchema.parse(await request.json());
    const { createdAtCutoff } = resolveTimeWindow(body);
    const where = buildBaseWhere(body, createdAtCutoff);
    where.property = {
      ...(where.property as object),
      latitude: { not: null },
      longitude: { not: null },
      ...(body.bounds
        ? {
            latitude: {
              gte: Math.min(body.bounds.minLat, body.bounds.maxLat),
              lte: Math.max(body.bounds.minLat, body.bounds.maxLat),
            },
            longitude: {
              gte: Math.min(body.bounds.minLng, body.bounds.maxLng),
              lte: Math.max(body.bounds.minLng, body.bounds.maxLng),
            },
          }
        : {}),
    };

    const rows = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: {
        property: {
          select: {
            id: true,
            addressLine1: true,
            city: true,
            state: true,
            postalCode: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    const clusters = new Map<
      string,
      {
        latitude: number;
        longitude: number;
        propertyId: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string | null;
        reviewCount: number;
        latestReviewAt: string;
        bedroomBands: Set<string>;
        rents: number[];
      }
    >();

    for (const row of rows) {
      if (
        !matchesBedroomBand(
          row.unit,
          row.bedroomCount,
          body.minBedroomBand,
          body.maxBedroomBand,
        )
      ) {
        continue;
      }

      const lat = row.property.latitude?.toNumber();
      const lng = row.property.longitude?.toNumber();
      if (lat == null || lng == null) continue;
      const snapped = snapToBlockLevel({ latitude: lat, longitude: lng });
      const key = `${snapped.latitude}:${snapped.longitude}`;
      const bedroomBand = effectiveBedroomBand(row.unit, row.bedroomCount);
      const existing = clusters.get(key);

      if (existing) {
        existing.reviewCount += 1;
        if (typeof row.monthlyRent === "number") existing.rents.push(row.monthlyRent);
        if (bedroomBand !== "Unknown") existing.bedroomBands.add(bedroomBand);
      } else {
        clusters.set(key, {
          latitude: snapped.latitude,
          longitude: snapped.longitude,
          propertyId: row.property.id,
          addressLine1: row.property.addressLine1,
          city: row.property.city,
          state: row.property.state,
          postalCode: row.property.postalCode,
          reviewCount: 1,
          latestReviewAt: row.createdAt.toISOString(),
          bedroomBands: bedroomBand === "Unknown" ? new Set() : new Set([bedroomBand]),
          rents: typeof row.monthlyRent === "number" ? [row.monthlyRent] : [],
        });
      }
    }

    const markers = [...clusters.values()]
      .map((cluster) => {
        const rentStats = summarizeRents(cluster.rents);
        return {
          latitude: cluster.latitude,
          longitude: cluster.longitude,
          propertyId: cluster.propertyId,
          addressLine1: cluster.addressLine1,
          city: cluster.city,
          state: cluster.state,
          postalCode: cluster.postalCode,
          reviewCount: cluster.reviewCount,
          medianRent: rentStats.median,
          latestReviewAt: cluster.latestReviewAt,
          bedroomBands: [...cluster.bedroomBands].sort(),
        };
      })
      .sort((a, b) => b.reviewCount - a.reviewCount);

    return NextResponse.json({
      ok: true,
      markers,
      total: markers.length,
      bounded: Boolean(body.bounds),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to load map markers.",
      },
      { status: 400 },
    );
  }
}
