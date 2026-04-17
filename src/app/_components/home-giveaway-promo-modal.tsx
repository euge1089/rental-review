"use client";

import { useCallback, useEffect, useState } from "react";
import { GiveawayPromoStrip } from "@/app/_components/giveaway-promo-strip";
import { isGiveawayPromoActive } from "@/lib/giveaway-promo";
import { modalBackdropClass } from "@/lib/ui-classes";

/**
 * Once per browser session: the promo is offered on the first visit to the home page only.
 * Navigating away and back without closing still counts - we set this when we open the modal.
 */
const SESSION_FIRST_HOME_VISIT_KEY = "rr_home_giveaway_promo_first_home_done";

export function HomeGiveawayPromoModal() {
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SESSION_FIRST_HOME_VISIT_KEY, "1");
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isGiveawayPromoActive()) return;
    if (window.sessionStorage.getItem(SESSION_FIRST_HOME_VISIT_KEY) === "1") return;

    // Count this first home visit immediately so it never repeats within the session.
    window.sessionStorage.setItem(SESSION_FIRST_HOME_VISIT_KEY, "1");

    const id = window.setTimeout(() => {
      if (isGiveawayPromoActive()) {
        setOpen(true);
      }
    }, 5000);

    return () => {
      window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SESSION_FIRST_HOME_VISIT_KEY, "1");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className={`${modalBackdropClass} z-[120]`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-giveaway-promo-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close promotion"
        onClick={dismiss}
      />
      <div className="relative z-10 w-full max-w-[min(100%,21.5rem)] overflow-hidden rounded-2xl border border-zinc-200/90 bg-[#f4f5f7] shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-4px_rgb(15_23_42/0.1),0_20px_48px_-12px_rgb(15_23_42/0.12)] ring-1 ring-zinc-900/[0.04] sm:max-w-[25rem]">
        <button
          type="button"
          className="absolute right-1.5 top-1.5 z-20 rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-200/50 hover:text-zinc-600"
          aria-label="Close"
          onClick={dismiss}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="relative px-3 pb-3 pt-9 sm:px-4 sm:pb-4 sm:pt-10">
          <span id="home-giveaway-promo-title" className="sr-only">
            April giveaway: we are giving twenty-five-dollar Boston dining gift
            cards, two hundred dollars total, to eight winners
          </span>
          <GiveawayPromoStrip variant="modal" className="border-0 bg-transparent shadow-none ring-0" />
        </div>
      </div>
    </div>
  );
}
