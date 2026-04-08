"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { linkInlineClass } from "@/lib/ui-classes";

/**
 * Entries close at the start of May 1, 2026 in America/New_York
 * (end of April 30 Eastern).
 */
const GIVEAWAY_END_MS = Date.parse("2026-05-01T04:00:00.000Z");

/** Max entries we show in the promo bar (matches your giveaway cap story). */
const GIVEAWAY_ENTRY_CAP = 5;

type Variant = "home" | "submit";

type Props = {
  variant?: Variant;
  className?: string;
};

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 12v10H4V12" />
      <path d="M22 7H2v5h20V7z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

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
      <span className="tabular-nums text-zinc-400" aria-hidden>
        — · — · — · —
      </span>
    );
  }

  const { days, hours, minutes, seconds } = parts;
  return (
    <span className="text-sm font-medium tabular-nums tracking-tight text-muted-blue-hover">
      {days}d {hours}h {minutes}m {seconds}s
    </span>
  );
}

function EntryProgressBar({
  used,
  cap,
  signedIn,
  loading,
}: {
  used: number;
  cap: number;
  signedIn: boolean;
  loading: boolean;
}) {
  const clamped = Math.min(Math.max(0, used), cap);
  const pct = cap > 0 ? (clamped / cap) * 100 : 0;

  return (
    <div className="border-t border-zinc-100 pt-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-zinc-600">
          Giveaway entries{" "}
          <span className="font-normal text-zinc-500">(max {cap} per person)</span>
        </p>
        {signedIn ? (
          loading ? (
            <p className="text-xs tabular-nums text-zinc-400">…</p>
          ) : (
            <p className="text-xs font-semibold tabular-nums text-muted-blue-hover">
              {clamped} of {cap}
              {used > cap ? " · cap reached" : ""}
            </p>
          )
        ) : (
          <p className="text-xs text-zinc-500">
            <Link href="/signin" className={`${linkInlineClass} font-medium`}>
              Sign in
            </Link>{" "}
            to track yours
          </p>
        )}
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200/80"
        role="progressbar"
        aria-valuenow={signedIn && !loading ? clamped : 0}
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-busy={signedIn && loading}
        aria-label={
          signedIn
            ? loading
              ? "Loading giveaway entry count"
              : `${clamped} of ${cap} giveaway entries used`
            : "Sign in to track giveaway entries"
        }
      >
        <div
          className="h-full rounded-full bg-muted-blue transition-[width] duration-500 ease-out"
          style={{
            width:
              signedIn && !loading ? `${pct}%` : signedIn && loading ? "8%" : "0%",
          }}
        />
      </div>
      {signedIn && !loading && used === 0 ? (
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          Each approved review can add another entry until you hit {cap}.
        </p>
      ) : null}
      {signedIn && !loading ? (
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">
          Bar uses your reviews on file; final giveaway eligibility follows official rules.
        </p>
      ) : null}
    </div>
  );
}

export function GiveawayPromoStrip({ variant = "home", className = "" }: Props) {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  const signedIn = status === "authenticated" && Boolean(session?.user?.email);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setReviewCount(null);
      setCountLoading(false);
      return;
    }
    setCountLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews/my-count");
        const data = (await res.json()) as {
          ok?: boolean;
          count?: number;
        };
        if (!cancelled && data.ok && typeof data.count === "number") {
          setReviewCount(data.count);
        }
      } catch {
        if (!cancelled) setReviewCount(0);
      } finally {
        if (!cancelled) setCountLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  if (mounted && Date.now() >= GIVEAWAY_END_MS) {
    return null;
  }

  const isHome = variant === "home";
  const entriesUsed = reviewCount ?? 0;

  return (
    <aside
      className={`overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgb(15_23_42/0.06)] ${className}`}
      aria-label="Monthly giveaway promotion"
    >
      <div className="flex border-l-[3px] border-l-muted-blue pl-4 pr-4 py-4 sm:pl-5 sm:pr-5 sm:py-5">
        <div className="min-w-0 flex-1">
          <div
            className={
              isHome
                ? "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8"
                : "flex flex-col gap-4"
            }
          >
            <div className="min-w-0 flex gap-3.5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted-blue-tint/60 text-muted-blue-hover ring-1 ring-muted-blue/15"
                aria-hidden
              >
                <GiftIcon className="text-muted-blue-hover" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  April giveaway
                </p>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-zinc-800 sm:text-[0.9375rem]">
                  <strong className="font-semibold text-muted-blue-hover">
                    $200
                  </strong>{" "}
                  in Boston restaurant gift cards will be awarded — enter by sharing an{" "}
                  <strong className="font-semibold text-muted-blue-hover">
                    anonymous
                  </strong>{" "}
                  rental review.{" "}
                  <Link
                    href="/submit"
                    className={`${linkInlineClass} font-semibold text-muted-blue`}
                  >
                    Submit a review
                  </Link>
                </p>
              </div>
            </div>

            <div
              className={
                isHome
                  ? "flex shrink-0 items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-2.5 lg:flex-col lg:items-stretch lg:gap-1"
                  : "flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-2.5"
              }
            >
              <div className="flex items-center gap-2 text-zinc-500">
                <ClockIcon className="shrink-0 text-muted-blue/80" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Ends Apr 30 · ET
                </span>
              </div>
              <CountdownDisplay endMs={GIVEAWAY_END_MS} />
            </div>
          </div>

          <EntryProgressBar
            used={entriesUsed}
            cap={GIVEAWAY_ENTRY_CAP}
            signedIn={signedIn}
            loading={signedIn && countLoading}
          />
        </div>
      </div>
    </aside>
  );
}
