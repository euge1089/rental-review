"use client";

import { BostonRentingYearPickForm } from "@/app/_components/boston-renting-year-pick-form";
import { modalBackdropClass, modalDialogClass } from "@/lib/ui-classes";

type Props = {
  yearChoices: number[];
};

export function ProfileBostonYearGate({ yearChoices }: Props) {
  return (
    <div className={`${modalBackdropClass} z-[115]`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="boston-year-gate-title"
        className={`${modalDialogClass} z-10 max-w-md shadow-elevated`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-blue">
          One quick thing
        </p>
        <h2
          id="boston-year-gate-title"
          className="mt-2 text-xl font-semibold tracking-tight text-muted-blue-hover"
        >
          When did you first rent in Boston?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          You can only submit reviews for lease years on or after the year you select.
        </p>
        <div className="mt-6">
          <BostonRentingYearPickForm yearChoices={yearChoices} />
        </div>
      </div>
    </div>
  );
}
