"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type BlockedRow = {
  blockedUserId: string;
  displayName: string | null;
  email: string;
};

type Props = {
  initialBlocks: BlockedRow[];
};

export function ProfileBlockedRenters({ initialBlocks }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function unblock(blockedUserId: string) {
    setError(null);
    setPendingId(blockedUserId);
    try {
      const res = await fetch(
        `/api/user-blocks?blockedUserId=${encodeURIComponent(blockedUserId)}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not unblock.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not unblock.");
    } finally {
      setPendingId(null);
    }
  }

  if (initialBlocks.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        You haven&apos;t blocked anyone. You can block a renter from an open message
        thread.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {initialBlocks.map((b) => (
        <li
          key={b.blockedUserId}
          className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 text-sm text-zinc-800">
            <p className="font-medium">
              {b.displayName?.trim() || b.email}
            </p>
            {b.displayName?.trim() ? (
              <p className="truncate text-xs text-zinc-500">{b.email}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={pendingId === b.blockedUserId}
            onClick={() => unblock(b.blockedUserId)}
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {pendingId === b.blockedUserId ? "…" : "Unblock"}
          </button>
        </li>
      ))}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </ul>
  );
}
