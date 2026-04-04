"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { surfaceElevatedClass } from "@/lib/ui-classes";

type Rung = {
  need: number;
  title: string;
  tagline: string;
  emoji: string;
  /** Pill text for minimum reviews at this tier (default: "{need}+ reviews") */
  minReviewsLabel?: string;
};

const RUNGS: Rung[] = [
  {
    need: 0,
    title: "Getting Started",
    tagline: "Welcome. Post your first lease-year review when you’re ready.",
    emoji: "🏠",
    minReviewsLabel: "0 reviews",
  },
  {
    need: 1,
    title: "Contributor",
    tagline: "One review on the board—renters can already learn from you.",
    emoji: "📌",
  },
  {
    need: 2,
    title: "Verified",
    tagline: "Two entries show you’ve been around more than one lease.",
    emoji: "✓",
  },
  {
    need: 3,
    title: "Established",
    tagline: "Three buildings documented—you’re building real compare-and-contrast signal.",
    emoji: "📊",
  },
  {
    need: 4,
    title: "Insider",
    tagline: "Four reviews deep—you know how different corners of the market feel.",
    emoji: "🎯",
  },
  {
    need: 5,
    title: "Veteran Contributor",
    tagline: "Five or more reviews—you’re among the most trusted voices here.",
    emoji: "⭐",
    minReviewsLabel: "5+ reviews",
  },
];

type Props = {
  reviewCount: number;
  maxReviews: number;
  className?: string;
};

export function ProfileContributorLadder({
  reviewCount,
  maxReviews,
  className = "",
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const remaining = Math.max(0, maxReviews - reviewCount);

  const topUnlockedIndex = useMemo(() => {
    let top = 0;
    for (let i = 0; i < RUNGS.length; i++) {
      if (reviewCount >= RUNGS[i]!.need) top = i;
    }
    return top;
  }, [reviewCount]);

  const { nextRungNeed, currentTitle, currentEmoji } = useMemo(() => {
    const top = RUNGS[topUnlockedIndex] ?? RUNGS[0]!;
    const next = RUNGS.find((r) => r.need > reviewCount);
    return {
      nextRungNeed: next?.need ?? null,
      currentTitle: top.title,
      currentEmoji: top.emoji,
    };
  }, [reviewCount, topUnlockedIndex]);

  return (
    <aside
      className={`${surfaceElevatedClass} relative overflow-hidden border-l-4 border-l-accent-teal p-5 sm:p-6 ${className}`}
      aria-label="Contributor rank ladder"
    >
      <div
        className="pointer-events-none absolute -right-12 top-8 h-36 w-36 rounded-full bg-pop/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-accent-teal/20 blur-2xl"
        aria-hidden
      />

      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-blue">
          Your climb
        </p>
        <h2 className="mt-1.5 text-lg font-bold tracking-tight text-muted-blue-hover">
          Contributor ladder
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          <span className="font-semibold tabular-nums text-zinc-800">{remaining}</span>{" "}
          review slot{remaining === 1 ? "" : "s"} left out of{" "}
          <span className="tabular-nums">{maxReviews}</span>. Climb by submitting real
          lease-year snapshots.
        </p>

        <div
          className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-muted-blue-tint/80 to-accent-teal-tint/50 px-3 py-2.5 ring-1 ring-muted-blue/15"
          role="status"
        >
          <span className="text-2xl" aria-hidden>
            {currentEmoji}
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-blue">
              Current rank
            </p>
            <p className="text-sm font-bold text-muted-blue-hover">{currentTitle}</p>
          </div>
        </div>

        <div className="relative mt-6 pl-1">
          <div
            className="absolute bottom-3 left-[1.35rem] top-3 w-0.5 rounded-full bg-gradient-to-b from-zinc-200 via-accent-teal/30 to-pop/40"
            aria-hidden
          />
          <ol className="relative flex flex-col gap-3">
            {RUNGS.map((rung, index) => {
              const unlocked = reviewCount >= rung.need;
              const isNextGoal = nextRungNeed === rung.need;
              const isHover = hovered === index;
              const isCurrentRung = index === topUnlockedIndex;

              return (
                <li key={rung.need} className="relative z-[1]">
                  <div
                    className="flex cursor-default gap-3 rounded-2xl py-0.5 transition-transform duration-200 motion-safe:hover:translate-x-1"
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    aria-current={isCurrentRung ? "step" : undefined}
                  >
                    <div className="flex w-10 shrink-0 flex-col items-center pt-0.5">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg shadow-sm transition-all duration-300 ${
                          unlocked
                            ? "border-accent-teal bg-gradient-to-br from-white to-accent-teal-tint shadow-[0_6px_20px_-6px_rgb(13_148_136/0.45)]"
                            : "border-zinc-200/90 bg-white text-zinc-400 opacity-65"
                        } ${
                          isNextGoal
                            ? "ring-[3px] ring-pop/40 motion-safe:animate-ladder-next"
                            : ""
                        } ${isHover ? "motion-safe:scale-110" : "scale-100"}`}
                      >
                        <span aria-hidden>{rung.emoji}</span>
                      </span>
                    </div>
                    <div
                      className={`min-w-0 flex-1 rounded-2xl border px-3 py-2.5 transition-all duration-300 ${
                        unlocked
                          ? "border-accent-teal/35 bg-white/95 shadow-[0_8px_28px_-14px_rgb(13_148_136/0.3)]"
                          : "border-zinc-100 bg-zinc-50/70"
                      } ${isNextGoal ? "border-pop/45 bg-pop-tint/60" : ""} ${
                        isHover && unlocked
                          ? "shadow-elevated-hover"
                          : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-1">
                        <p
                          className={`text-xs font-bold tracking-tight ${
                            unlocked ? "text-muted-blue-hover" : "text-zinc-500"
                          }`}
                        >
                          {rung.title}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums uppercase tracking-wide ${
                            unlocked
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-200/80 text-zinc-500"
                          }`}
                        >
                          {rung.minReviewsLabel ?? `${rung.need}+ reviews`}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-zinc-600">
                        {rung.tagline}
                      </p>
                      {isNextGoal && !unlocked ? (
                        <p className="mt-1.5 text-[11px] font-semibold text-pop">
                          Next stop — keep going!
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <Link
          href={remaining > 0 ? "/submit" : "/properties"}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-full bg-muted-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(21_42_69/0.35)] transition motion-safe:hover:scale-[1.02] motion-safe:hover:bg-muted-blue-hover motion-safe:active:scale-[0.98]"
        >
          {remaining > 0 ? "Climb another rung →" : "Explore more addresses →"}
        </Link>
        {remaining === 0 ? (
          <p className="mt-2 text-center text-[11px] text-zinc-500">
            You&apos;re at the top! Edit or remove a review to free a slot.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
