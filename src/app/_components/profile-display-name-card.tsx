"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formInputClass } from "@/lib/ui-classes";

type Props = {
  initialDisplayName: string | null;
};

export function ProfileDisplayNameCard({ initialDisplayName }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialDisplayName ?? "");
  const [saved, setSaved] = useState<string | null>(initialDisplayName);

  useEffect(() => {
    setValue(initialDisplayName ?? "");
    setSaved(initialDisplayName ?? null);
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
      await getSession();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const dirty = value.trim() !== (saved ?? "").trim();

  return (
    <section
      id="profile-display-name"
      className="scroll-mt-24 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-6"
    >
      <h2 className="text-base font-semibold text-muted-blue-hover">
        Your name
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        This is how you&apos;ll appear in the app (for example in the header). You
        can update it any time.
      </p>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit}>
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
        <button
          type="submit"
          disabled={loading || !dirty}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-muted-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-muted-blue-hover disabled:opacity-50 sm:min-h-10 sm:py-2"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </form>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
