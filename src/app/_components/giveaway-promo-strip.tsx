"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { linkInlineClass } from "@/lib/ui-classes";

/**
 * Entries close at the start of May 1, 2026 in America/New_York
 * (i.e. end of April 30 — midnight Eastern turning into May 1).
 * May 1, 2026 00:00:00 EDT = 2026-05-01T04:00:00.000Z
 */
const GIVEAWAY_END_MS = Date.parse("2026-05-01T04:00:00.000Z");

type Variant = "home" | "submit";

type Props = {
  variant?: Variant;
  className?: string;
};

function formatRemaining(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const s = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return { days, hours, minutes, seconds };
}

function CountdownDisplay({ endMs }: { endMs: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = useMemo(() => {
    if (now == null) return null;
    return formatRemaining(endMs - now);
  }, [now, endMs]);

  if (parts == null) {
    return (
      <span className="tabular-nums text-zinc-500" aria-hidden>
        — : — : — : —
      </span>
    );
  }

  const { days, hours, minutes, seconds } = parts;
  return (
    <span className="font-semibold tabular-nums text-muted-blue-hover">
      {days}d {hours}h {minutes}m {seconds}s
    </span>
  );
}

export function GiveawayPromoStrip({ variant = "home", className = "" }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted && Date.now() >= GIVEAWAY_END_MS) {
    return null;
  }

  const isHome = variant === "home";

  return (
    <aside
      className={`rounded-2xl border border-pop/25 bg-gradient-to-r from-pop-tint/90 via-white to-muted-blue-tint/50 px-4 py-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:px-5 sm:py-4 ${className}`}
      aria-label="Monthly giveaway promotion"
    >
      <div
        className={
          isHome
            ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            : "flex flex-col gap-2.5"
        }
      >
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-pop/20"
            aria-hidden
          >
            🍽️
          </span>
          <p className="min-w-0 text-sm leading-snug text-zinc-800 sm:text-[0.9375rem] sm:leading-relaxed">
            <span className="font-semibold text-muted-blue-hover">
              April giveaway:
            </span>{" "}
            Enter to win Boston restaurant gift cards — submit an anonymous rental
            review.{" "}
            <Link href="/submit" className={`${linkInlineClass} font-semibold`}>
              Leave a review →
            </Link>
          </p>
        </div>
        <div
          className={
            isHome
              ? "flex shrink-0 flex-col gap-0.5 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-zinc-200/80 sm:items-end sm:text-right"
              : "flex flex-col gap-0.5 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-zinc-200/80"
          }
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Countdown · ends Apr 30 (ET)
          </p>
          <p className="text-sm text-zinc-700">
            <CountdownDisplay endMs={GIVEAWAY_END_MS} />
          </p>
        </div>
      </div>
    </aside>
  );
}
