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

/**
 * Rank 1 = top (Veteran): full theme pop. Rank 6 = bottom: solid pop-tint.
 * Each badge is a single flat color (no gradient inside the square).
 */
const RANK_BADGE_CLASS: { box: string; num: string }[] = [
  { box: "bg-pop-hover ring-1 ring-black/10", num: "text-white" },
  { box: "bg-pop ring-1 ring-black/10", num: "text-white" },
  { box: "bg-[#e07d42] ring-1 ring-black/5", num: "text-white" },
  { box: "bg-[#ea965e] ring-1 ring-black/5", num: "text-white" },
  { box: "bg-[#f2b88a] ring-1 ring-zinc-300/60", num: "text-muted-blue-hover" },
  { box: "bg-pop-tint ring-1 ring-zinc-200/80", num: "text-muted-blue-hover" },
];

function reviewsRequiredLine(rung: Rung): string {
  if (rung.need === 0) return "Starting rank";
  const label = rung.minReviewsLabel ?? `${rung.need}+ reviews`;
  return `Requires ${label}`;
}

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

  const { nextRungNeed, currentTitle, currentRank } = useMemo(() => {
    const top = RUNGS[topUnlockedIndex] ?? RUNGS[0]!;
    const next = RUNGS.find((r) => r.need > reviewCount);
    const rank = RUNGS.length - topUnlockedIndex;
    return {
      nextRungNeed: next?.need ?? null,
      currentTitle: top.title,
      currentRank: rank,
    };
  }, [reviewCount, topUnlockedIndex]);

  const displayRungs = useMemo(() => {
    return RUNGS.map((rung, index) => ({ rung, index })).reverse();
  }, []);

  const currentBadge =
    RANK_BADGE_CLASS[currentRank - 1] ?? RANK_BADGE_CLASS[0]!;

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
        className="mt-5 flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5"
        role="status"
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold tabular-nums sm:h-14 sm:w-14 sm:text-xl ${currentBadge.box} ${currentBadge.num}`}
          aria-hidden
        >
          {currentRank}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Current rank
          </p>
          <p className="mt-0.5 text-sm font-semibold tracking-tight text-zinc-900">
            {currentTitle}
          </p>
        </div>
      </div>

      <ol className="mt-5 flex flex-col gap-3 sm:gap-3.5">
        {displayRungs.map(({ rung, index }) => {
          const unlocked = reviewCount >= rung.need;
          const isNextGoal = nextRungNeed === rung.need;
          const isCurrentRung = index === topUnlockedIndex;
          const displayRank = RUNGS.length - index;
          const badge =
            RANK_BADGE_CLASS[displayRank - 1] ?? RANK_BADGE_CLASS[0]!;

          return (
            <li
              key={rung.need}
              className="flex items-center gap-3 sm:gap-4"
              aria-current={isCurrentRung ? "step" : undefined}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold tabular-nums sm:h-12 sm:w-12 sm:text-lg ${badge.box} ${badge.num} ${
                  isNextGoal && !unlocked ? "motion-safe:animate-ladder-next" : ""
                }`}
              >
                {displayRank}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold tracking-tight ${
                    unlocked ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  {rung.title}
                </p>
                <p
                  className={`mt-0.5 text-xs tabular-nums ${
                    unlocked ? "text-zinc-500" : "text-zinc-400"
                  }`}
                >
                  {reviewsRequiredLine(rung)}
                </p>
              </div>
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
