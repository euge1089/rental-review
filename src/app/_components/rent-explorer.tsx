"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { bathroomsToBaAbbrev } from "@/lib/policy";
import {
  formInputCompactClass,
  formSelectCompactClass,
  surfaceElevatedClass,
  surfaceSubtleClass,
} from "@/lib/ui-classes";
import type { ExplorerMapBounds, ExplorerMapMarker } from "@/app/_components/rent-explorer-map";

const RentExplorerMap = dynamic(
  () => import("@/app/_components/rent-explorer-map").then((mod) => mod.RentExplorerMap),
  { ssr: false },
);

type Snapshot = {
  median: number | null;
  min: number | null;
  max: number | null;
  n: number;
  recentCount: number;
  recentWindowMonths: number;
  amenityPercentages: {
    hasParking: number;
    hasCentralHeatCooling: number;
    hasInUnitLaundry: number;
    hasStorageSpace: number;
    hasOutdoorSpace: number;
    petFriendly: number;
  };
};

type Item = {
  id: string;
  propertyId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  monthlyRent: number | null;
  bathrooms: number | null;
  bedroomBand: string;
  hasParking: boolean;
  hasCentralHeatCooling: boolean;
  hasInUnitLaundry: boolean;
  hasStorageSpace: boolean;
  hasOutdoorSpace: boolean;
  petFriendly: boolean;
  reviewYear: number;
  createdAt: string;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  code?: string;
  snapshot?: Snapshot;
  items?: Item[];
  hasMore?: boolean;
};

type MapApiResponse = {
  ok: boolean;
  error?: string;
  markers?: ExplorerMapMarker[];
};

const BOSTON_ZIPS = ["02127", "02210"];
const MAP_ENABLED = process.env.NEXT_PUBLIC_ENABLE_RENT_EXPLORER_MAP === "1";

type ExplorerBedroomBand =
  | "Any"
  | "Studio"
  | "1BR"
  | "2BR"
  | "3BR"
  | "4BR"
  | "5BR+";

function RentRangeBand({
  min,
  median,
  max,
}: {
  min: number;
  median: number;
  max: number;
}) {
  const span = max - min;
  const medianPct =
    span > 0 ? Math.min(100, Math.max(0, ((median - min) / span) * 100)) : 50;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue">
          Rent range
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          The bar runs from the lowest to the highest rent people reported for your
          search. The line in the middle is the middle value (half of rents are below it,
          half above).
        </p>
      </div>

      <div className="relative">
        <div
          className="relative h-11 w-full overflow-hidden rounded-full border border-zinc-200 bg-zinc-100"
          role="img"
          aria-label={`Rent from ${min} to ${max} dollars, median ${median}`}
        >
          <div className="absolute inset-y-1.5 left-2 right-2 rounded-full bg-emerald-200/90" />
          <div
            className="pointer-events-none absolute top-1/2 z-10 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-800 shadow-[0_0_0_3px_rgb(255_255_255/0.95)]"
            style={{ left: `${medianPct}%` }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Lowest
            </p>
            <p className="text-sm font-semibold tabular-nums text-zinc-800">
              ${min.toLocaleString()}
            </p>
          </div>
          <div className="text-left sm:text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
              Middle of the range
            </p>
            <p className="text-base font-semibold tabular-nums text-zinc-900">
              ${median.toLocaleString()}
              <span className="block text-[11px] font-normal text-zinc-500">
                per month
              </span>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Highest
            </p>
            <p className="text-sm font-semibold tabular-nums text-zinc-800">
              ${max.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type RentExplorerProps = {
  /** Server-supplied count; explorer stays locked until the user has ≥1 review. */
  userReviewCount: number;
};

export function RentExplorer({ userReviewCount }: RentExplorerProps) {
  const explorerLocked = userReviewCount < 1;
  const [zip, setZip] = useState<string>("any");
  const [minBedroomBand, setMinBedroomBand] =
    useState<ExplorerBedroomBand>("Any");
  const [maxBedroomBand, setMaxBedroomBand] =
    useState<ExplorerBedroomBand>("Any");
  const [minRent, setMinRent] = useState<string>("");
  const [maxRent, setMaxRent] = useState<string>("");
  const [minBathrooms, setMinBathrooms] = useState<"Any" | "1" | "1.5" | "2">("Any");
  const [amenities, setAmenities] = useState({
    hasParking: false,
    hasCentralHeatCooling: false,
    hasInUnitLaundry: false,
    hasStorageSpace: false,
    hasOutdoorSpace: false,
    petFriendly: false,
  });
  const [timeWindow, setTimeWindow] = useState<"1y" | "2y" | "3y" | "10y" | "all">("all");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<ExplorerMapMarker[]>([]);
  const [mapBounds, setMapBounds] = useState<ExplorerMapBounds | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const mapAbortRef = useRef<AbortController | null>(null);

  const activeAmenityFilters = useMemo(
    () => Object.values(amenities).some(Boolean),
    [amenities],
  );

  function buildPayload(nextPage: number) {
    return {
      zipCodes: zip === "any" ? [] : [zip],
      minBedroomBand,
      maxBedroomBand,
      minMonthlyRent: minRent ? Number(minRent) : undefined,
      maxMonthlyRent: maxRent ? Number(maxRent) : undefined,
      minBathrooms,
      amenities,
      timeWindow,
      page: nextPage,
    };
  }

  async function fetchPage(nextPage: number, append: boolean) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analytics/rent-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(nextPage)),
      });
      const data = (await response.json()) as ApiResponse;
      if (!data.ok || !data.snapshot || !data.items) {
        setError(data.error ?? "Couldn't load this page. Try again.");
        return;
      }
      setSnapshot(data.snapshot);
      setHasMore(Boolean(data.hasMore));
      if (append) {
        setItems((prev) => [...prev, ...data.items!]);
      } else {
        setItems(data.items);
      }
      setPage(nextPage);
      setHasSearched(true);
      if (!append && data.items.length > 0 && selectedPropertyId == null) {
        setSelectedPropertyId(data.items[0]?.propertyId ?? null);
      }
    } catch {
      setError("Couldn't load this page. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMarkers(boundsOverride?: ExplorerMapBounds | null) {
    if (!MAP_ENABLED || explorerLocked) return;
    const bounds = boundsOverride ?? mapBounds;
    if (!bounds) return;

    mapAbortRef.current?.abort();
    const controller = new AbortController();
    mapAbortRef.current = controller;
    setIsMapLoading(true);
    setMapError(null);

    try {
      const response = await fetch("/api/analytics/rent-explorer/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildPayload(0),
          bounds,
        }),
        signal: controller.signal,
      });
      const data = (await response.json()) as MapApiResponse;
      if (!data.ok || !data.markers) {
        setMapError(data.error ?? "Couldn't load map points.");
        return;
      }
      setMapMarkers(data.markers);
      if (data.markers.length > 0 && selectedPropertyId == null) {
        setSelectedPropertyId(data.markers[0]?.propertyId ?? null);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMapError("Couldn't load map points.");
    } finally {
      setIsMapLoading(false);
    }
  }

  function handleUpdate() {
    void fetchPage(0, false);
    void fetchMarkers();
  }

  function handleClear() {
    setZip("any");
    setMinBedroomBand("Any");
    setMaxBedroomBand("Any");
    setMinRent("");
    setMaxRent("");
    setMinBathrooms("Any");
    setAmenities({
      hasParking: false,
      hasCentralHeatCooling: false,
      hasInUnitLaundry: false,
      hasStorageSpace: false,
      hasOutdoorSpace: false,
      petFriendly: false,
    });
    setTimeWindow("all");
    setSnapshot(null);
    setItems([]);
    setMapMarkers([]);
    setSelectedPropertyId(null);
    setHasMore(false);
    setError(null);
    setMapError(null);
    setHasSearched(false);
  }

  useEffect(() => {
    if (explorerLocked) return;
    void fetchPage(0, false);
    void fetchMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorerLocked]);

  useEffect(() => {
    if (!MAP_ENABLED || explorerLocked || !mapBounds) return;
    const timer = window.setTimeout(() => {
      void fetchMarkers();
    }, 200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    explorerLocked,
    mapBounds,
    zip,
    minBedroomBand,
    maxBedroomBand,
    minRent,
    maxRent,
    minBathrooms,
    amenities,
    timeWindow,
  ]);

  const lowData = snapshot && snapshot.n > 0 && snapshot.n < 5;

  const contributionN =
    snapshot?.n != null && !Number.isNaN(snapshot.n) ? snapshot.n : 0;

  function formatTimeWindowLabel(window: "1y" | "2y" | "3y" | "10y" | "all") {
    if (window === "all") return "all time";
    const years =
      window === "1y" ? 1 : window === "2y" ? 2 : window === "3y" ? 3 : 10;
    return years === 1 ? "last 1 year" : `last ${years} years`;
  }

  function monthsAgoLabel(isoDate: string) {
    const created = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMonths = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));
    if (diffMonths <= 0) return "Reviewed this month";
    if (diffMonths === 1) return "Reviewed 1 month ago";
    return `Reviewed ${diffMonths} months ago`;
  }

  function bedroomsBathroomsLabel(item: Item) {
    const parts: string[] = [];
    if (item.bedroomBand && item.bedroomBand !== "Unknown") {
      parts.push(item.bedroomBand);
    }
    const bathAbbrev = bathroomsToBaAbbrev(item.bathrooms);
    if (bathAbbrev) parts.push(bathAbbrev);
    return parts.join(", ");
  }

  function reviewYearToPrivacyBucket(reviewYear: number): string {
    const nowYear = new Date().getFullYear();
    const yearsAgo = Math.max(0, nowYear - reviewYear);
    if (yearsAgo <= 2) return "Recent (within ~2 years)";
    if (yearsAgo <= 5) return "A few years ago (2-5 years)";
    return "Older experience (5+ years)";
  }

  const rangeLine =
    snapshot &&
    typeof snapshot.min === "number" &&
    typeof snapshot.max === "number"
      ? `From $${snapshot.min.toLocaleString()} to $${snapshot.max.toLocaleString()} across ${snapshot.n} review${snapshot.n === 1 ? "" : "s"}`
      : snapshot
        ? `Based on ${snapshot.n} review${snapshot.n === 1 ? "" : "s"}`
        : null;

  const noMatches = hasSearched && items.length === 0;

  const selectClass = `${formSelectCompactClass} min-w-0`;
  const chipBase =
    "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white";
  const chipOff = "border-zinc-200/90 bg-white text-zinc-600 hover:border-muted-blue/25 hover:bg-muted-blue-tint/30";

  return (
    <div className="flex flex-col gap-10">
      <div className="relative flex flex-col gap-10">
        <div
          className={`flex flex-col gap-10 ${explorerLocked ? "pointer-events-none select-none blur-md" : ""}`}
          aria-hidden={explorerLocked}
        >
      {/* Search + filters */}
      <section className={`${surfaceElevatedClass} space-y-5 p-4 sm:space-y-6 sm:p-6 md:p-8`}>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue">
            Your search
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-muted-blue-hover sm:text-2xl">
            Where are you looking?
          </h2>
          <p className="overflow-x-auto whitespace-nowrap text-sm leading-relaxed text-zinc-600">
            Start with a Boston ZIP and rough budget. We&apos;ll show what renters reported, then you can narrow with optional filters.
          </p>
        </div>
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-zinc-600">ZIP</label>
              <select
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className={`${selectClass} w-32`}
              >
                <option value="any">Any</option>
                {BOSTON_ZIPS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid min-w-0 gap-1.5">
              <label className="text-xs font-medium text-zinc-600">
                Bedrooms (min and max)
              </label>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <select
                  value={minBedroomBand}
                  onChange={(e) =>
                    setMinBedroomBand(e.target.value as ExplorerBedroomBand)
                  }
                  className={`${selectClass} min-w-[5.25rem] max-w-full flex-1 sm:w-28 sm:flex-none sm:min-w-0`}
                >
                  <option value="Any">Any</option>
                  <option value="Studio">Studio</option>
                  <option value="1BR">1+</option>
                  <option value="2BR">2+</option>
                  <option value="3BR">3+</option>
                  <option value="4BR">4+</option>
                  <option value="5BR+">5+</option>
                </select>
                <span className="shrink-0 text-xs text-zinc-400">to</span>
                <select
                  value={maxBedroomBand}
                  onChange={(e) =>
                    setMaxBedroomBand(e.target.value as ExplorerBedroomBand)
                  }
                  className={`${selectClass} min-w-[5.25rem] max-w-full flex-1 sm:w-28 sm:flex-none sm:min-w-0`}
                >
                  <option value="Any">Any</option>
                  <option value="Studio">Studio</option>
                  <option value="1BR">1</option>
                  <option value="2BR">2</option>
                  <option value="3BR">3</option>
                  <option value="4BR">4</option>
                  <option value="5BR+">5+</option>
                </select>
              </div>
            </div>

            <div className="grid min-w-[min(100%,16rem)] flex-1 gap-1.5">
              <label className="text-xs font-medium text-zinc-600">
                Monthly rent range
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value)}
                  placeholder="Min"
                  className={`${formInputCompactClass} w-28 flex-1 sm:max-w-[8.5rem]`}
                />
                <span className="text-xs text-zinc-400">to</span>
                <input
                  type="number"
                  min={0}
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  placeholder="Max"
                  className={`${formInputCompactClass} w-28 flex-1 sm:max-w-[8.5rem]`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition active:bg-muted-blue-hover/95 hover:bg-muted-blue-hover disabled:opacity-60"
            >
              {isLoading ? "Updating…" : "Show results"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 disabled:opacity-60"
            >
              Reset filters
            </button>
          </div>
        </div>

        <details className="group rounded-2xl border border-zinc-200/80 bg-muted-blue-tint/25 transition open:bg-muted-blue-tint/40">
          <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 py-3 text-sm font-semibold text-muted-blue-hover [&::-webkit-details-marker]:hidden">
            <span className="flex w-full min-w-0 items-center justify-between gap-2">
              More filters (optional)
              <span className="inline-block text-zinc-400 transition-transform duration-200 group-open:rotate-180">
                ▼
              </span>
            </span>
          </summary>
          <div className="space-y-4 border-t border-zinc-200/60 px-4 py-4">
            <div className="flex flex-wrap items-end gap-6">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-zinc-600">Bathrooms</label>
                <select
                  value={minBathrooms}
                  onChange={(e) =>
                    setMinBathrooms(e.target.value as "Any" | "1" | "1.5" | "2")
                  }
                  className={`${selectClass} w-36`}
                >
                  <option value="Any">Any</option>
                  <option value="1">1+</option>
                  <option value="1.5">1.5+</option>
                  <option value="2">2+</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-zinc-600">
                  How far back to look
                </label>
                <select
                  value={timeWindow}
                  onChange={(e) =>
                    setTimeWindow(
                      e.target.value as "1y" | "2y" | "3y" | "10y" | "all",
                    )
                  }
                  className={`${selectClass} min-w-[11rem]`}
                >
                  <option value="1y">Last 1 year</option>
                  <option value="2y">Last 2 years</option>
                  <option value="3y">Last 3 years</option>
                  <option value="10y">Last 10 years</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium text-zinc-600">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["hasParking", "Parking"],
                    ["hasCentralHeatCooling", "Central heat/cooling"],
                    ["hasInUnitLaundry", "In-unit laundry"],
                    ["hasStorageSpace", "Storage"],
                    ["hasOutdoorSpace", "Outdoor space"],
                    ["petFriendly", "Pet-friendly"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className={`${chipBase} ${chipOff}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={amenities[key]}
                      onChange={(e) =>
                        setAmenities((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </details>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {snapshot ? (
        <>
          <section className="rounded-3xl border border-zinc-200/90 bg-muted-blue-tint px-5 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 border-b border-zinc-200/80 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue">
                Summary
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-muted-blue-hover sm:text-xl">
                Market analytics for your filters
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-blue">
                  Typical rent
                </p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums text-muted-blue-hover">
                  {typeof snapshot.median === "number"
                    ? `$${snapshot.median.toLocaleString()}`
                    : "-"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {rangeLine ?? `n = ${snapshot.n.toLocaleString()}`}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-blue">
                  Range
                </p>
                <p className="mt-1.5 text-lg font-semibold tabular-nums text-muted-blue-hover">
                  {typeof snapshot.min === "number" &&
                  typeof snapshot.max === "number"
                    ? `$${snapshot.min.toLocaleString()}–$${snapshot.max.toLocaleString()}`
                    : "Not enough to show"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  From {snapshot.n.toLocaleString()} review
                  {snapshot.n === 1 ? "" : "s"} that matched.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-blue">
                  Recent reviews
                </p>
                <p className="mt-1.5 text-lg font-semibold text-muted-blue-hover">
                  {snapshot.recentCount.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Posted in the {formatTimeWindowLabel(timeWindow)} you selected.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-blue">
                  Amenities
                </p>
                {snapshot.n > 0 ? (
                  <>
                    <p className="mt-1.5 text-sm font-semibold text-muted-blue-hover">
                      Laundry {snapshot.amenityPercentages.hasInUnitLaundry}% · Parking{" "}
                      {snapshot.amenityPercentages.hasParking}%
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Out of reviews that matched your search, how often people said
                      they had these.
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 text-xs text-zinc-500">Not enough data yet.</p>
                )}
              </div>
            </div>

            {lowData ? (
              <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-900">
                Only a few reviews so far - take these numbers as a rough idea, not a
                firm answer.
              </p>
            ) : null}
            <p className="mt-3 text-xs text-zinc-600">
              Based on reviews that match what you picked. One apartment can be higher
              or lower than these - they&apos;re averages and ranges, not guarantees.
            </p>
          </section>

          {/* Rent range bar */}
          {typeof snapshot.median === "number" &&
            snapshot.min != null &&
            snapshot.max != null && (
              <section
                className={`${surfaceSubtleClass} p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-8`}
              >
                <RentRangeBand
                  min={snapshot.min}
                  median={snapshot.median}
                  max={snapshot.max}
                />
              </section>
            )}
        </>
      ) : null}

      {MAP_ENABLED ? (
        <section className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue">
              Interactive map
            </p>
            <p className="text-sm text-zinc-600">
              Move the map to load points in view. Filters above apply to both map and list.
            </p>
          </div>
          <RentExplorerMap
            markers={mapMarkers}
            selectedPropertyId={selectedPropertyId}
            isLoading={isMapLoading}
            onMarkerClick={(propertyId) => setSelectedPropertyId(propertyId)}
            onBoundsChange={(bounds) => {
              setMapBounds(bounds);
            }}
          />
          {mapError ? (
            <p className="text-sm text-red-600" role="alert">
              {mapError}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Results list */}
      <section
        className={`${surfaceElevatedClass} space-y-5 p-6 sm:p-8`}
      >
        <div className="flex flex-col gap-2 border-b border-zinc-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue">
              Reviews
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-muted-blue-hover">
              Reviews that match your search
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600">
              Newest first, up to 10 per page in two columns. Open one for the full
              building page.
            </p>
          </div>
          {!noMatches && (
            <p className="text-sm text-zinc-500">Page {page + 1}</p>
          )}
        </div>

        {noMatches ? (
          <div className="space-y-4 text-sm text-zinc-600">
            <p>
              No reviews match yet. Try a wider ZIP, rent range, or bedroom count.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
                onClick={() => {
                  setMinBedroomBand("Any");
                  setMaxBedroomBand("Any");
                }}
              >
                Show all bedrooms
              </button>
              {activeAmenityFilters ? (
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
                  onClick={() =>
                    setAmenities({
                      hasParking: false,
                      hasCentralHeatCooling: false,
                      hasInUnitLaundry: false,
                      hasStorageSpace: false,
                      hasOutdoorSpace: false,
                      petFriendly: false,
                    })
                  }
                >
                  Clear amenities
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto w-full max-w-4xl rounded-2xl border border-zinc-100 bg-muted-blue-tint/25 p-2.5 sm:p-4">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:gap-x-4 md:gap-y-3">
                {items.map((item) => {
                  const bbLabel = bedroomsBathroomsLabel(item);
                  const amenityLabels: string[] = [];
                  if (item.hasInUnitLaundry) amenityLabels.push("In-unit laundry");
                  if (item.hasParking) amenityLabels.push("Parking");
                  if (item.petFriendly) amenityLabels.push("Pet friendly");
                  if (item.hasOutdoorSpace) amenityLabels.push("Outdoor space");
                  if (item.hasStorageSpace) amenityLabels.push("Storage");
                  if (item.hasCentralHeatCooling)
                    amenityLabels.push("Central heat/cooling");

                  return (
                    <li key={item.id} className="min-w-0">
                      <Link
                        href={`/properties/${item.propertyId}`}
                        onMouseEnter={() => setSelectedPropertyId(item.propertyId)}
                        className={`group flex h-full min-h-[7.25rem] flex-col gap-1.5 rounded-xl border bg-white px-3 py-3 text-zinc-800 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition hover:border-muted-blue/30 hover:shadow-[0_8px_24px_-12px_rgb(15_23_42/0.1)] sm:min-h-[7.5rem] sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3.5 ${
                          selectedPropertyId === item.propertyId
                            ? "border-muted-blue/40 ring-2 ring-muted-blue/20"
                            : "border-zinc-200/90"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-muted-blue-hover group-hover:underline sm:text-[15px]">
                            {item.addressLine1}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-zinc-600 sm:text-sm">
                            {item.city}, {item.state} {item.postalCode ?? ""}
                          </p>
                        </div>
                        <div className="mt-auto flex flex-col gap-0.5 border-t border-zinc-100/90 pt-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2 sm:gap-y-1 sm:pt-2.5">
                          {typeof item.monthlyRent === "number" ? (
                            <span className="text-xs font-semibold tabular-nums text-muted-blue-hover sm:text-sm">
                              ~${item.monthlyRent.toLocaleString()}
                              <span className="text-[11px] font-normal text-zinc-500 sm:text-xs">
                                {" "}
                                /mo
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-zinc-400 sm:text-sm">
                              Rent n/a
                            </span>
                          )}
                          {bbLabel ? (
                            <span className="text-xs text-zinc-600 sm:text-sm">
                              {bbLabel}
                            </span>
                          ) : null}
                        </div>
                        {amenityLabels.length > 0 ? (
                          <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-600 sm:text-xs">
                            {amenityLabels.join(" · ")}
                          </p>
                        ) : null}
                        <p className="text-[11px] text-zinc-500 sm:text-xs">
                          {monthsAgoLabel(item.createdAt)} ·{" "}
                          {reviewYearToPrivacyBucket(item.reviewYear)}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {items.length} of {snapshot ? snapshot.n.toLocaleString() : "?"}{" "}
                reviews
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fetchPage(Math.max(0, page - 1), false)}
                  disabled={page === 0 || isLoading}
                  className="inline-flex min-h-11 min-w-[6.5rem] items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => fetchPage(page + 1, false)}
                  disabled={!hasMore || isLoading}
                  className="inline-flex min-h-11 min-w-[6.5rem] items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-muted-blue-hover px-6 py-8 text-center shadow-elevated sm:px-10 sm:py-10 sm:text-left">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
            Add your rental history
          </p>
          <p className="mt-3 text-base leading-relaxed text-white/85">
            Right now this is built from{" "}
            <span className="font-semibold text-white">
              {contributionN} review{contributionN === 1 ? "" : "s"}
            </span>{" "}
            from renters. If your building isn&apos;t here yet, adding yours helps the
            next person who looks.
          </p>
          <Link
            href="/submit"
            className="mt-5 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-muted-blue-hover shadow-lg shadow-black/15 ring-1 ring-white/80 transition hover:bg-zinc-50"
          >
            Write a review
          </Link>
        </div>
      </section>
        </div>

        {explorerLocked ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6 sm:p-10"
            role="presentation"
          >
            <div
              className={`${surfaceElevatedClass} pointer-events-auto max-w-md space-y-4 border-2 border-accent-teal/30 p-6 text-center shadow-elevated sm:p-8`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="rent-explorer-gate-title"
              aria-describedby="rent-explorer-gate-desc"
            >
              <p
                id="rent-explorer-gate-title"
                className="text-base font-semibold text-muted-blue-hover"
              >
                Unlock Rent Explorer
              </p>
              <p
                id="rent-explorer-gate-desc"
                className="text-sm leading-relaxed text-zinc-600"
              >
                Share your first lease-year review to see market summaries and matching
                reviews. Historical rent helps you spot unusual increases and negotiate
                from real renter comps.
              </p>
              <Link
                href="/submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(21_42_69/0.35)] transition motion-safe:hover:bg-muted-blue-hover"
              >
                Leave your first review
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
