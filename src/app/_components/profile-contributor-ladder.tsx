"use client";

import { useMemo } from "react";
import { surfaceElevatedClass } from "@/lib/ui-classes";

type Rung = {
  need: number;
  title: string;
  /** Inside the orange badge - no "reviews" (e.g. `0`, `1+`, `5+`). */
  bubbleLabel: string;
  /** Subtitle under the tier name. */
  subtitle: string;
};

const RUNGS: Rung[] = [
  { need: 0, title: "Getting Started", bubbleLabel: "0", subtitle: "0 reviews" },
  { need: 1, title: "Contributor", bubbleLabel: "1+", subtitle: "1+ reviews" },
  { need: 2, title: "Verified", bubbleLabel: "2+", subtitle: "2+ reviews" },
  { need: 3, title: "Established", bubbleLabel: "3+", subtitle: "3+ reviews" },
  { need: 4, title: "Insider", bubbleLabel: "4+", subtitle: "4+ reviews" },
  { need: 5, title: "Veteran Contributor", bubbleLabel: "5+", subtitle: "5+ reviews" },
];

/**
 * Top row (Veteran): strongest pop. Bottom row (Getting Started): pop-tint.
 * Index 0 = top of list, 5 = bottom.
 */
const TIER_BADGE_STYLE: { box: string; text: string }[] = [
  { box: "bg-pop-hover ring-1 ring-black/10", text: "text-white" },
  { box: "bg-pop ring-1 ring-black/10", text: "text-white" },
  { box: "bg-[#e07d42] ring-1 ring-black/5", text: "text-white" },
  { box: "bg-[#ea965e] ring-1 ring-black/5", text: "text-white" },
  { box: "bg-[#f2b88a] ring-1 ring-zinc-300/60", text: "text-muted-blue-hover" },
  { box: "bg-pop-tint ring-1 ring-zinc-200/80", text: "text-muted-blue-hover" },
];

function tierStyleIndexFromRungIndex(rungIndex: number): number {
  return RUNGS.length - 1 - rungIndex;
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

  const { nextRungNeed, currentRung } = useMemo(() => {
    const top = RUNGS[topUnlockedIndex] ?? RUNGS[0]!;
    const next = RUNGS.find((r) => r.need > reviewCount);
    return {
      nextRungNeed: next?.need ?? null,
      currentRung: top,
    };
  }, [reviewCount, topUnlockedIndex]);

  const displayRungs = useMemo(() => {
    return RUNGS.map((rung, index) => ({ rung, index })).reverse();
  }, []);

  const currentStyle =
    TIER_BADGE_STYLE[tierStyleIndexFromRungIndex(topUnlockedIndex)] ??
    TIER_BADGE_STYLE[0]!;

  const tierNameClass = (unlocked: boolean) =>
    `text-sm font-normal uppercase tracking-wide ${
      unlocked ? "text-zinc-900" : "text-zinc-400"
    }`;

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
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold tabular-nums sm:h-12 sm:w-12 sm:text-lg ${currentStyle.box} ${currentStyle.text}`}
        >
          {currentRung.bubbleLabel}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Current rank
          </p>
          <p className={`mt-0.5 ${tierNameClass(true)}`}>
            {currentRung.title}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-zinc-500">
            {currentRung.subtitle}
          </p>
        </div>
      </div>

      <ol className="mt-5 flex flex-col gap-3 sm:gap-3.5">
        {displayRungs.map(({ rung, index }) => {
          const unlocked = reviewCount >= rung.need;
          const isNextGoal = nextRungNeed === rung.need;
          const isCurrentRung = index === topUnlockedIndex;
          const styleIdx = tierStyleIndexFromRungIndex(index);
          const badge =
            TIER_BADGE_STYLE[styleIdx] ?? TIER_BADGE_STYLE[0]!;

          return (
            <li
              key={rung.need}
              className="flex items-start gap-3 sm:gap-4"
              aria-current={isCurrentRung ? "step" : undefined}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold tabular-nums sm:h-12 sm:w-12 sm:text-lg ${badge.box} ${badge.text} ${
                  isNextGoal && !unlocked ? "motion-safe:animate-ladder-next" : ""
                }`}
              >
                {rung.bubbleLabel}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className={tierNameClass(unlocked)}>{rung.title}</p>
                <p
                  className={`mt-0.5 text-xs tabular-nums ${
                    unlocked ? "text-zinc-500" : "text-zinc-400"
                  }`}
                >
                  {rung.subtitle}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {remaining === 0 ? (
        <p className="mt-4 text-center text-[11px] text-zinc-500">
          Max slots in use - edit or remove a review on your profile to free one.
        </p>
      ) : null}
    </aside>
  );
}
