"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProfileAccordionSection } from "@/app/_components/profile-accordion-section";
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

  return (
    <ProfileAccordionSection
      id="profile-display-name"
      title="Your name"
      summary={ANONYMOUS_COPY}
      collapsedTone="emerald"
      expandedTone="neutral"
      expanded={expanded}
      onExpandedChange={setExpanded}
    >
      <p className="text-sm leading-relaxed text-zinc-600">{ANONYMOUS_COPY}</p>
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
    </ProfileAccordionSection>
  );
}
