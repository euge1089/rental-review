"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("query") ?? "";
  });

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          if (!cancelled) setLoggedIn(false);
          return;
        }
        const data = (await res.json()) as { user?: unknown };
        if (!cancelled) setLoggedIn(!!data.user);
      } catch {
        if (!cancelled) setLoggedIn(false);
      }
    }
    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) => {
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
  }, [properties, query]);

  return (
    <AppPageShell gapClass="gap-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Browse"
          title="Reviewed Boston addresses"
          description={
            <>
              <p>
                Start typing a street, apartment name, or ZIP to filter. South Boston
                addresses will appear first as you add more reviews there.
              </p>
              {loggedIn === false ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Sign in to see full review details for each apartment.
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
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Search by street or ZIP
          </label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. West 3rd, 02127"
            className={formInputCompactClass}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-600">
          No properties match your search yet. Try a different street or ZIP, or{" "}
          <Link href="/submit" className="font-medium text-muted-blue hover:underline">
            add the first review for an address
          </Link>
          .
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((property) => (
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
      )}
    </AppPageShell>
  );
}
