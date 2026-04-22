"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { EmailAuthPanel } from "@/app/_components/email-auth-panel";
import { bathroomsToBaAbbrev } from "@/lib/policy";
import {
  formInputCompactClass,
  formSelectCompactClass,
  surfaceElevatedClass,
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

type ReviewSortMode = "recent" | "rent-asc" | "rent-desc";

const MAP_ENABLED = process.env.NEXT_PUBLIC_ENABLE_RENT_EXPLORER_MAP === "1";

/** ~1pt up from `text-xs` (12px): section eyebrows / labels */
const explorerEyebrowClass =
  "text-[13px] font-semibold uppercase tracking-[0.2em] text-pop";
/** ~2pt up from `text-sm` (14px): supporting paragraphs */
const explorerBodyLeadClass = "text-[1.04rem] leading-relaxed text-zinc-600";
const explorerLabelClass = "text-[13px] font-medium text-zinc-600";
/** Phone-only Your search fields: clearer, warmer labels */
const explorerMobileSearchFieldLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-blue";
const explorerMobileSearchControlClass =
  "border-muted-blue/30 bg-white shadow-sm ring-1 ring-muted-blue/15 focus:border-muted-blue/55 focus:ring-2 focus:ring-muted-blue/25";

type ExplorerBedroomBand =
  | "Any"
  | "Studio"
  | "1BR"
  | "2BR"
  | "3BR"
  | "4BR"
  | "5BR+";

type ExplorerAmenitiesState = {
  hasParking: boolean;
  hasCentralHeatCooling: boolean;
  hasInUnitLaundry: boolean;
  hasStorageSpace: boolean;
  hasOutdoorSpace: boolean;
  petFriendly: boolean;
};

const BEDROOM_BAND_ORDER: Exclude<ExplorerBedroomBand, "Any">[] = [
  "Studio",
  "1BR",
  "2BR",
  "3BR",
  "4BR",
  "5BR+",
];

function bedroomBandIndex(b: ExplorerBedroomBand): number | null {
  if (b === "Any") return null;
  const i = BEDROOM_BAND_ORDER.indexOf(b);
  return i >= 0 ? i : null;
}

function shortBandToken(b: Exclude<ExplorerBedroomBand, "Any">): string {
  if (b === "Studio") return "studio";
  if (b === "5BR+") return "5+";
  return b.replace("BR", "");
}

function singleBedroomPhrase(b: Exclude<ExplorerBedroomBand, "Any">): string {
  if (b === "Studio") return "studio";
  if (b === "5BR+") return "5+ bedroom";
  const n = b.replace("BR", "");
  return n === "1" ? "1 bedroom" : `${n} bedroom`;
}

function bedroomQualifier(
  minBedroomBand: ExplorerBedroomBand,
  maxBedroomBand: ExplorerBedroomBand,
): string | null {
  const minI = bedroomBandIndex(minBedroomBand);
  const maxI = bedroomBandIndex(maxBedroomBand);
  if (minI == null && maxI == null) return null;

  let lo = minI;
  let hi = maxI;
  if (lo != null && hi != null && lo > hi) {
    const t = lo;
    lo = hi;
    hi = t;
  }

  if (lo != null && hi == null) {
    const b = BEDROOM_BAND_ORDER[lo];
    if (b === "Studio") return "studio and larger";
    if (b === "5BR+") return "5+ bedroom";
    return `${shortBandToken(b)}+ bedroom`;
  }

  if (lo == null && hi != null) {
    const b = BEDROOM_BAND_ORDER[hi];
    if (b === "Studio") return "studio";
    return `up to ${singleBedroomPhrase(b)}`;
  }

  const lowB = BEDROOM_BAND_ORDER[lo!];
  const highB = BEDROOM_BAND_ORDER[hi!];
  if (lo === hi) return singleBedroomPhrase(lowB);
  return `${shortBandToken(lowB)}–${shortBandToken(highB)} bedroom`;
}

function rentFilterClause(minRent: string, maxRent: string): string | null {
  const minN = minRent.trim() ? Number(minRent) : null;
  const maxN = maxRent.trim() ? Number(maxRent) : null;
  const minOk = minN != null && Number.isFinite(minN);
  const maxOk = maxN != null && Number.isFinite(maxN);
  if (!minOk && !maxOk) return null;
  if (minOk && maxOk) return `$${minN!.toLocaleString()}–$${maxN!.toLocaleString()}/mo`;
  if (minOk) return `from $${minN!.toLocaleString()}/mo`;
  return `up to $${maxN!.toLocaleString()}/mo`;
}

function bathFilterClause(minBathrooms: "Any" | "1" | "1.5" | "2"): string | null {
  if (minBathrooms === "Any") return null;
  return `${minBathrooms}+ baths`;
}

const AMENITY_DESCRIPTIONS: { key: keyof ExplorerAmenitiesState; phrase: string }[] = [
  { key: "hasParking", phrase: "parking" },
  { key: "hasCentralHeatCooling", phrase: "central heat/cooling" },
  { key: "hasInUnitLaundry", phrase: "in-unit laundry" },
  { key: "hasStorageSpace", phrase: "storage" },
  { key: "hasOutdoorSpace", phrase: "outdoor space" },
  { key: "petFriendly", phrase: "pet-friendly" },
];

function formatNaturalList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)!}`;
}

const MAX_SELECTED_ZIP_CODES = 30;

/** Split on commas / whitespace; pull first 5 digits from each token. */
function parseFiveDigitZipCandidates(raw: string): string[] {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const token of tokens) {
    const digits = token.replace(/\D/g, "").slice(0, 5);
    if (digits.length === 5) out.push(digits);
  }
  return out;
}

function reviewsTimeClause(window: "1y" | "2y" | "3y" | "10y" | "all"): string | null {
  if (window === "all") return null;
  const years =
    window === "1y" ? 1 : window === "2y" ? 2 : window === "3y" ? 3 : 10;
  if (years === 1) return "using reviews from the past year";
  return `using reviews from the past ${years} years`;
}

function buildPersonalizedAnalyticsHeading(opts: {
  zipCodes: string[];
  minBedroomBand: ExplorerBedroomBand;
  maxBedroomBand: ExplorerBedroomBand;
  minRent: string;
  maxRent: string;
  minBathrooms: "Any" | "1" | "1.5" | "2";
  amenities: ExplorerAmenitiesState;
  timeWindow: "1y" | "2y" | "3y" | "10y" | "all";
}): string {
  const prefix = "Personalized Market Analytics for ";

  const zipFiltered = opts.zipCodes.length > 0;
  const bedroomQ = bedroomQualifier(opts.minBedroomBand, opts.maxBedroomBand);
  const rentQ = rentFilterClause(opts.minRent, opts.maxRent);
  const bathQ = bathFilterClause(opts.minBathrooms);
  const amenityPhrases = AMENITY_DESCRIPTIONS.filter((a) => opts.amenities[a.key]).map(
    (a) => a.phrase,
  );
  const amenityQ =
    amenityPhrases.length > 0 ? `with ${formatNaturalList(amenityPhrases)}` : null;
  const timeQ = reviewsTimeClause(opts.timeWindow);

  const hasAnyFilter =
    zipFiltered ||
    bedroomQ != null ||
    rentQ != null ||
    bathQ != null ||
    amenityQ != null ||
    timeQ != null;

  if (!hasAnyFilter) {
    return "Personalized analytics for your search";
  }

  const bedroomPart = bedroomQ ? `${bedroomQ} ` : "";
  const sortedZips = [...opts.zipCodes].sort((a, b) => a.localeCompare(b));
  const zipPart = zipFiltered
    ? ` in ${sortedZips.length === 1 ? sortedZips[0]! : formatNaturalList(sortedZips)}`
    : "";
  const core = `${bedroomPart}apartments${zipPart}`;

  const extras = [rentQ, bathQ, timeQ].filter(Boolean) as string[];

  let result = `${prefix}${core}`;
  if (extras.length > 0) {
    result += `, ${extras.join(", ")}`;
  }
  if (amenityQ) {
    result += extras.length > 0 ? `, ${amenityQ}` : ` ${amenityQ}`;
  }

  return result;
}

function RentRangeBand({
  min,
  median,
  max,
  guestPreview = false,
}: {
  min: number;
  median: number;
  max: number;
  guestPreview?: boolean;
}) {
  const span = max - min;
  const medianPct =
    span > 0 ? Math.min(100, Math.max(0, ((median - min) / span) * 100)) : 50;

  return (
    <div className="space-y-5">
      <div>
        <p className={explorerEyebrowClass}>
          Rent range
        </p>
        {guestPreview ? null : (
          <p className={`mt-2 ${explorerBodyLeadClass}`}>
            Use this range to set your plan: see what renters paid at the low and high
            ends, then set a realistic target before you tour.
          </p>
        )}
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

        <div
          className={`mt-3 flex flex-col gap-3 sm:relative sm:mt-3 sm:min-h-[4.5rem] sm:flex-row sm:items-start sm:justify-between sm:gap-0 ${
            guestPreview ? "select-none blur-md" : ""
          }`}
          style={
            { "--rent-range-mid-pct": `${medianPct}%` } as CSSProperties
          }
        >
          <div className="sm:absolute sm:left-0 sm:top-0 sm:max-w-[min(11rem,38%)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Lowest
            </p>
            <p className="text-[1.04rem] font-semibold tabular-nums text-zinc-800">
              ${min.toLocaleString()}
            </p>
          </div>
          <div className="text-left sm:absolute sm:left-[var(--rent-range-mid-pct)] sm:top-0 sm:z-10 sm:max-w-[min(13rem,46%)] sm:-translate-x-1/2 sm:text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Middle of the range
            </p>
            <p className="text-lg font-semibold tabular-nums text-zinc-900">
              ${median.toLocaleString()}
              <span className="block text-xs font-normal text-zinc-500">
                per month
              </span>
            </p>
          </div>
          <div className="text-left sm:absolute sm:right-0 sm:top-0 sm:max-w-[min(11rem,38%)] sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Highest
            </p>
            <p className="text-[1.04rem] font-semibold tabular-nums text-zinc-800">
              ${max.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type RentExplorerProps = {
  isAuthenticated: boolean;
  /** Server-supplied count; explorer stays locked until the user has ≥1 review. */
  userReviewCount: number;
  zipOptions: string[];
};

export function RentExplorer({
  isAuthenticated,
  userReviewCount,
  zipOptions,
}: RentExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();
  const explorerLocked = isAuthenticated && userReviewCount < 1;
  const guestPreview = !isAuthenticated;
  const canLoadExplorerData = guestPreview || (isAuthenticated && userReviewCount >= 1);
  const analyticsReturnTo = "/analytics";
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
  const [zipInputDraft, setZipInputDraft] = useState("");
  const [zipInputError, setZipInputError] = useState<string | null>(null);
  const selectedZipCodesRef = useRef<string[]>([]);
  selectedZipCodesRef.current = selectedZipCodes;
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
  const [hoveredReviewCardId, setHoveredReviewCardId] = useState<string | null>(null);
  const [reviewSort, setReviewSort] = useState<ReviewSortMode>("recent");
  /** Client-side filter on the current page of review cards (same idea as Browse search). */
  const [reviewsAddressQuery, setReviewsAddressQuery] = useState("");
  const [desktopReviewCardCap, setDesktopReviewCardCap] = useState<number>(10);
  const [mobileResultsView, setMobileResultsView] = useState<"analytics" | "map">(
    "map",
  );
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const mapAbortRef = useRef<AbortController | null>(null);
  const reviewsSectionRef = useRef<HTMLElement | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const [guestMapAuthOpen, setGuestMapAuthOpen] = useState(false);
  const [guestReviewsAuthOpen, setGuestReviewsAuthOpen] = useState(false);

  const zipSelectOptions = useMemo(() => {
    const cleaned = zipOptions
      .map((z) => z.trim())
      .filter((z) => /^\d{5}$/.test(z));
    return Array.from(new Set(cleaned)).sort();
  }, [zipOptions]);

  const validZipSet = useMemo(() => new Set(zipSelectOptions), [zipSelectOptions]);

  function commitZipInput() {
    setZipInputError(null);
    const raw = zipInputDraft;
    const candidates = parseFiveDigitZipCandidates(raw);
    if (candidates.length === 0) {
      if (raw.trim()) {
        setZipInputError("Use 5-digit ZIP codes (separate with commas or spaces).");
      }
      return;
    }
    const allow = (z: string) => validZipSet.size === 0 || validZipSet.has(z);
    const accepted = candidates.filter(allow);
    const skipped = candidates.filter((z) => !allow(z));
    if (accepted.length === 0) {
      setZipInputError(
        skipped[0]
          ? `${skipped[0]} isn’t in the Boston ZIPs we have data for yet.`
          : "No valid ZIPs to add.",
      );
      return;
    }
    const nextSet = new Set(selectedZipCodesRef.current);
    for (const z of accepted) nextSet.add(z);
    const next = Array.from(nextSet).sort((a, b) => a.localeCompare(b));
    if (next.length > MAX_SELECTED_ZIP_CODES) {
      setZipInputError(
        `You can add up to ${MAX_SELECTED_ZIP_CODES} ZIP codes. Remove one to add more.`,
      );
      return;
    }
    setSelectedZipCodes(next);
    setZipInputDraft("");
    if (skipped.length > 0) {
      setZipInputError(
        skipped.length === 1
          ? `${skipped[0]} skipped (not in database).`
          : `${skipped.length} ZIP codes skipped (not in database).`,
      );
    }
  }

  useEffect(() => {
    if (!guestPreview || guestMapAuthOpen) return;
    const el = mapSectionRef.current;
    if (!el) return;

    const open = () => setGuestMapAuthOpen(true);
    const onWheel = (event: WheelEvent) => {
      // Treat scroll-wheel zoom attempts like map interactions.
      if (event.ctrlKey) {
        event.preventDefault();
        open();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [guestMapAuthOpen, guestPreview]);

  const activeAmenityFilters = useMemo(
    () => Object.values(amenities).some(Boolean),
    [amenities],
  );

  function buildPayload(nextPage: number) {
    return {
      zipCodes: [...selectedZipCodes],
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

  /** Matches `handleClear` filter state — used when landing from home search with `?query=`. */
  function clearedExplorerPayload(nextPage: number) {
    return {
      zipCodes: [] as string[],
      minBedroomBand: "Any" as ExplorerBedroomBand,
      maxBedroomBand: "Any" as ExplorerBedroomBand,
      minMonthlyRent: undefined as number | undefined,
      maxMonthlyRent: undefined as number | undefined,
      minBathrooms: "Any" as const,
      amenities: {
        hasParking: false,
        hasCentralHeatCooling: false,
        hasInUnitLaundry: false,
        hasStorageSpace: false,
        hasOutdoorSpace: false,
        petFriendly: false,
      },
      timeWindow: "all" as const,
      page: nextPage,
    };
  }

  async function fetchPage(
    nextPage: number,
    append: boolean,
    scrollToReviewsTop = false,
    bodyOverride?: ReturnType<typeof buildPayload>,
  ) {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = guestPreview
        ? "/api/analytics/rent-explorer/preview"
        : "/api/analytics/rent-explorer";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyOverride ?? buildPayload(nextPage)),
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
      if (
        scrollToReviewsTop &&
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 639px)").matches
      ) {
        window.requestAnimationFrame(() => {
          reviewsSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    } catch {
      setError("Couldn't load this page. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMarkers(
    boundsOverride?: ExplorerMapBounds | null,
    listPayload?: ReturnType<typeof buildPayload>,
  ) {
    if (!MAP_ENABLED || !canLoadExplorerData) return;
    const bounds = boundsOverride ?? mapBounds;
    if (!bounds) return;

    mapAbortRef.current?.abort();
    const controller = new AbortController();
    mapAbortRef.current = controller;
    setIsMapLoading(true);
    setMapError(null);

    try {
      const endpoint = guestPreview
        ? "/api/analytics/rent-explorer/map/preview"
        : "/api/analytics/rent-explorer/map";
      const basePayload = listPayload ?? buildPayload(0);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basePayload,
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
    setSelectedZipCodes([]);
    setZipInputDraft("");
    setZipInputError(null);
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
    setReviewsAddressQuery("");
  }

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!canLoadExplorerData) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const fromHomeSearch = Boolean(params.get("query")?.trim());

    if (fromHomeSearch) {
      const clearedList = clearedExplorerPayload(0);
      handleClear();
      params.delete("query");
      const qs = params.toString();
      const base = pathname || "/analytics";
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
      void fetchPage(0, false, false, clearedList);
      void fetchMarkers(undefined, clearedList);
      return;
    }

    void fetchPage(0, false);
    void fetchMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoadExplorerData, sessionStatus, pathname, router]);

  useEffect(() => {
    if (!MAP_ENABLED || !canLoadExplorerData || !mapBounds) return;
    const timer = window.setTimeout(() => {
      void fetchMarkers();
    }, 200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canLoadExplorerData,
    mapBounds,
    selectedZipCodes,
    minBedroomBand,
    maxBedroomBand,
    minRent,
    maxRent,
    minBathrooms,
    amenities,
    timeWindow,
  ]);

  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileFiltersOpen]);

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

  const personalizedAnalyticsHeading = useMemo(
    () =>
      buildPersonalizedAnalyticsHeading({
        zipCodes: selectedZipCodes,
        minBedroomBand,
        maxBedroomBand,
        minRent,
        maxRent,
        minBathrooms,
        amenities,
        timeWindow,
      }),
    [
      selectedZipCodes,
      minBedroomBand,
      maxBedroomBand,
      minRent,
      maxRent,
      minBathrooms,
      amenities,
      timeWindow,
    ],
  );

  const noMatches = hasSearched && items.length === 0;
  const sortedItems = useMemo(() => {
    const copy = [...items];
    if (reviewSort === "recent") {
      copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return copy;
    }
    if (reviewSort === "rent-asc") {
      copy.sort((a, b) => {
        if (a.monthlyRent == null && b.monthlyRent == null) return 0;
        if (a.monthlyRent == null) return 1;
        if (b.monthlyRent == null) return -1;
        return a.monthlyRent - b.monthlyRent;
      });
      return copy;
    }
    copy.sort((a, b) => {
      if (a.monthlyRent == null && b.monthlyRent == null) return 0;
      if (a.monthlyRent == null) return 1;
      if (b.monthlyRent == null) return -1;
      return b.monthlyRent - a.monthlyRent;
    });
    return copy;
  }, [items, reviewSort]);

  const reviewSearchFiltered = useMemo(() => {
    const q = reviewsAddressQuery.trim().toLowerCase();
    if (!q) return sortedItems;
    return sortedItems.filter((item) => {
      const haystack = [
        item.addressLine1,
        item.city,
        item.state,
        item.postalCode ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [reviewsAddressQuery, sortedItems]);

  const visibleReviewItems = useMemo(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
      return reviewSearchFiltered;
    }
    return reviewSearchFiltered.slice(0, desktopReviewCardCap);
  }, [desktopReviewCardCap, reviewSearchFiltered]);

  useEffect(() => {
    function updateDesktopCardCap() {
      const width = window.innerWidth;
      if (width >= 1024) {
        setDesktopReviewCardCap(9);
      } else if (width >= 640) {
        setDesktopReviewCardCap(8);
      } else {
        setDesktopReviewCardCap(10);
      }
    }
    updateDesktopCardCap();
    window.addEventListener("resize", updateDesktopCardCap);
    return () => window.removeEventListener("resize", updateDesktopCardCap);
  }, []);

  const selectClass = `${formSelectCompactClass} min-w-0`;
  const chipBase =
    "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white";
  const chipOff = "border-zinc-200/90 bg-white text-zinc-600 hover:border-muted-blue/25 hover:bg-muted-blue-tint/30";
  /** Edge bleed on phones only; from `sm` up sections use their own `sm:p-*` without `px-0` fighting it. */
  const mobileEdgeToEdgeClass = "max-sm:-mx-4 max-sm:px-4 sm:mx-0";
  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = [];
  for (const z of [...selectedZipCodes].sort((a, b) => a.localeCompare(b))) {
    activeFilterChips.push({
      id: `zip:${z}`,
      label: `ZIP ${z}`,
      onRemove: () =>
        setSelectedZipCodes((prev) => prev.filter((code) => code !== z)),
    });
  }

  const bedroomChip = bedroomQualifier(minBedroomBand, maxBedroomBand);
  if (bedroomChip) {
    activeFilterChips.push({
      id: "bedrooms",
      label: bedroomChip,
      onRemove: () => {
        setMinBedroomBand("Any");
        setMaxBedroomBand("Any");
      },
    });
  }

  const rentChip = rentFilterClause(minRent, maxRent);
  if (rentChip) {
    activeFilterChips.push({
      id: "rent",
      label: rentChip,
      onRemove: () => {
        setMinRent("");
        setMaxRent("");
      },
    });
  }

  const bathChip = bathFilterClause(minBathrooms);
  if (bathChip) {
    activeFilterChips.push({
      id: "bathrooms",
      label: bathChip,
      onRemove: () => setMinBathrooms("Any"),
    });
  }

  const amenityChipConfig: { key: keyof ExplorerAmenitiesState; label: string }[] = [
    { key: "hasParking", label: "Parking" },
    { key: "hasCentralHeatCooling", label: "Central heat/cooling" },
    { key: "hasInUnitLaundry", label: "In-unit laundry" },
    { key: "hasStorageSpace", label: "Storage" },
    { key: "hasOutdoorSpace", label: "Outdoor space" },
    { key: "petFriendly", label: "Pet-friendly" },
  ];

  for (const chip of amenityChipConfig) {
    if (!amenities[chip.key]) continue;
    activeFilterChips.push({
      id: `amenity:${chip.key}`,
      label: chip.label,
      onRemove: () =>
        setAmenities((prev) => ({
          ...prev,
          [chip.key]: false,
        })),
    });
  }

  if (timeWindow !== "all") {
    activeFilterChips.push({
      id: `time:${timeWindow}`,
      label: formatTimeWindowLabel(timeWindow),
      onRemove: () => setTimeWindow("all"),
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="relative flex flex-col gap-10">
        <div
          className={`flex flex-col gap-10 ${explorerLocked ? "pointer-events-none select-none blur-md" : ""}`}
          aria-hidden={explorerLocked}
        >
      {/* Search + filters */}
      <section
        className={`${mobileEdgeToEdgeClass} space-y-5 bg-white py-4 sm:space-y-6 sm:rounded-3xl sm:border sm:border-zinc-100 sm:bg-white sm:p-6 sm:shadow-elevated md:p-8`}
      >
        <div className="space-y-2 pt-1 pb-1 max-sm:pt-1.5 max-sm:pb-0.5">
          <p className={explorerEyebrowClass}>
            Your search
          </p>
          <h2 className="hidden text-xl font-semibold tracking-tight text-muted-blue-hover sm:block sm:text-2xl">
            Where are you looking?
          </h2>
          <p
            className={`hidden overflow-x-auto whitespace-nowrap sm:block ${explorerBodyLeadClass}`}
          >
            Add Boston ZIP codes (you can use several), set a rough budget, then narrow with optional filters.
          </p>
        </div>
        <div className="space-y-5">
          {/* Phones: ZIP entry, then bedrooms + rent */}
          <div className="space-y-4 sm:hidden">
            <div className="rounded-2xl border border-muted-blue/25 bg-gradient-to-b from-muted-blue-tint/55 via-white to-muted-blue-tint/30 p-4 shadow-[0_8px_28px_-12px_rgb(92_107_127/0.18)] ring-1 ring-muted-blue/10">
              <div className="space-y-4">
                <div className="grid min-w-0 gap-2">
                  <label className={explorerMobileSearchFieldLabelClass}>
                    ZIP codes
                  </label>
                  <div className="flex min-w-0 flex-wrap items-stretch gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={64}
                      value={zipInputDraft}
                      onChange={(e) => {
                        setZipInputDraft(e.target.value);
                        setZipInputError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitZipInput();
                        }
                      }}
                      placeholder="e.g. 02127"
                      aria-invalid={Boolean(zipInputError)}
                      className={`${formInputCompactClass} ${explorerMobileSearchControlClass} min-w-0 flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => commitZipInput()}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
                    >
                      Add
                    </button>
                  </div>
                  {zipInputError ? (
                    <p className="text-xs text-red-600" role="alert">
                      {zipInputError}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                  <div className="grid min-w-0 flex-1 gap-2">
                    <label className={explorerMobileSearchFieldLabelClass}>
                      Bedrooms · min / max
                    </label>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <select
                        value={minBedroomBand}
                        onChange={(e) =>
                          setMinBedroomBand(
                            e.target.value as ExplorerBedroomBand,
                          )
                        }
                        className={`${selectClass} ${explorerMobileSearchControlClass} min-w-[5.25rem] max-w-full flex-1`}
                      >
                        <option value="Any">Any</option>
                        <option value="Studio">Studio</option>
                        <option value="1BR">1+</option>
                        <option value="2BR">2+</option>
                        <option value="3BR">3+</option>
                        <option value="4BR">4+</option>
                        <option value="5BR+">5+</option>
                      </select>
                      <span className="shrink-0 text-xs font-medium text-muted-blue/50">
                        to
                      </span>
                      <select
                        value={maxBedroomBand}
                        onChange={(e) =>
                          setMaxBedroomBand(
                            e.target.value as ExplorerBedroomBand,
                          )
                        }
                        className={`${selectClass} ${explorerMobileSearchControlClass} min-w-[5.25rem] max-w-full flex-1`}
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
                </div>
                <div className="grid min-w-0 gap-2">
                  <label className={explorerMobileSearchFieldLabelClass}>
                    Monthly rent ($)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={minRent}
                      onChange={(e) => setMinRent(e.target.value)}
                      placeholder="Min"
                      className={`${formInputCompactClass} ${explorerMobileSearchControlClass} w-28 flex-1 sm:max-w-[8.5rem]`}
                    />
                    <span className="text-xs font-medium text-muted-blue/50">
                      to
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={maxRent}
                      onChange={(e) => setMaxRent(e.target.value)}
                      placeholder="Max"
                      className={`${formInputCompactClass} ${explorerMobileSearchControlClass} w-28 flex-1 sm:max-w-[8.5rem]`}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-nowrap items-stretch gap-3">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isLoading}
                className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl bg-muted-blue px-4 py-2.5 text-[calc(1.04rem-1pt)] font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition active:bg-muted-blue-hover/95 hover:bg-muted-blue-hover disabled:opacity-60"
              >
                {isLoading ? "Updating…" : "Show results"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[calc(1.04rem-1pt)] font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 disabled:opacity-60"
              >
                Reset filters
              </button>
            </div>
          </div>

          {/* Tablet/desktop: full filter row including bedrooms */}
          <div className="hidden flex-wrap items-end gap-x-6 gap-y-4 sm:flex">
            <div className="grid min-w-[min(100%,14rem)] flex-1 gap-1.5 sm:max-w-md">
              <label className={explorerLabelClass}>ZIP codes</label>
              <div className="flex min-w-0 flex-wrap items-stretch gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={64}
                  value={zipInputDraft}
                  onChange={(e) => {
                    setZipInputDraft(e.target.value);
                    setZipInputError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitZipInput();
                    }
                  }}
                  placeholder="e.g. 02127"
                  aria-invalid={Boolean(zipInputError)}
                  className={`${formInputCompactClass} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => commitZipInput()}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
                >
                  Add
                </button>
              </div>
              {zipInputError ? (
                <p className="text-xs text-red-600" role="alert">
                  {zipInputError}
                </p>
              ) : null}
            </div>

            <div className="grid min-w-0 gap-1.5">
              <label className={explorerLabelClass}>
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
                <span className="shrink-0 text-[13px] text-zinc-400">to</span>
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
              <label className={explorerLabelClass}>
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
                <span className="text-[13px] text-zinc-400">to</span>
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
            <div className="flex w-full basis-full flex-nowrap items-stretch gap-3 sm:flex-initial sm:w-auto sm:basis-auto sm:items-center sm:justify-start">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isLoading}
                className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl bg-muted-blue px-4 py-2.5 text-[calc(1.04rem-1pt)] font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition active:bg-muted-blue-hover/95 hover:bg-muted-blue-hover disabled:opacity-60 sm:flex-initial sm:rounded-full sm:px-6 sm:text-[1.04rem]"
              >
                {isLoading ? "Updating…" : "Show results"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[calc(1.04rem-1pt)] font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 disabled:opacity-60 sm:flex-initial sm:rounded-full sm:px-6 sm:text-[1.04rem]"
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>

        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="inline-flex min-h-11 w-full items-center justify-between rounded-2xl border border-zinc-200/80 bg-muted-blue-tint/25 px-4 py-3 text-left text-[calc(1.04rem-1pt)] font-semibold text-muted-blue-hover transition active:bg-muted-blue-tint/40"
          >
            More filters (optional)
            <span className="text-zinc-400">▾</span>
          </button>
        </div>
        <details className="group hidden rounded-2xl border border-zinc-200/80 bg-muted-blue-tint/25 transition open:bg-muted-blue-tint/40 sm:block">
          <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 py-3 text-[1.04rem] font-semibold text-muted-blue-hover [&::-webkit-details-marker]:hidden">
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
                <label className={explorerLabelClass}>Bathrooms</label>
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
                <label className={explorerLabelClass}>
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
              <label className={explorerLabelClass}>Amenities</label>
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
        {activeFilterChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2">
            {activeFilterChips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex min-h-8 items-center gap-1 rounded-full border border-muted-blue/20 bg-muted-blue-tint px-3 py-1 text-xs font-semibold text-muted-blue-hover"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex size-5 items-center justify-center rounded-full text-muted-blue transition hover:bg-muted-blue/10 hover:text-muted-blue-hover"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
               {error ? (
          <p className="text-[1.04rem] text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {isMobileFiltersOpen ? (
        <div
          className="fixed inset-0 z-[70] bg-zinc-900/45 sm:hidden"
          onClick={() => setIsMobileFiltersOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="More filters"
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-semibold text-muted-blue-hover">More filters</p>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="inline-flex min-h-10 items-center rounded-full px-3 py-2 text-sm font-medium text-zinc-700 active:bg-zinc-100"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className={explorerLabelClass}>Bathrooms</label>
                <select
                  value={minBathrooms}
                  onChange={(e) =>
                    setMinBathrooms(e.target.value as "Any" | "1" | "1.5" | "2")
                  }
                  className={`${selectClass} w-full`}
                >
                  <option value="Any">Any</option>
                  <option value="1">1+</option>
                  <option value="1.5">1.5+</option>
                  <option value="2">2+</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className={explorerLabelClass}>How far back to look</label>
                <select
                  value={timeWindow}
                  onChange={(e) =>
                    setTimeWindow(
                      e.target.value as "1y" | "2y" | "3y" | "10y" | "all",
                    )
                  }
                  className={`${selectClass} w-full`}
                >
                  <option value="1y">Last 1 year</option>
                  <option value="2y">Last 2 years</option>
                  <option value="3y">Last 3 years</option>
                  <option value="10y">Last 10 years</option>
                  <option value="all">All time</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className={explorerLabelClass}>Amenities</label>
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
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  handleClear();
                  setIsMobileFiltersOpen(false);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-muted-blue-hover active:bg-zinc-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdate();
                  setIsMobileFiltersOpen(false);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-muted-blue px-4 py-2 text-sm font-semibold text-white active:bg-muted-blue-hover"
              >
                Apply
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {MAP_ENABLED ? (
        <section className={`${mobileEdgeToEdgeClass} -my-2 sm:hidden`}>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200/80 bg-white p-1.5">
            <button
              type="button"
              onClick={() => setMobileResultsView("map")}
              className={`inline-flex min-h-[3.3rem] items-center justify-center rounded-xl text-sm font-semibold transition ${
                mobileResultsView === "map"
                  ? "bg-muted-blue-hover text-white shadow-[0_8px_20px_-12px_rgb(21_42_69/0.75)]"
                  : "text-zinc-600"
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setMobileResultsView("analytics")}
              className={`inline-flex min-h-[3.3rem] items-center justify-center rounded-xl text-sm font-semibold transition ${
                mobileResultsView === "analytics"
                  ? "bg-muted-blue-hover text-white shadow-[0_8px_20px_-12px_rgb(21_42_69/0.75)]"
                  : "text-zinc-600"
              }`}
            >
              Insights
            </button>
          </div>
        </section>
      ) : null}

      {MAP_ENABLED ? (
        <section
          className={`${mobileResultsView === "map" ? "block" : "hidden"} ${mobileEdgeToEdgeClass} space-y-3 bg-white py-4 max-sm:bg-[#f5f5f6] max-sm:pb-0 sm:block sm:rounded-3xl sm:border sm:border-zinc-100 sm:p-6 sm:shadow-elevated`}
        >
          <div ref={mapSectionRef} className="relative space-y-3">
            <div className="space-y-1 pt-1">
              <p className={explorerEyebrowClass}>
                Interactive map
              </p>
              <p className={`sm:hidden ${explorerBodyLeadClass}`}>
                {guestPreview
                  ? "Live preview — sign in to use the full map and dive into all of our rent analytics."
                  : "Explore across the map and click on properties to see more details."}
              </p>
              <p className={`hidden sm:block ${explorerBodyLeadClass}`}>
                {guestPreview
                  ? "This is a live preview — try moving the map and we’ll prompt you to sign in. Once you’re in, you can use the full map and dive into all of our rent analytics, listings, and tools."
                  : "Move the map to load points in view. Filters above apply to the map, insights, and reviews below."}
              </p>
            </div>
            <div
              className={`relative overflow-hidden sm:rounded-3xl ${
                guestPreview && guestMapAuthOpen ? "pointer-events-none" : ""
              }`}
            >
              <div
                className={
                  guestPreview && guestMapAuthOpen
                    ? "blur-md saturate-125 transition-[filter]"
                    : ""
                }
              >
                <RentExplorerMap
                  markers={mapMarkers}
                  selectedPropertyId={selectedPropertyId}
                  isLoading={isMapLoading}
                  interactionLocked={guestPreview}
                  onMarkerClick={(propertyId) => setSelectedPropertyId(propertyId)}
                  onBoundsChange={(bounds) => {
                    setMapBounds(bounds);
                  }}
                />
              </div>

              {guestPreview && !guestMapAuthOpen ? (
                <button
                  type="button"
                  className="absolute inset-0 z-20 cursor-pointer bg-transparent"
                  aria-label="Sign in to use the interactive map"
                  onClick={() => setGuestMapAuthOpen(true)}
                />
              ) : null}

              {guestPreview && guestMapAuthOpen ? (
                <div className="pointer-events-auto absolute inset-0 z-30 flex items-start justify-center bg-zinc-900/25 p-4 pt-6 sm:items-center sm:p-8">
                  <div
                    className={`${surfaceElevatedClass} w-full max-w-md space-y-4 border border-zinc-200/90 p-5 shadow-elevated sm:p-6`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rent-explorer-map-guest-title"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p
                        id="rent-explorer-map-guest-title"
                        className="text-base font-semibold text-muted-blue-hover"
                      >
                        Sign in to explore the map
                      </p>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                        onClick={() => setGuestMapAuthOpen(false)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-600">
                      Create a free account (or sign in) to pan and zoom, click markers, and
                      jump into listings.
                    </p>
                    <EmailAuthPanel
                      callbackUrl={analyticsReturnTo}
                      signupFocus
                      onSignedIn={() => setGuestMapAuthOpen(false)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            {mapError ? (
              <p className="text-[1.04rem] text-red-600" role="alert">
                {mapError}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {snapshot ? (
        <>
          <section
            className={`${mobileEdgeToEdgeClass} bg-muted-blue-tint px-4 py-5 max-sm:bg-[#f5f5f6] sm:rounded-3xl sm:border sm:border-zinc-200/90 sm:px-6 sm:py-6 ${
              MAP_ENABLED && mobileResultsView === "map" ? "max-sm:hidden" : ""
            }`}
          >
            <div className="mb-4 border-b border-zinc-200/80 pb-4 pt-1">
              <p className={explorerEyebrowClass}>
                Insights
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-muted-blue-hover sm:text-xl">
                {personalizedAnalyticsHeading}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-blue">
                  Typical rent
                </p>
                <p
                  className={`mt-1.5 text-2xl font-semibold tabular-nums text-muted-blue-hover ${
                    guestPreview ? "blur-sm select-none" : ""
                  }`}
                >
                  {typeof snapshot.median === "number"
                    ? `$${snapshot.median.toLocaleString()}`
                    : "-"}
                </p>
                <p
                  className={`mt-1 hidden text-[13px] text-zinc-500 sm:block ${
                    guestPreview ? "blur-sm select-none" : ""
                  }`}
                >
                  {rangeLine ?? `n = ${snapshot.n.toLocaleString()}`}
                </p>
              </div>
              <div className="max-sm:order-3 max-sm:col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-blue">
                  Range
                </p>
                <p
                  className={`mt-1.5 text-2xl font-semibold tabular-nums text-muted-blue-hover max-sm:text-[1.3rem] lg:text-lg ${
                    guestPreview ? "blur-sm select-none" : ""
                  }`}
                >
                  {typeof snapshot.min === "number" &&
                  typeof snapshot.max === "number"
                    ? `$${snapshot.min.toLocaleString()}–$${snapshot.max.toLocaleString()}`
                    : "Not enough to show"}
                </p>
                <p
                  className={`mt-1 text-[13px] text-zinc-500 ${
                    guestPreview ? "blur-sm select-none" : ""
                  }`}
                >
                  From {snapshot.n.toLocaleString()} review
                  {snapshot.n === 1 ? "" : "s"} that matched.
                </p>
              </div>
              <div className="max-sm:order-2 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-blue">
                  Matching reviews
                </p>
                <p
                  className={`mt-1.5 text-2xl font-semibold tabular-nums text-muted-blue-hover max-sm:text-[1.425rem] lg:text-lg ${
                    guestPreview ? "blur-sm select-none" : ""
                  }`}
                >
                  {snapshot.recentCount.toLocaleString()}
                </p>
                <p
                  className={`mt-1 hidden text-[13px] text-zinc-500 sm:block ${
                    guestPreview ? "blur-sm select-none" : ""
                  }`}
                >
                  Posted in the {formatTimeWindowLabel(timeWindow)} you selected.
                </p>
              </div>
              <div className="max-sm:order-4 max-sm:col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-blue">
                  Amenities
                </p>
                {snapshot.n > 0 ? (
                  <>
                    <p
                      className={`mt-1.5 text-2xl font-semibold leading-snug text-muted-blue-hover max-sm:text-[1.175rem] lg:text-[1.04rem] ${
                        guestPreview ? "blur-sm select-none" : ""
                      }`}
                    >
                      Laundry {snapshot.amenityPercentages.hasInUnitLaundry}% · Parking{" "}
                      {snapshot.amenityPercentages.hasParking}%
                    </p>
                    <p
                      className={`mt-1 text-[13px] text-zinc-500 ${
                        guestPreview ? "blur-sm select-none" : ""
                      }`}
                    >
                      Out of reviews that matched your search, how often people said
                      they had these.
                    </p>
                  </>
                ) : (
                  <p
                    className={`mt-1.5 text-[13px] text-zinc-500 ${
                      guestPreview ? "blur-sm select-none" : ""
                    }`}
                  >
                    Not enough data yet.
                  </p>
                )}
              </div>
            </div>

            {lowData ? (
              <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-2.5 text-[13px] text-amber-900">
                Only a few reviews so far - take these numbers as a rough idea, not a
                firm answer.
              </p>
            ) : null}
            <p className="mt-3 text-[0.875rem] leading-relaxed text-zinc-600">
              Based on reviews that match what you picked. One apartment can be higher
              or lower than these - they&apos;re averages and ranges, not guarantees.
            </p>
          </section>

          {/* Rent range bar */}
          {typeof snapshot.median === "number" &&
            snapshot.min != null &&
            snapshot.max != null && (
              <section
                className={`${mobileEdgeToEdgeClass} hidden border-zinc-200/80 bg-white sm:block sm:rounded-2xl sm:border sm:px-8 sm:pb-6 sm:pt-8 sm:shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}
              >
                <RentRangeBand
                  min={snapshot.min}
                  median={snapshot.median}
                  max={snapshot.max}
                  guestPreview={guestPreview}
                />
              </section>
            )}
        </>
      ) : null}

      {/* Results list */}
      <section
        ref={reviewsSectionRef}
        className={`${mobileEdgeToEdgeClass} space-y-5 bg-white max-sm:px-4 max-sm:py-5 sm:rounded-3xl sm:border sm:border-zinc-100 sm:px-8 sm:py-8 sm:shadow-elevated`}
      >
        <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5">
          <div>
            <p className={`${explorerEyebrowClass} hidden sm:block`}>
              Your filtered reviews
            </p>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="min-w-0 max-w-[min(100%,32rem)] flex-1 text-xl font-semibold tracking-tight text-muted-blue-hover sm:max-w-none">
                Reviews that match your search
              </h2>
              {!noMatches && (
                <span className="shrink-0 rounded-full border border-zinc-200/90 bg-zinc-50/90 px-2.5 py-1 text-center text-[12px] font-medium tabular-nums leading-none text-zinc-600 shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] sm:px-3 sm:text-[13px]">
                  Page {page + 1}
                </span>
              )}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 sm:hidden">
              {guestPreview
                ? "Scroll the list to preview the layout. Tap a card to sign in and open listings."
                : "Click on any property to see details."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="w-full min-w-0 sm:max-w-xl sm:flex-1">
              <label
                htmlFor="rent-explorer-reviews-address-search"
                className="mb-1.5 block text-xs font-medium text-zinc-600"
              >
                Search this page
              </label>
              <input
                id="rent-explorer-reviews-address-search"
                type="search"
                value={reviewsAddressQuery}
                onChange={(e) => setReviewsAddressQuery(e.target.value)}
                placeholder="Street, neighborhood, or ZIP…"
                className={`${formInputCompactClass} w-full`}
              />
            </div>
            <div className="w-full shrink-0 sm:ml-auto sm:w-auto sm:min-w-[13.5rem] sm:self-end">
              <label
                htmlFor="rent-explorer-review-sort"
                className="mb-1.5 block text-xs font-medium text-zinc-600 sm:text-right"
              >
                Sort
              </label>
              <select
                id="rent-explorer-review-sort"
                value={reviewSort}
                onChange={(event) =>
                  setReviewSort(event.target.value as ReviewSortMode)
                }
                className={`${formSelectCompactClass} w-full sm:min-w-[13.5rem]`}
              >
                <option value="recent">Most recent</option>
                <option value="rent-asc">Price: low to high</option>
                <option value="rent-desc">Price: high to low</option>
              </select>
            </div>
          </div>
        </div>

        {noMatches ? (
          <div className={`space-y-4 ${explorerBodyLeadClass}`}>
            <p>
              No reviews match yet. Try a wider ZIP, rent range, or bedroom count.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
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
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
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
            <div className="w-full rounded-2xl border border-zinc-100 bg-muted-blue-tint/25 p-2.5 max-sm:max-h-[56vh] max-sm:overflow-y-auto max-sm:overscroll-contain max-sm:[-webkit-overflow-scrolling:touch] sm:p-4">
              <div className="relative">
                {reviewsAddressQuery.trim() &&
                visibleReviewItems.length === 0 &&
                sortedItems.length > 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200/90 bg-white/80 px-4 py-10 text-center sm:py-12">
                    <p className={`${explorerBodyLeadClass} text-zinc-600`}>
                      No addresses on this page match{" "}
                      <span className="font-semibold text-muted-blue-hover">
                        &quot;{reviewsAddressQuery.trim()}&quot;
                      </span>
                      . Try another street or ZIP, or clear the search.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReviewsAddressQuery("")}
                      className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 md:gap-x-4 md:gap-y-3">
                {visibleReviewItems.map((item) => {
                  const bedroomLabel =
                    item.bedroomBand && item.bedroomBand !== "Unknown"
                      ? item.bedroomBand
                      : null;
                  const bathLabel = bathroomsToBaAbbrev(item.bathrooms);
                  const renderBoldLeadingNumber = (label: string) => {
                    const match = label.match(/^(\d+\+?)(.*)$/);
                    if (!match) return label;
                    return (
                      <>
                        <span className="font-semibold">{match[1]}</span>
                        {match[2]}
                      </>
                    );
                  };
                  const amenityLabels: string[] = [];
                  if (item.hasInUnitLaundry) amenityLabels.push("In-unit laundry");
                  if (item.hasParking) amenityLabels.push("Parking");
                  if (item.petFriendly) amenityLabels.push("Pet friendly");
                  if (item.hasOutdoorSpace) amenityLabels.push("Outdoor space");
                  if (item.hasStorageSpace) amenityLabels.push("Storage");
                  if (item.hasCentralHeatCooling)
                    amenityLabels.push("Central heat/cooling");

                  const cardClassName = `group flex h-full min-h-[7.25rem] flex-col gap-1.5 rounded-xl border bg-white px-3 py-3 text-left text-zinc-800 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition hover:border-muted-blue/30 hover:shadow-[0_8px_24px_-12px_rgb(15_23_42/0.1)] sm:min-h-[7.5rem] sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3.5 ${
                    hoveredReviewCardId === item.id
                      ? "border-muted-blue/40 ring-2 ring-muted-blue/20"
                      : "border-zinc-200/90"
                  }`;
                  const guestCardBlurClass = guestReviewsAuthOpen
                    ? "blur-[3px] select-none"
                    : "blur-[1.5px] sm:blur-[2px] select-none";

                  return (
                    <li key={item.id} className="min-w-0">
                      {guestPreview ? (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setGuestReviewsAuthOpen(true)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setGuestReviewsAuthOpen(true);
                            }
                          }}
                          onMouseEnter={() => {
                            setHoveredReviewCardId(item.id);
                            setSelectedPropertyId(item.propertyId);
                          }}
                          onMouseLeave={() => setHoveredReviewCardId(null)}
                          className={`${cardClassName} cursor-pointer touch-pan-y overflow-hidden ${guestCardBlurClass}`}
                        >
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-[1.04rem] font-semibold leading-snug text-muted-blue-hover group-hover:underline sm:text-[1.0625rem]">
                            {item.addressLine1}
                          </p>
                          <p className="mt-1 line-clamp-1 text-[13px] text-zinc-600 sm:text-[1.04rem]">
                            {item.city}, {item.state} {item.postalCode ?? ""}
                          </p>
                        </div>
                        <div className="mt-auto flex flex-row flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-zinc-100/90 pt-2 sm:pt-2.5">
                          {typeof item.monthlyRent === "number" ? (
                            <span className="text-[13px] font-semibold tabular-nums text-muted-blue-hover sm:text-[1.04rem]">
                              ~${item.monthlyRent.toLocaleString()}
                              <span className="text-xs font-normal text-zinc-500 sm:text-[13px]">
                                {" "}
                                /mo
                              </span>
                            </span>
                          ) : (
                            <span className="text-[13px] font-medium text-zinc-400 sm:text-[1.04rem]">
                              Rent n/a
                            </span>
                          )}
                          {bedroomLabel || bathLabel ? (
                            <span className="inline-flex items-center gap-1.5 text-[13px] text-zinc-600 sm:text-[1.04rem]">
                              <span className="px-0.5 text-zinc-300">|</span>
                              {bedroomLabel ? (
                                <span>{renderBoldLeadingNumber(bedroomLabel)}</span>
                              ) : null}
                              {bedroomLabel && bathLabel ? (
                                <span className="px-0.5 text-zinc-300">|</span>
                              ) : null}
                              {bathLabel ? <span>{renderBoldLeadingNumber(bathLabel)}</span> : null}
                            </span>
                          ) : null}
                        </div>
                        {amenityLabels.length > 0 ? (
                          <p className="hidden line-clamp-2 text-[13px] leading-relaxed text-zinc-600 sm:block sm:text-sm">
                            {amenityLabels.join(" · ")}
                          </p>
                        ) : null}
                        <p className="text-[13px] text-zinc-500 sm:text-sm">
                          {monthsAgoLabel(item.createdAt)} ·{" "}
                          {reviewYearToPrivacyBucket(item.reviewYear)}
                        </p>
                        </div>
                      ) : (
                        <Link
                          href={`/properties/${item.propertyId}`}
                          onMouseEnter={() => {
                            setHoveredReviewCardId(item.id);
                            setSelectedPropertyId(item.propertyId);
                          }}
                          onMouseLeave={() => setHoveredReviewCardId(null)}
                          className={cardClassName}
                        >
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-[1.04rem] font-semibold leading-snug text-muted-blue-hover group-hover:underline sm:text-[1.0625rem]">
                            {item.addressLine1}
                          </p>
                          <p className="mt-1 line-clamp-1 text-[13px] text-zinc-600 sm:text-[1.04rem]">
                            {item.city}, {item.state} {item.postalCode ?? ""}
                          </p>
                        </div>
                        <div className="mt-auto flex flex-row flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-zinc-100/90 pt-2 sm:pt-2.5">
                          {typeof item.monthlyRent === "number" ? (
                            <span className="text-[13px] font-semibold tabular-nums text-muted-blue-hover sm:text-[1.04rem]">
                              ~${item.monthlyRent.toLocaleString()}
                              <span className="text-xs font-normal text-zinc-500 sm:text-[13px]">
                                {" "}
                                /mo
                              </span>
                            </span>
                          ) : (
                            <span className="text-[13px] font-medium text-zinc-400 sm:text-[1.04rem]">
                              Rent n/a
                            </span>
                          )}
                          {bedroomLabel || bathLabel ? (
                            <span className="inline-flex items-center gap-1.5 text-[13px] text-zinc-600 sm:text-[1.04rem]">
                              <span className="px-0.5 text-zinc-300">|</span>
                              {bedroomLabel ? (
                                <span>{renderBoldLeadingNumber(bedroomLabel)}</span>
                              ) : null}
                              {bedroomLabel && bathLabel ? (
                                <span className="px-0.5 text-zinc-300">|</span>
                              ) : null}
                              {bathLabel ? <span>{renderBoldLeadingNumber(bathLabel)}</span> : null}
                            </span>
                          ) : null}
                        </div>
                        {amenityLabels.length > 0 ? (
                          <p className="hidden line-clamp-2 text-[13px] leading-relaxed text-zinc-600 sm:block sm:text-sm">
                            {amenityLabels.join(" · ")}
                          </p>
                        ) : null}
                        <p className="text-[13px] text-zinc-500 sm:text-sm">
                          {monthsAgoLabel(item.createdAt)} ·{" "}
                          {reviewYearToPrivacyBucket(item.reviewYear)}
                        </p>
                        </Link>
                      )}
                    </li>
                  );
                })}
                  </ul>
                )}

                {guestPreview && guestReviewsAuthOpen ? (
                  <div className="pointer-events-auto absolute inset-0 z-20 flex items-start justify-center bg-zinc-900/25 p-4 pt-6 sm:items-center sm:p-8">
                    <div
                      className={`${surfaceElevatedClass} w-full max-w-md space-y-4 border border-zinc-200/90 p-5 shadow-elevated sm:p-6`}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="rent-explorer-reviews-guest-title"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p
                          id="rent-explorer-reviews-guest-title"
                          className="text-base font-semibold text-muted-blue-hover"
                        >
                          Sign in to read reviews
                        </p>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                          onClick={() => setGuestReviewsAuthOpen(false)}
                          aria-label="Close"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-600">
                        Create a free account (or sign in) to open listings, see rent
                        details, and read full renter notes.
                      </p>
                      <EmailAuthPanel
                        callbackUrl={analyticsReturnTo}
                        signupFocus
                        onSignedIn={() => setGuestReviewsAuthOpen(false)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 text-[1.04rem] text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {visibleReviewItems.length} of {reviewSearchFiltered.length} on this
                page
                {snapshot ? (
                  <span className="text-zinc-400">
                    {" "}
                    · {snapshot.n.toLocaleString()} match your explorer filters
                  </span>
                ) : null}
              </span>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => fetchPage(Math.max(0, page - 1), false)}
                  disabled={page === 0 || isLoading}
                  className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[1.04rem] font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 disabled:opacity-50 sm:min-w-[6.5rem] sm:w-auto sm:rounded-full"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => fetchPage(page + 1, false, true)}
                  disabled={!hasMore || isLoading}
                  className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[1.04rem] font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 disabled:opacity-50 sm:min-w-[6.5rem] sm:w-auto sm:rounded-full"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className={`${mobileEdgeToEdgeClass} overflow-hidden bg-muted-blue-hover px-4 py-8 text-center sm:rounded-3xl sm:border sm:border-white/10 sm:px-10 sm:py-10 sm:text-left sm:shadow-elevated`}>
        <div className="max-w-xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/90">
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
                className="mt-5 inline-flex rounded-full bg-white px-6 py-3 text-[1.04rem] font-semibold text-muted-blue-hover shadow-lg shadow-black/15 ring-1 ring-white/80 transition hover:bg-zinc-50"
          >
            Write a review
          </Link>
        </div>
      </section>
        </div>

        {explorerLocked ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center p-6 pt-3 sm:items-center sm:p-10"
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
                className="text-[1.04rem] leading-relaxed text-zinc-600"
              >
                Share your first lease-year review to see market summaries and matching
                reviews. Historical rent helps you spot unusual increases and negotiate
                from real renter comps.
              </p>
              <Link
                href="/submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-muted-blue px-6 py-2.5 text-[1.04rem] font-semibold text-white shadow-[0_10px_28px_-8px_rgb(21_42_69/0.35)] transition motion-safe:hover:bg-muted-blue-hover"
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
