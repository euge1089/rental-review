"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Props = {
  propertyId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type StoredProperty = {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
};

const RECENT_KEY = "rental-review-recent-v1";
export const BOOKMARK_KEY = "rental-review-bookmarks-v1";

export function PropertyEngagement(props: Props) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(RECENT_KEY);
    let items: StoredProperty[] = [];
    if (raw) {
      try {
        items = JSON.parse(raw) as StoredProperty[];
      } catch {
        items = [];
      }
    }
    const existingIndex = items.findIndex((p) => p.id === props.propertyId);
    if (existingIndex !== -1) {
      items.splice(existingIndex, 1);
    }
    items.unshift({
      id: props.propertyId,
      addressLine1: props.addressLine1,
      city: props.city,
      state: props.state,
      postalCode: props.postalCode,
    });
    items = items.slice(0, 10);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(items));
  }, [props.propertyId, props.addressLine1, props.city, props.state, props.postalCode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(BOOKMARK_KEY);
    if (!raw) return;
    try {
      const items = JSON.parse(raw) as StoredProperty[];
      const existing = items.find((p) => p.id === props.propertyId);
      if (existing) {
        setIsBookmarked(true);
      }
    } catch {
      // ignore
    }
  }, [props.propertyId]);

  async function toggleBookmark() {
    if (typeof window === "undefined") return;
    if (isSaving) return;

    setIsSaving(true);
    const raw = window.localStorage.getItem(BOOKMARK_KEY);
    let items: StoredProperty[] = [];
    if (raw) {
      try {
        items = JSON.parse(raw) as StoredProperty[];
      } catch {
        items = [];
      }
    }
    const index = items.findIndex((p) => p.id === props.propertyId);
    const willBookmark = index === -1;

    if (willBookmark) {
      items.unshift({
        id: props.propertyId,
        addressLine1: props.addressLine1,
        city: props.city,
        state: props.state,
        postalCode: props.postalCode,
      });
    } else {
      items.splice(index, 1);
    }

    window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(items));

    try {
      const response = await fetch("/api/bookmarks", {
        method: willBookmark ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: props.propertyId }),
      });
      const result = (await response.json()) as { ok: boolean };
      if (!result.ok) {
        // Revert local change on failure
        if (willBookmark) {
          const revertIndex = items.findIndex((p) => p.id === props.propertyId);
          if (revertIndex !== -1) {
            items.splice(revertIndex, 1);
          }
        } else {
          items.unshift({
            id: props.propertyId,
            addressLine1: props.addressLine1,
            city: props.city,
            state: props.state,
            postalCode: props.postalCode,
          });
        }
        window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(items));
        setIsSaving(false);
        return;
      }
      setIsBookmarked(willBookmark);
    } catch {
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
  }

  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const hasMapToken = mapToken.trim().length > 0;
  const hasCoordinates =
    typeof props.latitude === "number" && typeof props.longitude === "number";
  const showMapSnapshot = hasMapToken && hasCoordinates;

  const mapSnapshotUrl = showMapSnapshot
    ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+db7837(${props.longitude},${props.latitude})/${props.longitude},${props.latitude},13.2/320x320@2x?access_token=${encodeURIComponent(mapToken)}`
    : null;

  return (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:justify-end">
        <button
          type="button"
          onClick={toggleBookmark}
          className={`inline-flex min-h-10 w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition sm:min-h-0 lg:w-auto lg:min-w-[11.5rem] ${
            isBookmarked
              ? "bg-muted-blue-hover text-white shadow-[0_8px_24px_-10px_rgb(21_42_69/0.45)] hover:bg-[#1a3555]"
              : "border border-zinc-200/90 bg-white text-muted-blue-hover shadow-sm hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
          }`}
          disabled={isSaving}
        >
          {isBookmarked ? "★ Saved" : "☆ Save apartment"}
        </button>
        <Link
          href="/tour-checklist"
          className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-zinc-200/90 bg-white px-4 py-2 text-sm font-semibold text-muted-blue-hover shadow-sm transition hover:border-pop/40 hover:bg-pop-tint/50 lg:w-auto lg:min-w-[11.5rem]"
        >
          Tour checklist
        </Link>
      </div>

      <div className="hidden lg:block lg:w-[12.75rem]">
        {showMapSnapshot && mapSnapshotUrl ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.06)]">
            <Image
              src={mapSnapshotUrl}
              alt={`Map snapshot for ${props.addressLine1}`}
              width={320}
              height={320}
              className="block h-[12.75rem] w-full object-cover"
              unoptimized
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="flex h-[12.75rem] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/80 px-4 text-center">
            <p className="text-xs leading-relaxed text-zinc-500">
              Map snapshot unavailable for this address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function HomeSavedAndRecent() {
  const [recent, setRecent] = useState<StoredProperty[]>([]);
  const [bookmarks, setBookmarks] = useState<StoredProperty[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const r = window.localStorage.getItem(RECENT_KEY);
      const b = window.localStorage.getItem(BOOKMARK_KEY);
      if (r) {
        setRecent(JSON.parse(r) as StoredProperty[]);
      }
      if (b) {
        setBookmarks(JSON.parse(b) as StoredProperty[]);
      }
    } catch {
      // ignore
    }
  }, []);

  if (recent.length === 0 && bookmarks.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {bookmarks.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          <p className="text-sm font-semibold text-zinc-900">Saved apartments</p>
          <ul className="mt-2 space-y-1 text-sm">
            {bookmarks.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/properties/${p.id}`}
                  className="text-zinc-800 underline-offset-2 hover:underline"
                >
                  {p.addressLine1}
                </Link>
                <span className="text-xs text-zinc-500">
                  {" "}
                  · {p.city}, {p.state} {p.postalCode ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {recent.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          <p className="text-sm font-semibold text-zinc-900">Recently viewed</p>
          <ul className="mt-2 space-y-1 text-sm">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/properties/${p.id}`}
                  className="text-zinc-800 underline-offset-2 hover:underline"
                >
                  {p.addressLine1}
                </Link>
                <span className="text-xs text-zinc-500">
                  {" "}
                  · {p.city}, {p.state} {p.postalCode ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

