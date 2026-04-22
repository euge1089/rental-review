import { effectiveBedroomBand, summarizeRents } from "@/lib/analytics";
import { matchesBedroomBand } from "@/lib/rent-explorer-filters";
import { snapToBlockLevel } from "@/lib/map-privacy";

export type ExplorerMapMarker = {
  latitude: number;
  longitude: number;
  propertyId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  reviewCount: number;
  medianRent: number | null;
  latestReviewAt: string;
  bedroomBands: string[];
};

export function buildExplorerMapMarkers(args: {
  rows: Array<{
    monthlyRent: number | null;
    unit: string | null;
    bedroomCount: number | null;
    createdAt: Date;
    property: {
      id: string;
      addressLine1: string;
      city: string;
      state: string;
      postalCode: string | null;
      latitude: unknown;
      longitude: unknown;
    };
  }>;
  minBedroomBand: Parameters<typeof matchesBedroomBand>[2];
  maxBedroomBand: Parameters<typeof matchesBedroomBand>[3];
  bounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}): ExplorerMapMarker[] {
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

  for (const row of args.rows) {
    if (
      !matchesBedroomBand(
        row.unit,
        row.bedroomCount,
        args.minBedroomBand,
        args.maxBedroomBand,
      )
    ) {
      continue;
    }

    const latRaw = row.property.latitude as unknown;
    const lngRaw = row.property.longitude as unknown;
    const lat =
      latRaw && typeof latRaw === "object" && "toNumber" in latRaw
        ? (latRaw as { toNumber: () => number }).toNumber()
        : typeof latRaw === "number"
          ? latRaw
          : latRaw != null
            ? Number(latRaw)
            : NaN;
    const lng =
      lngRaw && typeof lngRaw === "object" && "toNumber" in lngRaw
        ? (lngRaw as { toNumber: () => number }).toNumber()
        : typeof lngRaw === "number"
          ? lngRaw
          : lngRaw != null
            ? Number(lngRaw)
            : NaN;
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) continue;

    if (args.bounds) {
      const minLat = Math.min(args.bounds.minLat, args.bounds.maxLat);
      const maxLat = Math.max(args.bounds.minLat, args.bounds.maxLat);
      const minLng = Math.min(args.bounds.minLng, args.bounds.maxLng);
      const maxLng = Math.max(args.bounds.minLng, args.bounds.maxLng);
      if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) continue;
    }

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

  return [...clusters.values()]
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
}
