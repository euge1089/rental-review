"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { GiveawayPromoStrip } from "@/app/_components/giveaway-promo-strip";
import { formInputCompactClass, formSelectCompactClass, surfaceSubtleClass } from "@/lib/ui-classes";

type PropertySummary = {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  reviewCount: number;
  averageRent: number | null;
  topAmenities?: string[];
  /** ISO timestamp; used for “Most recent” sort */
  createdAt?: string;
};

type SortMode = "recent" | "rent-asc" | "rent-desc";

function parseSortParam(value: string | null): SortMode {
  if (value === "rent-asc" || value === "rent-desc") return value;
  return "recent";
}

function createdAtMs(p: PropertySummary): number {
  if (!p.createdAt) return 0;
  return new Date(p.createdAt).getTime();
}

function sortProperties(list: PropertySummary[], sort: SortMode): PropertySummary[] {
  const copy = [...list];
  if (sort === "recent") {
    copy.sort((a, b) => createdAtMs(b) - createdAtMs(a));
    return copy;
  }
  if (sort === "rent-asc") {
    copy.sort((a, b) => {
      const ar = a.averageRent;
      const br = b.averageRent;
      if (ar == null && br == null) {
        return createdAtMs(b) - createdAtMs(a);
      }
      if (ar == null) return 1;
      if (br == null) return -1;
      return ar - br;
    });
    return copy;
  }
  copy.sort((a, b) => {
    const ar = a.averageRent;
    const br = b.averageRent;
    if (ar == null && br == null) {
      return createdAtMs(b) - createdAtMs(a);
    }
    if (ar == null) return 1;
    if (br == null) return -1;
    return br - ar;
  });
  return copy;
}

function SortIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 6h11M4 12h7M4 18h11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M17 8v10m0 0 2.5-2.5M17 18l-2.5-2.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PropertiesPage() {
  const { status } = useSession();
  const loggedIn =
    status === "loading" ? null : status === "authenticated";
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("query") ?? "";
  });
  const [sort, setSort] = useState<SortMode>(() => {
    if (typeof window === "undefined") return "recent";
    const params = new URLSearchParams(window.location.search);
    return parseSortParam(params.get("sort"));
  });

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/properties");
      const result = (await response.json()) as {
        ok: boolean;
        properties?: PropertySummary[];
      };
      if (result.ok && result.properties) {
        setProperties(result.properties);
      }
    };
    void load();
  }, []);

  const previewLimit = 8;
  const isLoggedOutBrowse = loggedIn === false;

  const poolForFilter = useMemo(() => {
    if (loggedIn === false) {
      return properties.slice(0, previewLimit);
    }
    return properties;
  }, [properties, loggedIn, previewLimit]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return poolForFilter;
    return poolForFilter.filter((p) => {
      const haystack = [
        p.addressLine1,
        p.city,
        p.state,
        p.postalCode ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [poolForFilter, query]);

  const visibleProperties = useMemo(
    () => sortProperties(filtered, sort),
    [filtered, sort],
  );

  function applySort(next: SortMode) {
    setSort(next);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = query.trim();
    if (q) params.set("query", q);
    else params.delete("query");
    if (next === "recent") {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }
  const showSignInTeaser =
    isLoggedOutBrowse && properties.length > previewLimit;

  const propertiesCallback = encodeURIComponent("/properties");
  const mobileSectionShell = "-mx-4 px-4 sm:mx-0 sm:px-0";

  return (
    <AppPageShell gapClass="gap-6">
      <GiveawayPromoStrip variant="home" placement="properties" />
      <div
        className={`${mobileSectionShell} flex flex-col gap-6 bg-white py-4 sm:rounded-2xl sm:border sm:border-zinc-200/80 sm:bg-transparent sm:px-5 sm:py-5 sm:flex-row sm:items-end sm:justify-between`}
      >
        <PageHeader
          eyebrow="Browse"
          title="Reviewed Boston addresses"
          description={
            <>
              {loggedIn === false ? (
                <p>
                  You&apos;re seeing the {previewLimit} most recently added addresses.
                  Sign in to browse and search the full database and open listings for
                  full review details.
                </p>
              ) : (
                <p>
                  Addresses will appear first as you add more reviews there. Start typing a
                  street, apartment name, or ZIP to filter.
                </p>
              )}
              {loggedIn === false ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Search below only filters these preview cards - not every address we have
                  on file.
                </p>
              ) : loggedIn === true ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Open an address to read full reviews, rent amounts, and scores.
                </p>
              ) : null}
            </>
          }
        />
        <div className="flex w-full flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-end sm:justify-end sm:gap-4">
          <div className="w-full shrink-0 sm:max-w-xs sm:min-w-[min(100%,16rem)]">
            <label
              htmlFor="properties-search"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              {isLoggedOutBrowse
                ? `Filter these ${previewLimit} preview addresses`
                : "Search by street or ZIP"}
            </label>
            <input
              id="properties-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (typeof window === "undefined") return;
                const params = new URLSearchParams(window.location.search);
                const v = event.target.value;
                if (v) params.set("query", v);
                else params.delete("query");
                if (sort !== "recent") params.set("sort", sort);
                else params.delete("sort");
                const qs = params.toString();
                window.history.replaceState(
                  null,
                  "",
                  qs
                    ? `${window.location.pathname}?${qs}`
                    : window.location.pathname,
                );
              }}
              placeholder={
                isLoggedOutBrowse
                  ? `Searches only these ${previewLimit} cards`
                  : "e.g. West 3rd, 02127"
              }
              aria-describedby={
                isLoggedOutBrowse ? "properties-search-hint" : undefined
              }
              className={formInputCompactClass}
            />
            {isLoggedOutBrowse ? (
              <p
                id="properties-search-hint"
                className="mt-1.5 text-[11px] leading-snug text-zinc-500"
              >
                Does not search the full database.{" "}
                <Link
                  href={`/signin?callbackUrl=${propertiesCallback}`}
                  className="font-medium text-muted-blue hover:underline"
                >
                  Sign in
                </Link>{" "}
                for that.
              </p>
            ) : null}
          </div>

          <div className="w-full shrink-0 sm:w-auto sm:min-w-[13.5rem]">
            <label
              htmlFor="properties-sort"
              className="mb-1.5 flex items-center gap-2 text-xs font-medium text-zinc-600"
            >
              <SortIcon className="text-zinc-500" />
              Sort
            </label>
            <select
              id="properties-sort"
              value={sort}
              onChange={(event) =>
                applySort(parseSortParam(event.target.value))
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

      {filtered.length === 0 ? (
        isLoggedOutBrowse ? (
          <p className="text-sm text-zinc-600">
            {query.trim()
              ? "No preview address matches that search. It only looks at these 8 cards - not the full database."
              : "No preview addresses to show yet."}{" "}
            <Link
              href={`/signin?callbackUrl=${propertiesCallback}`}
              className="font-medium text-muted-blue hover:underline"
            >
              Sign in
            </Link>{" "}
            to search everything, or{" "}
            <Link href="/submit" className="font-medium text-muted-blue hover:underline">
              add a review
            </Link>
            .
          </p>
        ) : (
          <p className="text-sm text-zinc-600">
            No properties match your search yet. Try a different street or ZIP, or{" "}
            <Link href="/submit" className="font-medium text-muted-blue hover:underline">
              add the first review for an address
            </Link>
            .
          </p>
        )
      ) : (
        <div className="space-y-0">
          <ul className="grid gap-4 md:grid-cols-2">
            {visibleProperties.map((property) => (
              <li
                key={property.id}
                className={`-mx-4 sm:mx-0`}
              >
                <Link
                  href={`/properties/${property.id}`}
                  className={`group block ${surfaceSubtleClass} border-zinc-200/80 bg-white px-4 py-5 transition hover:border-muted-blue/25 sm:p-5 sm:shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:hover:shadow-[0_8px_24px_-12px_rgb(15_23_42/0.08)]`}
                >
                  <p className="break-words text-pretty text-lg font-semibold text-muted-blue-hover underline-offset-2 group-hover:underline">
                    {property.addressLine1}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {property.city}, {property.state} {property.postalCode ?? ""}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    {property.reviewCount} review
                    {property.reviewCount === 1 ? "" : "s"}
                    {typeof property.averageRent === "number"
                      ? ` · approx. $${property.averageRent.toLocaleString()} / month`
                      : null}
                  </p>
                  <div
                    className={`hidden overflow-hidden transition-all duration-200 md:block ${
                      property.topAmenities && property.topAmenities.length > 0
                        ? "max-h-0 opacity-0 group-hover:mt-3 group-hover:max-h-20 group-hover:opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                    aria-hidden
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Amenities from reviews
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {property.topAmenities?.join(" · ")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {showSignInTeaser ? (
            <div className={`${mobileSectionShell} relative mt-6`}>
              <div
                className="pointer-events-none absolute -top-20 left-0 right-0 h-28 bg-gradient-to-b from-transparent via-zinc-50/90 to-zinc-50"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-zinc-100/40 px-5 py-10 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] backdrop-blur-md sm:px-8">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.35]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-12deg, transparent, transparent 12px, rgb(228 228 231 / 0.5) 12px, rgb(228 228 231 / 0.5) 13px)",
                  }}
                  aria-hidden
                />
                <div className="relative">
                  <p className="text-base font-semibold tracking-tight text-zinc-900">
                    More addresses below the fold
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
                    Sign in to browse the full database of reviewed Boston rentals and
                    open any listing for scores, rent, and renter notes.
                  </p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                    <a
                      href={`/api/auth/signin/google?callbackUrl=${propertiesCallback}`}
                      className="inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-muted-blue-hover sm:w-auto"
                    >
                      Continue with Google
                    </a>
                    <Link
                      href={`/signin?callbackUrl=${propertiesCallback}`}
                      className="inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 sm:w-auto"
                    >
                      Email sign-in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AppPageShell>
  );
}
