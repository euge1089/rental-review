import type { Prisma } from "@prisma/client";
import { effectiveBedroomBand } from "@/lib/analytics";

export type ExplorerBedroomBand =
  | "Any"
  | "Studio"
  | "1BR"
  | "2BR"
  | "3BR"
  | "4BR"
  | "5BR+";

export type ExplorerFilterInput = {
  zipCodes?: string[];
  minBedroomBand: ExplorerBedroomBand;
  maxBedroomBand: ExplorerBedroomBand;
  minMonthlyRent?: number;
  maxMonthlyRent?: number;
  minBathrooms: "Any" | "1" | "1.5" | "2";
  amenities?: {
    hasParking?: boolean;
    hasCentralHeatCooling?: boolean;
    hasInUnitLaundry?: boolean;
    hasStorageSpace?: boolean;
    hasOutdoorSpace?: boolean;
    petFriendly?: boolean;
  };
  timeWindow: "1y" | "2y" | "3y" | "10y" | "all";
};

const bandOrder: Array<"Studio" | "1BR" | "2BR" | "3BR" | "4BR" | "5BR+"> = [
  "Studio",
  "1BR",
  "2BR",
  "3BR",
  "4BR",
  "5BR+",
];

export function resolveTimeWindow(filters: ExplorerFilterInput): {
  createdAtCutoff: Date | undefined;
  recentWindowMonths: number;
} {
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
  return { createdAtCutoff, recentWindowMonths };
}

export function buildBaseWhere(
  filters: ExplorerFilterInput,
  createdAtCutoff?: Date,
): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = {
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
            ...(filters.minMonthlyRent != null ? { gte: filters.minMonthlyRent } : {}),
            ...(filters.maxMonthlyRent != null ? { lte: filters.maxMonthlyRent } : {}),
          },
        }
      : {}),
    ...(createdAtCutoff ? { createdAt: { gte: createdAtCutoff } } : {}),
  };

  if (filters.minBathrooms !== "Any") {
    const minBaths =
      filters.minBathrooms === "1" ? 1 : filters.minBathrooms === "1.5" ? 1.5 : 2;
    where.bathrooms = { gte: minBaths };
  }

  const amenityFilters = filters.amenities ?? {};
  for (const [key, value] of Object.entries(amenityFilters)) {
    if (value) {
      // @ts-expect-error dynamic where field
      where[key] = true;
    }
  }

  return where;
}

export function matchesBedroomBand(
  unit: string | null,
  bedroomCount: number | null,
  minBedroomBand: ExplorerBedroomBand,
  maxBedroomBand: ExplorerBedroomBand,
): boolean {
  const minBand = minBedroomBand === "Any" ? undefined : minBedroomBand;
  const maxBand = maxBedroomBand === "Any" ? undefined : maxBedroomBand;
  if (!minBand && !maxBand) return true;

  const band = effectiveBedroomBand(unit, bedroomCount);
  if (band === "Unknown") return false;
  const idx = bandOrder.indexOf(band as (typeof bandOrder)[number]);
  if (idx === -1) return false;
  if (minBand && idx < bandOrder.indexOf(minBand)) return false;
  if (maxBand && idx > bandOrder.indexOf(maxBand)) return false;
  return true;
}
