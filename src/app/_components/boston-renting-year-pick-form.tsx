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
  const [year, setYear] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const y = year;
    if (y == null || !yearChoices.includes(y)) {
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
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-zinc-800">Select year</p>
        <div
          id="boston-first-year"
          role="radiogroup"
          aria-label="Year you first rented in Boston"
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        >
          {yearChoices.map((y) => (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={year === y}
              onClick={() => setYear(y)}
              className={`inline-flex h-11 w-full items-center justify-center rounded-xl border px-2 text-sm font-semibold tabular-nums transition ${
                year === y
                  ? "border-muted-blue-hover bg-muted-blue-hover text-white"
                  : "border-zinc-200/90 bg-white text-zinc-700 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || year == null}
        className="w-full rounded-full bg-muted-blue py-3 text-sm font-semibold text-white transition hover:bg-muted-blue-hover disabled:opacity-50"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
