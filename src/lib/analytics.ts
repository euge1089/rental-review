import { prisma } from "@/lib/prisma";
import { SOUTH_BOSTON_ZIP_CODES } from "@/lib/policy";

export type PropertyRentStats = {
  bedroomCount: string;
  median: number | null;
  min: number | null;
  max: number | null;
};

export function summarizeRents(values: number[]): {
  median: number | null;
  min: number | null;
  max: number | null;
} {
  if (values.length === 0) {
    return { median: null, min: null, max: null };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  return {
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

// Temporary heuristic: treat units ending in A/B/C/D as 1BR/2BR/3BR/4BR bands.
export function inferBedroomBand(unit: string | null): string {
  if (!unit) return "Unknown";
  const trimmed = unit.trim().toUpperCase();
  if (/\bSTUDIO\b/.test(trimmed) || /\bSTU\b/.test(trimmed)) return "Studio";
  if (/\b1B\b/.test(trimmed) || /\b1BR\b/.test(trimmed)) return "1BR";
  if (/\b2B\b/.test(trimmed) || /\b2BR\b/.test(trimmed)) return "2BR";
  if (/\b3B\b/.test(trimmed) || /\b3BR\b/.test(trimmed)) return "3BR";
  if (/\b5B\b/.test(trimmed) || /\b5BR\b/.test(trimmed)) return "5BR+";
  if (/\b4B\b/.test(trimmed) || /\b4BR\b/.test(trimmed)) return "4BR";
  return "Unknown";
}

/** Stored review.bedroomCount: 0 studio, 1–4 exact, 5 = 5+. */
export function bedroomCountToBand(count: number): string {
  if (count === 0) return "Studio";
  if (count === 1) return "1BR";
  if (count === 2) return "2BR";
  if (count === 3) return "3BR";
  if (count === 4) return "4BR";
  return "5BR+";
}

export function effectiveBedroomBand(
  unit: string | null,
  bedroomCount: number | null,
): string {
  if (bedroomCount != null) return bedroomCountToBand(bedroomCount);
  return inferBedroomBand(unit);
}

export async function getPropertyRentStats(
  propertyId: string,
): Promise<PropertyRentStats[]> {
  const reviews = await prisma.review.findMany({
    where: {
      propertyId,
      moderationStatus: "APPROVED",
      monthlyRent: { not: null },
    },
    select: {
      monthlyRent: true,
      unit: true,
      bedroomCount: true,
    },
  });

  const buckets = new Map<string, number[]>();

  for (const review of reviews) {
    const rent = review.monthlyRent;
    if (rent == null) continue;
    const band = effectiveBedroomBand(review.unit, review.bedroomCount);
    const key = band;
    const list = buckets.get(key) ?? [];
    list.push(rent);
    buckets.set(key, list);
  }

  const entries: PropertyRentStats[] = [];

  for (const [band, rents] of buckets.entries()) {
    const { median, min, max } = summarizeRents(rents);
    entries.push({
      bedroomCount: band,
      median,
      min,
      max,
    });
  }

  return entries.sort((a, b) => a.bedroomCount.localeCompare(b.bedroomCount));
}

export type NeighborhoodRentBand = PropertyRentStats;

export async function getSouthBostonRentBands(): Promise<NeighborhoodRentBand[]> {
  const reviews = await prisma.review.findMany({
    where: {
      moderationStatus: "APPROVED",
      monthlyRent: { not: null },
      property: {
        city: "Boston",
        postalCode: { in: SOUTH_BOSTON_ZIP_CODES },
      },
    },
    select: {
      monthlyRent: true,
      unit: true,
      bedroomCount: true,
    },
  });

  const buckets = new Map<string, number[]>();

  for (const review of reviews) {
    const rent = review.monthlyRent;
    if (rent == null) continue;
    const band = effectiveBedroomBand(review.unit, review.bedroomCount);
    const list = buckets.get(band) ?? [];
    list.push(rent);
    buckets.set(band, list);
  }

  const entries: PropertyRentStats[] = [];

  for (const [band, rents] of buckets.entries()) {
    const { median, min, max } = summarizeRents(rents);
    entries.push({
      bedroomCount: band,
      median,
      min,
      max,
    });
  }

  return entries.sort((a, b) => a.bedroomCount.localeCompare(b.bedroomCount));
}


