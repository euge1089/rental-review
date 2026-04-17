"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { GIVEAWAY_PROMO_END_MS } from "@/lib/giveaway-promo";
import { linkInlineClass } from "@/lib/ui-classes";

/** Max entries we show in the promo bar (matches your giveaway cap story). */
const GIVEAWAY_ENTRY_CAP = 5;

type Variant = "home" | "modal";

type Placement = "default" | "properties";

type Props = {
  variant?: Variant;
  /** Browse page: phone-only shorter copy and tighter layout for the promo strip. */
  placement?: Placement;
  showDismiss?: boolean;
  onDismiss?: () => void;
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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = useMemo(() => formatRemaining(endMs - now), [now, endMs]);

  const { days, hours, minutes, seconds } = parts;
  return (
    <span
      className={
        large
          ? "text-base font-medium tabular-nums tracking-tight text-pop sm:text-lg"
          : "text-sm font-medium tabular-nums tracking-tight text-pop"
      }
    >
      {days}d {hours}h {minutes}m {seconds}s
    </span>
  );
}

function ModalGiftConfetti() {
  return (
    <div className="pointer-events-none absolute -inset-2 overflow-visible" aria-hidden>
      <span className="absolute left-0 top-0.5 h-1 w-1 rounded-full bg-pop/28" />
      <span className="absolute left-5 top-0 h-1 w-1 rounded-full bg-muted-blue/32" />
      <span className="absolute left-7 top-4 h-1 w-1 rounded-full bg-muted-blue/22" />
      <span className="absolute bottom-1 left-0 h-0.5 w-0.5 rounded-full bg-pop/22" />
      <span className="absolute bottom-0 left-4 h-1 w-1 rounded-full bg-muted-blue/28" />
    </div>
  );
}

function EntryProgressBar({
  used,
  cap,
  signedIn,
  loading,
  excited,
  modalTone,
  compactRulesFooter = false,
}: {
  used: number;
  cap: number;
  signedIn: boolean;
  loading: boolean;
  excited?: boolean;
  modalTone?: boolean;
  /** Shorter rules line on small screens (browse properties). */
  compactRulesFooter?: boolean;
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

  const topRule = excited
    ? "border-t border-pop/20 pt-3"
    : modalTone
      ? "border-t border-muted-blue/15 pt-4"
      : "border-t border-zinc-100 pt-4";

  return (
    <div className={topRule}>
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
                  ? "font-bold text-pop underline decoration-pop/40 underline-offset-2 hover:text-pop"
                  : `${linkInlineClass} font-medium`
              }
            >
              Sign in to track entries
            </Link>
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
          {compactRulesFooter ? (
            <>
              <span className="sm:hidden">
                Bar uses your reviews on file; eligibility follows{" "}
                <Link href="/legal/giveaway-rules" className={linkInlineClass}>
                  official rules
                </Link>
                .
              </span>
              <span className="hidden sm:inline">
                Bar uses your reviews on file; final giveaway eligibility follows{" "}
                <Link href="/legal/giveaway-rules" className={linkInlineClass}>
                  official rules
                </Link>
                .
              </span>
            </>
          ) : (
            <>
              Bar uses your reviews on file; final giveaway eligibility follows{" "}
              <Link href="/legal/giveaway-rules" className={linkInlineClass}>
                official rules
              </Link>
              .
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

export function GiveawayPromoStrip({
  variant = "home",
  placement = "default",
  showDismiss = false,
  onDismiss,
  className = "",
}: Props) {
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
  const isPropertiesBrowse = placement === "properties";
  const entriesUsed = reviewCount ?? 0;

  const asideSurface = "rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgb(15_23_42/0.06)]";

  const innerAccent = [
    "flex border-l-[3px] border-l-muted-blue py-4 sm:py-5",
    isPropertiesBrowse
      ? "pl-3 pr-3 max-sm:pl-3 max-sm:pr-2.5 sm:pl-5 sm:pr-5"
      : "pl-4 pr-4 sm:pl-5 sm:pr-5",
  ].join(" ");

  if (isModal) {
    return (
      <aside
        className={`overflow-hidden rounded-2xl border-0 bg-transparent shadow-none ${className}`}
        aria-label="Monthly giveaway promotion"
      >
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 -top-1 h-px bg-gradient-to-r from-transparent via-muted-blue/35 to-transparent"
            aria-hidden
          />
          <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
            <div className="relative shrink-0 max-sm:mx-auto">
              <div
                className="absolute -inset-1 rounded-xl bg-muted-blue-tint/50"
                aria-hidden
              />
              <ModalGiftConfetti />
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 text-muted-blue-hover shadow-sm sm:h-11 sm:w-11"
                aria-hidden
              >
                <GiftIcon className="text-muted-blue-hover" width={20} height={20} />
              </div>
            </div>
            <div className="min-w-0 flex-1 pt-0.5 sm:pl-0.5">
              <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-pop sm:text-left sm:text-[0.9375rem]">
                April giveaway
              </p>
              <p className="mt-1 text-center text-[1.75rem] font-extrabold leading-none tracking-tight text-muted-blue-hover sm:text-left sm:text-[2.125rem]">
                $200
              </p>
              <p className="mt-2 text-center text-pretty text-sm leading-snug text-zinc-700 sm:text-left sm:text-[0.9375rem]">
                Eight $25 Boston dining gift cards ($200 total), up to eight
                winners, one card each.
              </p>
              <p className="mt-1.5 text-center text-pretty text-sm leading-snug text-zinc-700 sm:text-left sm:text-[0.9375rem]">
                One quick anonymous review enters you.
              </p>
              <Link
                href="/submit"
                className="mt-3 flex w-full min-h-[2.875rem] items-center justify-center rounded-lg bg-muted-blue px-4 py-3 text-center text-sm font-semibold text-white shadow-sm ring-1 ring-muted-blue/20 transition hover:bg-muted-blue-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-blue"
              >
                Submit a review
              </Link>
              <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-500 sm:text-xs">
                <span className="text-muted-blue/90">100% anonymous</span>
                {", "}
                takes about a minute
              </p>
              <p className="mt-1.5 text-center text-[11px] leading-relaxed text-zinc-500 sm:text-xs">
                <Link href="/legal/giveaway-rules" className={linkInlineClass}>
                  Official giveaway rules
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-muted-blue/20 bg-muted-blue-tint/80 px-3.5 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] sm:px-4 sm:py-3.5">
            <p className="text-sm font-semibold text-muted-blue-hover">Giveaway ends in</p>
            <div className="mt-1">
              <CountdownDisplay endMs={GIVEAWAY_PROMO_END_MS} large />
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">Deadline April 30 · Eastern Time</p>
          </div>

          <EntryProgressBar
            used={entriesUsed}
            cap={GIVEAWAY_ENTRY_CAP}
            signedIn={signedIn}
            loading={signedIn && countLoading}
            excited={false}
            modalTone
            compactRulesFooter={isPropertiesBrowse}
          />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`overflow-hidden ${asideSurface} ${className}`}
      aria-label="Monthly giveaway promotion"
    >
      <div className={innerAccent}>
        <div className="min-w-0 flex-1">
          {showDismiss ? (
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition active:bg-zinc-100"
                aria-label="Dismiss giveaway"
              >
                ×
              </button>
            </div>
          ) : null}
          <div
            className={
              isHome
                ? "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8"
                : "flex flex-col gap-4"
            }
          >
            <div className="flex w-full min-w-0 gap-3.5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted-blue-tint/60 text-muted-blue-hover ring-1 ring-muted-blue/15"
                aria-hidden
              >
                <GiftIcon className="text-muted-blue-hover" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-pop">
                  April giveaway
                </p>
                <p
                  className={`mt-1.5 text-sm leading-relaxed text-zinc-800 sm:text-[0.9375rem] ${
                    isPropertiesBrowse
                      ? "max-sm:w-full max-sm:text-left sm:text-pretty"
                      : "text-pretty"
                  }`}
                >
                  <strong className="font-semibold text-muted-blue-hover">Eight $25</strong>{" "}
                  Boston dining gift cards (
                  <strong className="font-semibold text-muted-blue-hover">$200</strong>{" "}
                  total), up to eight winners, one card each
                  {isPropertiesBrowse ? (
                    <>
                      <span className="hidden sm:inline"> will be awarded</span> - enter by
                      sharing an{" "}
                    </>
                  ) : (
                    <> will be awarded - enter by sharing an </>
                  )}
                  <strong className="font-semibold text-muted-blue-hover">anonymous</strong>{" "}
                  rental review.{" "}
                  <Link
                    href="/submit"
                    className={`${linkInlineClass} font-semibold text-muted-blue underline underline-offset-2`}
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
              {isPropertiesBrowse ? (
                <div className="hidden items-center gap-2 text-zinc-500 sm:flex">
                  <ClockIcon className="shrink-0 text-muted-blue/80" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-pop">
                    Ends Apr 30 · ET
                  </span>
                </div>
              ) : null}
              {isPropertiesBrowse ? (
                <span className="hidden sm:block">
                  <CountdownDisplay endMs={GIVEAWAY_PROMO_END_MS} large={false} />
                </span>
              ) : (
              <div className="flex items-center gap-2 text-zinc-500">
                <ClockIcon className="shrink-0 text-muted-blue/80" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-pop">
                  Ends Apr 30 · ET
                </span>
              </div>
              )}
              {!isPropertiesBrowse ? (
                <CountdownDisplay endMs={GIVEAWAY_PROMO_END_MS} large={false} />
              ) : null}
            </div>
          </div>

          <EntryProgressBar
            used={entriesUsed}
            cap={GIVEAWAY_ENTRY_CAP}
            signedIn={signedIn}
            loading={signedIn && countLoading}
            excited={false}
            compactRulesFooter={isPropertiesBrowse}
          />
          {isPropertiesBrowse ? (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-2.5 sm:hidden">
              <div className="flex items-center gap-2 text-zinc-500">
                <ClockIcon className="shrink-0 text-muted-blue/80" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-pop">
                  Ends Apr 30 · ET
                </span>
              </div>
              <CountdownDisplay endMs={GIVEAWAY_PROMO_END_MS} large={false} />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
