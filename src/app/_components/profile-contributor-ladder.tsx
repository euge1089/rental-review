"use client";

import { useMemo } from "react";
import { surfaceElevatedClass } from "@/lib/ui-classes";

type Rung = {
  need: number;
  title: string;
  minReviewsLabel?: string;
};

const RUNGS: Rung[] = [
  { need: 0, title: "Getting Started", minReviewsLabel: "0 reviews" },
  { need: 1, title: "Contributor" },
  { need: 2, title: "Verified" },
  { need: 3, title: "Established" },
  { need: 4, title: "Insider" },
  { need: 5, title: "Veteran Contributor", minReviewsLabel: "5+ reviews" },
];

/** Per-tier accent: stripe + soft fill + ring hint (gamified but flat). */
const TIER_STYLE = [
  {
    stripe: "bg-stone-400",
    soft: "bg-stone-50",
    border: "border-stone-200/90",
    ring: "ring-stone-300/50",
  },
  {
    stripe: "bg-sky-500",
    soft: "bg-sky-50",
    border: "border-sky-200/80",
    ring: "ring-sky-400/45",
  },
  {
    stripe: "bg-teal-500",
    soft: "bg-teal-50",
    border: "border-teal-200/80",
    ring: "ring-teal-400/45",
  },
  {
    stripe: "bg-indigo-500",
    soft: "bg-indigo-50",
    border: "border-indigo-200/80",
    ring: "ring-indigo-400/45",
  },
  {
    stripe: "bg-violet-500",
    soft: "bg-violet-50",
    border: "border-violet-200/80",
    ring: "ring-violet-400/45",
  },
  {
    stripe: "bg-amber-500",
    soft: "bg-amber-50",
    border: "border-amber-200/80",
    ring: "ring-amber-400/50",
  },
] as const;

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
  const remaining = Math.max(0, maxReviews - reviewCount);

  const topUnlockedIndex = useMemo(() => {
    let top = 0;
    for (let i = 0; i < RUNGS.length; i++) {
      if (reviewCount >= RUNGS[i]!.need) top = i;
    }
    return top;
  }, [reviewCount]);

  const { nextRungNeed, currentTitle, currentTierStyle } = useMemo(() => {
    const top = RUNGS[topUnlockedIndex] ?? RUNGS[0]!;
    const next = RUNGS.find((r) => r.need > reviewCount);
    return {
      nextRungNeed: next?.need ?? null,
      currentTitle: top.title,
      currentTierStyle: TIER_STYLE[topUnlockedIndex] ?? TIER_STYLE[0]!,
    };
  }, [reviewCount, topUnlockedIndex]);

  const displayRungs = useMemo(() => {
    return RUNGS.map((rung, index) => ({ rung, index })).reverse();
  }, []);

  return (
    <aside
      className={`${surfaceElevatedClass} border border-zinc-200/90 p-5 sm:p-6 ${className}`}
      aria-label="Profile ranking"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-blue">
        Your progress
      </p>
      <h2 className="mt-1.5 text-lg font-bold tracking-tight text-muted-blue-hover">
        Profile ranking
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        <span className="font-semibold tabular-nums text-zinc-800">{remaining}</span>{" "}
        review slot{remaining === 1 ? "" : "s"} left of{" "}
        <span className="tabular-nums">{maxReviews}</span>.
      </p>

      <div
        className={`mt-5 rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5 ${currentTierStyle.border} ${currentTierStyle.soft}`}
        role="status"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Current rank
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${currentTierStyle.stripe}`}
            aria-hidden
          />
          <p className="text-sm font-semibold tracking-tight text-zinc-900">
            {currentTitle}
          </p>
        </div>
      </div>

      <ol className="mt-5 flex flex-col gap-2">
        {displayRungs.map(({ rung, index }) => {
          const unlocked = reviewCount >= rung.need;
          const isNextGoal = nextRungNeed === rung.need;
          const isCurrentRung = index === topUnlockedIndex;
          const style = TIER_STYLE[index] ?? TIER_STYLE[0]!;

          return (
            <li
              key={rung.need}
              className={`relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                unlocked
                  ? `${style.soft} ${style.border}`
                  : "border-zinc-100 bg-zinc-50/80"
              } ${
                isCurrentRung && unlocked
                  ? `ring-2 ring-offset-2 ring-offset-white ${style.ring}`
                  : ""
              } ${
                isNextGoal && !unlocked ? "motion-safe:animate-ladder-next" : ""
              }`}
              aria-current={isCurrentRung ? "step" : undefined}
            >
              <span
                className={`h-9 w-1 shrink-0 rounded-full ${
                  unlocked ? style.stripe : "bg-zinc-200"
                }`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold tracking-tight ${
                    unlocked ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  {rung.title}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tabular-nums uppercase tracking-wide ${
                  unlocked
                    ? "bg-white/80 text-zinc-700 ring-1 ring-zinc-200/80"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {rung.minReviewsLabel ?? `${rung.need}+ reviews`}
              </span>
            </li>
          );
        })}
      </ol>

      {remaining === 0 ? (
        <p className="mt-4 text-center text-[11px] text-zinc-500">
          Max slots in use — edit or remove a review on your profile to free one.
        </p>
      ) : null}
    </aside>
  );
}
