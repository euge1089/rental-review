"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formInputClass } from "@/lib/ui-classes";

const ANONYMOUS_COPY =
  "Your public reviews stay fully anonymous - we never show this name on review cards or tie it to an address.";

type Props = {
  initialDisplayName: string | null;
};

export function ProfileDisplayNameCard({ initialDisplayName }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialDisplayName ?? "");
  const [saved, setSaved] = useState<string | null>(initialDisplayName);
  const hasSavedName = Boolean((saved ?? "").trim());
  const [expanded, setExpanded] = useState(() => !initialDisplayName?.trim());

  useEffect(() => {
    setValue(initialDisplayName ?? "");
    setSaved(initialDisplayName ?? null);
    if (!initialDisplayName?.trim()) {
      setExpanded(true);
    }
  }, [initialDisplayName]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = value.trim();
    if (trimmed.length > 120) {
      setError("Please use 120 characters or fewer.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        displayName?: string | null;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setSaved(data.displayName ?? null);
      setValue(data.displayName ?? "");
      setExpanded(!(data.displayName ?? "").trim());
      await getSession();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const dirty = value.trim() !== (saved ?? "").trim();
  const showCollapsed = hasSavedName && !expanded;

  return (
    <section
      id="profile-display-name"
      className={`scroll-mt-24 rounded-2xl border shadow-[0_1px_2px_rgb(15_23_42/0.04)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col ${
        showCollapsed
          ? "border-emerald-200/70 bg-emerald-50/50 px-4 py-3.5 sm:px-5 sm:py-4"
          : "border-zinc-200/80 bg-white p-5 sm:p-6"
      }`}
    >
      {showCollapsed ? (
        <>
          <h2 className="text-base font-semibold text-muted-blue-hover">
            Your name
          </h2>
          <div className="mt-2 flex items-start gap-2">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="group flex min-w-0 flex-1 items-start gap-2 rounded-lg text-left outline-none ring-muted-blue/40 focus-visible:ring-2"
              aria-expanded={false}
              aria-label="Expand to edit your name"
            >
              <span className="min-w-0 flex-1 text-sm leading-snug text-zinc-700">
                {ANONYMOUS_COPY}
              </span>
              <span
                className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-emerald-200/80 bg-white/80 text-zinc-500 transition group-hover:border-emerald-300 group-hover:text-zinc-700"
                aria-hidden
              >
                <svg
                  className="size-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-base font-semibold text-muted-blue-hover">
            Your name
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {ANONYMOUS_COPY}
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={onSubmit}
          >
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                Full name
              </label>
              <input
                className={formInputClass}
                type="text"
                name="displayName"
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
                maxLength={120}
                value={value}
                onChange={(ev) => setValue(ev.target.value)}
              />
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end">
              {hasSavedName ? (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Done
                </button>
              ) : null}
              <button
                type="submit"
                disabled={loading || !dirty}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-muted-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-muted-blue-hover disabled:opacity-50 sm:min-h-10 sm:py-2"
              >
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
          {error ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
