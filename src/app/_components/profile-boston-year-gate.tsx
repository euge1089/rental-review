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
          We ask every renter for the first calendar year they started leasing an
          apartment in Boston. You can only submit reviews for lease years{" "}
          <span className="font-medium text-zinc-800">on or after</span> the year you
          pick — it keeps the map honest. You can&apos;t change this yourself later;
          contact us if it was wrong.
        </p>
        <div className="mt-6">
          <BostonRentingYearPickForm yearChoices={yearChoices} />
        </div>
      </div>
    </div>
  );
}
