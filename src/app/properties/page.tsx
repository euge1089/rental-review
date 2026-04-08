"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { formInputCompactClass, surfaceSubtleClass } from "@/lib/ui-classes";

type PropertySummary = {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  reviewCount: number;
  averageRent: number | null;
};

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

  const visibleProperties = filtered;
  const showSignInTeaser =
    isLoggedOutBrowse && properties.length > previewLimit;

  const propertiesCallback = encodeURIComponent("/properties");

  return (
    <AppPageShell gapClass="gap-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
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
                  Start typing a street, apartment name, or ZIP to filter. South Boston
                  addresses will appear first as you add more reviews there.
                </p>
              )}
              {loggedIn === false ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Search below only filters these preview cards—not every address we have
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
        <div className="w-full max-w-xs shrink-0">
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
            onChange={(event) => setQuery(event.target.value)}
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
      </div>

      {filtered.length === 0 ? (
        isLoggedOutBrowse ? (
          <p className="text-sm text-zinc-600">
            {query.trim()
              ? "No preview address matches that search. It only looks at these 8 cards—not the full database."
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
                className={`${surfaceSubtleClass} p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition hover:border-muted-blue/25 hover:shadow-[0_8px_24px_-12px_rgb(15_23_42/0.08)]`}
              >
                <Link
                  href={`/properties/${property.id}`}
                  className="block break-words text-pretty text-lg font-semibold text-muted-blue-hover underline-offset-2 hover:underline"
                >
                  {property.addressLine1}
                </Link>
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
              </li>
            ))}
          </ul>

          {showSignInTeaser ? (
            <div className="relative mt-6">
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
