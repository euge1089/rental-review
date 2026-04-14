"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBostonRentingSinceYearChoices } from "@/lib/policy";

type Props = {
  userId: string;
  current: number | null;
};

export function AdminUserBostonYearEditor({ userId, current }: Props) {
  const router = useRouter();
  const baseChoices = getBostonRentingSinceYearChoices();
  const yearOptions = useMemo(() => {
    if (current != null && !baseChoices.includes(current)) {
      return [current, ...baseChoices].sort((a, b) => b - a);
    }
    return baseChoices;
  }, [current, baseChoices]);

  const [value, setValue] = useState<string>(
    current != null ? String(current) : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(current != null ? String(current) : "");
  }, [current]);

  async function patchYear(body: { bostonRentingSinceYear: number | null }) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not update.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1 sm:items-end">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        Boston start year
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="max-w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800"
        >
          <option value="">Assign year…</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={loading || value === ""}
          onClick={() =>
            void patchYear({ bostonRentingSinceYear: Number(value) })
          }
          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-muted-blue-hover hover:bg-muted-blue-tint/40 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void patchYear({ bostonRentingSinceYear: null })}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      {current != null ? (
        <p className="text-[10px] text-zinc-500">Saved: {current}</p>
      ) : (
        <p className="text-[10px] text-amber-700">Not set - user sees profile gate</p>
      )}
      {error ? (
        <p className="text-[11px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
