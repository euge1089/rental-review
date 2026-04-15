"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialOptOut: boolean;
  embedded?: boolean;
};

export function ProfileRetentionEmailPrefs({
  initialOptOut,
  embedded = false,
}: Props) {
  const router = useRouter();
  const [optOut, setOptOut] = useState(initialOptOut);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOptOut(initialOptOut);
  }, [initialOptOut]);

  async function onChange(next: boolean) {
    setError(null);
    setLoading(true);
    const prev = optOut;
    setOptOut(next);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionEmailsOptOut: next }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setOptOut(prev);
        setError(data.error ?? "Could not update.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const content = (
    <>
      <p className="text-sm font-semibold text-muted-blue-hover">Email reminders</p>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
        Occasional nudges if you haven&apos;t submitted a review yet, or if you may
        still have lease-start years to cover. Account and security emails are
        separate.
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-800">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-zinc-300 text-muted-blue focus:ring-muted-blue/40"
          checked={optOut}
          disabled={loading}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          <span className="font-medium">Opt out of reminder emails</span>
          <span className="mt-0.5 block text-zinc-600">
            You won&apos;t receive retention reminders; you can turn this back off
            anytime.
          </span>
        </span>
      </label>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return <div id="email-preferences">{content}</div>;
  }

  return (
    <section
      id="email-preferences"
      className="scroll-mt-24 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6"
    >
      {content}
    </section>
  );
}
