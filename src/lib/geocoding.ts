import type { GeocodeStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { geocodeQueryAddress } from "@/lib/normalize-address";

type PropertyGeocodeState = {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  geocodeStatus: GeocodeStatus;
  geocodeQueryAddress: string | null;
  geocodedAt: Date | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
};

type GeocodePoint = {
  latitude: number;
  longitude: number;
};

const MAPBOX_GEOCODE_ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places";

function geocodingToken(): string | null {
  const candidate =
    process.env.MAPBOX_GEOCODING_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN ?? null;
  const trimmed = candidate?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

async function geocodeWithMapbox(queryAddress: string): Promise<GeocodePoint | null> {
  const token = geocodingToken();
  if (!token) return null;

  const endpoint = `${MAPBOX_GEOCODE_ENDPOINT}/${encodeURIComponent(queryAddress)}.json?access_token=${encodeURIComponent(
    token,
  )}&autocomplete=false&limit=1&types=address&country=US`;

  const response = await fetch(endpoint, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Geocoder request failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    features?: Array<{ center?: [number, number] }>;
  };
  const center = payload.features?.[0]?.center;
  if (!center || center.length !== 2) return null;
  return { longitude: center[0], latitude: center[1] };
}

export function deriveGeocodeQueryFromPropertyAddress(input: {
  addressLine1: string;
  city: string;
  state: string;
  postalCode?: string | null;
}): string {
  return geocodeQueryAddress(
    input.addressLine1,
    input.city,
    input.state,
    input.postalCode,
  );
}

export async function queuePropertyForGeocoding(property: PropertyGeocodeState) {
  const queryAddress =
    property.geocodeQueryAddress?.trim() ||
    deriveGeocodeQueryFromPropertyAddress({
      addressLine1: property.addressLine1,
      city: property.city,
      state: property.state,
      postalCode: property.postalCode,
    });

  const queryChanged = property.geocodeQueryAddress !== queryAddress;
  const missingCoordinates = property.latitude == null || property.longitude == null;
  const shouldQueue =
    queryChanged || missingCoordinates || property.geocodeStatus !== "SUCCESS";
  if (!shouldQueue) return;

  await prisma.property.update({
    where: { id: property.id },
    data: {
      geocodeQueryAddress: queryAddress,
      geocodeStatus: "PENDING",
      geocodeError: null,
      geocodedAt: queryChanged ? null : property.geocodedAt,
      ...(queryChanged ? { latitude: null, longitude: null } : {}),
    },
  });
}

export async function runPropertyGeocodeBackfill(limit = 50) {
  const token = geocodingToken();
  if (!token) {
    return {
      ok: false as const,
      error:
        "MAPBOX_GEOCODING_TOKEN or MAPBOX_ACCESS_TOKEN must be set for geocode backfill.",
    };
  }

  const candidates = await prisma.property.findMany({
    where: {
      city: { equals: "Boston", mode: "insensitive" },
      OR: [
        { geocodeStatus: "PENDING" },
        { geocodeStatus: "NOT_STARTED" },
        { geocodeStatus: "FAILED" },
      ],
    },
    orderBy: [{ geocodeStatus: "asc" }, { updatedAt: "asc" }],
    take: Math.max(1, Math.min(limit, 200)),
  });

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const property of candidates) {
    const queryAddress =
      property.geocodeQueryAddress?.trim() ||
      deriveGeocodeQueryFromPropertyAddress({
        addressLine1: property.addressLine1,
        city: property.city,
        state: property.state,
        postalCode: property.postalCode,
      });

    if (!queryAddress) {
      skipped += 1;
      await prisma.property.update({
        where: { id: property.id },
        data: {
          geocodeStatus: "FAILED",
          geocodeError: "Missing address query for geocoding.",
        },
      });
      continue;
    }

    try {
      const point = await geocodeWithMapbox(queryAddress);
      if (!point) {
        failed += 1;
        await prisma.property.update({
          where: { id: property.id },
          data: {
            geocodeStatus: "FAILED",
            geocodeQueryAddress: queryAddress,
            geocodeError: "No geocode result.",
          },
        });
        continue;
      }

      await prisma.property.update({
        where: { id: property.id },
        data: {
          geocodeStatus: "SUCCESS",
          geocodeQueryAddress: queryAddress,
          latitude: point.latitude,
          longitude: point.longitude,
          geocodeError: null,
          geocodedAt: new Date(),
        },
      });
      success += 1;
    } catch (error) {
      failed += 1;
      await prisma.property.update({
        where: { id: property.id },
        data: {
          geocodeStatus: "FAILED",
          geocodeQueryAddress: queryAddress,
          geocodeError:
            error instanceof Error ? error.message.slice(0, 300) : "Unknown geocode error.",
        },
      });
    }
  }

  return {
    ok: true as const,
    examined: candidates.length,
    success,
    failed,
    skipped,
  };
}
