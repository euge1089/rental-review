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
      <p className="text-sm text-zinc-600">
        You haven&apos;t saved any apartments yet. Visit an apartment page and click
        &quot;Save apartment&quot; to keep track of places you&apos;re considering.
      </p>
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

