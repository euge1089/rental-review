 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StoredProperty = {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
};

export function ProfileBookmarks() {
  const [bookmarks, setBookmarks] = useState<StoredProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/bookmarks");
        if (!response.ok) {
          setIsLoading(false);
          return;
        }
        const data = (await response.json()) as {
          ok: boolean;
          bookmarks?: StoredProperty[];
        };
        if (!cancelled && data.ok && data.bookmarks) {
          setBookmarks(data.bookmarks);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading saved apartments…</p>;
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-zinc-50 to-white px-4 py-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:px-5 sm:py-5">
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center sm:items-start sm:text-left">
          <div
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted-blue-tint text-lg text-muted-blue-hover ring-1 ring-muted-blue/15"
            aria-hidden
          >
            ☆
          </div>
          <p className="mt-3 text-base font-semibold tracking-tight text-muted-blue-hover">
            No saved listings yet
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            Tap <span className="font-semibold text-zinc-700">Save apartment</span> on
            any listing to keep your favorites here.
          </p>
          <div className="mt-4 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/properties"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-muted-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-muted-blue-hover"
            >
              Browse listings
            </Link>
            <Link
              href="/analytics"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
            >
              Explore analytics
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
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
  );
}

