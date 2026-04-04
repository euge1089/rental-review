"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  yearChoices: number[];
  submitLabel?: string;
  /** Called after a successful save (in addition to optional router.refresh). */
  onSaved?: (year: number) => void;
};

export function BostonRentingYearPickForm({
  yearChoices,
  submitLabel = "Continue",
  onSaved,
}: Props) {
  const router = useRouter();
  const [year, setYear] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const y = Number(year);
    if (!year || Number.isNaN(y) || !yearChoices.includes(y)) {
      setError("Please choose a year from the list.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bostonRentingSinceYear: y }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      onSaved?.(y);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label htmlFor="boston-first-year" className="text-sm font-semibold text-zinc-800">
          First year I rented in Boston
        </label>
        <select
          id="boston-first-year"
          value={year}
          onChange={(ev) => setYear(ev.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none ring-muted-blue/20 focus:ring-2"
        >
          <option value="">Select year</option>
          {yearChoices.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || !year}
        className="w-full rounded-full bg-muted-blue py-3 text-sm font-semibold text-white transition hover:bg-muted-blue-hover disabled:opacity-50"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
