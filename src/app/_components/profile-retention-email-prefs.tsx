"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileAccordionSection } from "@/app/_components/profile-accordion-section";

const SUMMARY =
  "Control reminder nudges and optional daily activity summary emails.";

type Props = {
  initialOptOut: boolean;
  initialMessageEmailsOptOut: boolean;
};

export function ProfileRetentionEmailPrefs({
  initialOptOut,
  initialMessageEmailsOptOut,
}: Props) {
  const router = useRouter();
  const [optOut, setOptOut] = useState(initialOptOut);
  const [messageOptOut, setMessageOptOut] = useState(initialMessageEmailsOptOut);
  const [loadingRetention, setLoadingRetention] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOptOut(initialOptOut);
  }, [initialOptOut]);

  useEffect(() => {
    setMessageOptOut(initialMessageEmailsOptOut);
  }, [initialMessageEmailsOptOut]);

  async function onRetentionChange(next: boolean) {
    setError(null);
    setLoadingRetention(true);
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
      setLoadingRetention(false);
    }
  }

  async function onMessageOptOutChange(next: boolean) {
    setError(null);
    setLoadingMessage(true);
    const prev = messageOptOut;
    setMessageOptOut(next);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageEmailsOptOut: next }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setMessageOptOut(prev);
        setError(data.error ?? "Could not update.");
        return;
      }
      router.refresh();
    } finally {
      setLoadingMessage(false);
    }
  }

  return (
    <ProfileAccordionSection
      id="email-preferences"
      title="Email preferences"
      summary={SUMMARY}
      defaultExpanded={false}
      collapsedTone="neutral"
      expandedTone="neutral"
    >
      <p className="text-sm leading-relaxed text-zinc-600">
        Control optional emails. Account, sign-in, and security messages may still be
        sent when needed.
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-800">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-zinc-300 text-muted-blue focus:ring-muted-blue/40"
          checked={optOut}
          disabled={loadingRetention || loadingMessage}
          onChange={(e) => onRetentionChange(e.target.checked)}
        />
        <span>
          <span className="font-medium">Opt out of reminder emails</span>
          <span className="mt-0.5 block text-zinc-600">
            Occasional nudges if you haven&apos;t submitted a review or may still have
            lease-start years to cover.
          </span>
        </span>
      </label>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-800">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-zinc-300 text-muted-blue focus:ring-muted-blue/40"
          checked={messageOptOut}
          disabled={loadingRetention || loadingMessage}
          onChange={(e) => onMessageOptOutChange(e.target.checked)}
        />
        <span>
          <span className="font-medium">Opt out of activity summary emails</span>
          <span className="mt-0.5 block text-zinc-600">
            When off (default), we send at most one email per day (evening Eastern Time)
            summarizing helpful votes on your reviews and new private messages. Turn
            this on to skip that digest.
          </span>
        </span>
      </label>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </ProfileAccordionSection>
  );
}
