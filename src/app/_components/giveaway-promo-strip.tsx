"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { GIVEAWAY_PROMO_END_MS } from "@/lib/giveaway-promo";
import { linkInlineClass } from "@/lib/ui-classes";

/** Max entries we show in the promo bar (matches your giveaway cap story). */
const GIVEAWAY_ENTRY_CAP = 5;

type Variant = "home" | "submit" | "modal";

type Props = {
  variant?: Variant;
  className?: string;
};

function GiftIcon({
  className,
  width = 20,
  height = 20,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
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

function CountdownDisplay({
  endMs,
  large,
}: {
  endMs: number;
  large?: boolean;
}) {
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
      <span
        className={`tabular-nums text-zinc-400 ${large ? "text-lg" : "text-sm"}`}
        aria-hidden
      >
        — · — · — · —
      </span>
    );
  }

  const { days, hours, minutes, seconds } = parts;
  return (
    <span
      className={
        large
          ? "text-xl font-bold tabular-nums tracking-tight text-pop sm:text-2xl"
          : "text-sm font-medium tabular-nums tracking-tight text-muted-blue-hover"
      }
    >
      {days}d {hours}h {minutes}m {seconds}s
    </span>
  );
}

function EntryProgressBar({
  used,
  cap,
  signedIn,
  loading,
  excited,
}: {
  used: number;
  cap: number;
  signedIn: boolean;
  loading: boolean;
  excited?: boolean;
}) {
  const clamped = Math.min(Math.max(0, used), cap);
  const pct = cap > 0 ? (clamped / cap) * 100 : 0;

  const labelSm = excited ? "text-sm font-semibold text-zinc-800" : "text-xs font-medium text-zinc-600";
  const subSm = excited ? "text-sm font-normal text-zinc-600" : "text-xs font-normal text-zinc-500";
  const trackClass = excited
    ? "h-3 rounded-full bg-zinc-100 ring-2 ring-pop/20"
    : "h-2.5 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200/80";
  const fillClass = excited
    ? "h-full rounded-full bg-gradient-to-r from-pop to-pop-hover transition-[width] duration-500 ease-out"
    : "h-full rounded-full bg-muted-blue transition-[width] duration-500 ease-out";

  return (
    <div className={`${excited ? "border-t border-pop/20 pt-3" : "border-t border-zinc-100 pt-4"}`}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className={labelSm}>
          Giveaway entries{" "}
          <span className={subSm}>(max {cap} per person)</span>
        </p>
        {signedIn ? (
          loading ? (
            <p className={`tabular-nums text-zinc-400 ${excited ? "text-sm" : "text-xs"}`}>…</p>
          ) : (
            <p
              className={`font-semibold tabular-nums ${excited ? "text-base text-pop" : "text-xs text-muted-blue-hover"}`}
            >
              {clamped} of {cap}
              {used > cap ? " · cap reached" : ""}
            </p>
          )
        ) : (
          <p className={`text-zinc-600 ${excited ? "text-sm" : "text-xs"}`}>
            <Link
              href="/signin"
              className={
                excited
                  ? "font-bold text-pop underline decoration-pop/40 underline-offset-2 hover:text-pop-hover"
                  : `${linkInlineClass} font-medium`
              }
            >
              Sign in
            </Link>{" "}
            to track yours
          </p>
        )}
      </div>
      <div
        className={`${trackClass} overflow-hidden`}
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
          className={fillClass}
          style={{
            width:
              signedIn && !loading ? `${pct}%` : signedIn && loading ? "8%" : "0%",
          }}
        />
      </div>
      {signedIn && !loading && used === 0 ? (
        <p
          className={`mt-2 leading-relaxed text-zinc-500 ${excited ? "text-xs" : "text-[11px]"}`}
        >
          Each approved review can add another entry until you hit {cap}.
        </p>
      ) : null}
      {signedIn && !loading ? (
        <p
          className={`mt-2 leading-relaxed text-zinc-400 ${excited ? "text-[11px]" : "text-[10px]"}`}
        >
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

  if (mounted && Date.now() >= GIVEAWAY_PROMO_END_MS) {
    return null;
  }

  const isModal = variant === "modal";
  const isHome = variant === "home";
  const entriesUsed = reviewCount ?? 0;

  const asideSurface = isModal
    ? "rounded-2xl border-0 bg-white shadow-none"
    : "rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgb(15_23_42/0.06)]";

  const innerAccent = isModal
    ? "flex px-1 py-1 sm:px-2 sm:py-2"
    : "flex border-l-[3px] border-l-muted-blue pl-4 pr-4 py-4 sm:pl-5 sm:pr-5 sm:py-5";

  return (
    <aside
      className={`overflow-hidden ${asideSurface} ${className}`}
      aria-label="Monthly giveaway promotion"
    >
      <div className={innerAccent}>
        <div className="min-w-0 flex-1">
          <div
            className={
              isHome && !isModal
                ? "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8"
                : isModal
                  ? "flex flex-col gap-3"
                  : "flex flex-col gap-4"
            }
          >
            <div className={`min-w-0 flex ${isModal ? "gap-3" : "gap-3.5"}`}>
              <div
                className={
                  isModal
                    ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted-blue-tint/60 text-muted-blue-hover ring-1 ring-muted-blue/15"
                    : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted-blue-tint/60 text-muted-blue-hover ring-1 ring-muted-blue/15"
                }
                aria-hidden
              >
                <GiftIcon
                  className="text-muted-blue-hover"
                  width={isModal ? 22 : 20}
                  height={isModal ? 22 : 20}
                />
              </div>
              <div className={`min-w-0 ${isModal ? "pt-0" : "pt-0.5"}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  April giveaway
                </p>
                <p
                  className={
                    isModal
                      ? "mt-1.5 text-pretty text-[0.9375rem] leading-relaxed text-zinc-800 sm:text-base"
                      : "mt-1.5 text-pretty text-sm leading-relaxed text-zinc-800 sm:text-[0.9375rem]"
                  }
                >
                  <strong className="font-semibold text-muted-blue-hover">$200</strong>{" "}
                  in Boston restaurant gift cards will be awarded — enter by sharing an{" "}
                  <strong className="font-semibold text-muted-blue-hover">anonymous</strong>{" "}
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
                isHome && !isModal
                  ? "flex shrink-0 items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-2.5 lg:flex-col lg:items-stretch lg:gap-1"
                  : isModal
                    ? "flex w-full flex-col gap-1 rounded-xl bg-zinc-50 px-3.5 py-2.5"
                    : "flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-2.5"
              }
            >
              <div className="flex items-center gap-2 text-zinc-500">
                <ClockIcon className="shrink-0 text-muted-blue/80" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Ends Apr 30 · ET
                </span>
              </div>
              <CountdownDisplay endMs={GIVEAWAY_PROMO_END_MS} large={isModal} />
            </div>
          </div>

          <EntryProgressBar
            used={entriesUsed}
            cap={GIVEAWAY_ENTRY_CAP}
            signedIn={signedIn}
            loading={signedIn && countLoading}
            excited={false}
          />
        </div>
      </div>
    </aside>
  );
}
