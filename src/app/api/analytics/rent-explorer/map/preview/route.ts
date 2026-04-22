import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildBaseWhere, resolveTimeWindow } from "@/lib/rent-explorer-filters";
import { buildExplorerMapMarkers } from "@/lib/rent-explorer-map-markers";

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

    const markers = buildExplorerMapMarkers({
      rows,
      minBedroomBand: body.minBedroomBand,
      maxBedroomBand: body.maxBedroomBand,
      bounds: body.bounds,
    });

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
        error: error instanceof Error ? error.message : "Unable to load map preview.",
      },
      { status: 400 },
    );
  }
}
