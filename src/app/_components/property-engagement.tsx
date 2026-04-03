 "use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  propertyId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
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

  return (
    <section className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium text-zinc-900">Stay organized for this apartment</p>
        <p className="text-xs text-zinc-600">
          Star this address to keep it in your saved list. Use the tour checklist to
          bring focused questions to a showing.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={toggleBookmark}
          className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs ${
            isBookmarked
              ? "bg-zinc-900 text-white active:bg-zinc-800 hover:bg-zinc-700"
              : "border border-zinc-300 bg-white text-zinc-700 active:bg-zinc-50 hover:bg-zinc-100"
          }`}
          disabled={isSaving}
        >
          {isBookmarked ? "★ Saved" : "☆ Save apartment"}
        </button>
        <Link
          href="/tour-checklist"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 active:bg-zinc-50 hover:bg-zinc-100 sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
        >
          Tour checklist
        </Link>
      </div>
    </section>
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

