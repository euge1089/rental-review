"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  userId: string;
  /** Shown in the confirm dialog (e.g. email). */
  userLabel: string;
};

export function AdminDeleteUserButton({ userId, userLabel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const ok = window.confirm(
      `Delete this account permanently?\n\n${userLabel}\n\nThis removes the user, all of their reviews, bookmarks, and reports. This cannot be undone.`,
    );
    if (!ok) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not delete user.");
        return;
      }
      router.refresh();
    } catch {
      setError("Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleDelete()}
        className="inline-flex min-h-10 items-center rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 sm:min-h-0"
      >
        {loading ? "Deleting…" : "Delete account"}
      </button>
      {error ? (
        <p className="max-w-[14rem] text-right text-[11px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
