"use client";

import { useRouter } from "next/navigation";
import {
  SUBMIT_STEP1_PREFILL_KEY,
  buildPrefillFromReviewRow,
  type SubmitPrefillReviewSource,
} from "@/lib/submit-prefill";

type Props = {
  templateReview: SubmitPrefillReviewSource;
  disabled: boolean;
};

export function ProfileAddAnotherLeaseYearButton({
  templateReview,
  disabled,
}: Props) {
  const router = useRouter();

  function handleClick() {
    const prefill = buildPrefillFromReviewRow(templateReview);
    window.localStorage.setItem(SUBMIT_STEP1_PREFILL_KEY, JSON.stringify(prefill));
    router.push("/submit?another=1");
  }

  return (
    <button
      type="button"
      disabled={disabled}
      title={
        disabled
          ? "You’re at your review limit - remove or edit a review on your profile to add another."
          : "Open the form with this address pre-filled; choose a different lease-start year."
      }
      onClick={handleClick}
      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-accent-teal/35 bg-accent-teal-tint/50 px-4 py-2 text-xs font-semibold text-teal-950 transition hover:border-accent-teal/50 hover:bg-accent-teal-tint disabled:cursor-not-allowed disabled:opacity-45"
    >
      Add another lease year
    </button>
  );
}
