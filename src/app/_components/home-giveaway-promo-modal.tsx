"use client";

import { useCallback, useEffect, useState } from "react";
import { GiveawayPromoStrip } from "@/app/_components/giveaway-promo-strip";
import { isGiveawayPromoActive } from "@/lib/giveaway-promo";
import { modalBackdropClass } from "@/lib/ui-classes";

/**
 * Once per browser session: the promo is offered on the first visit to the home page only.
 * Navigating away and back without closing still counts — we set this when we open the modal.
 */
const SESSION_FIRST_HOME_VISIT_KEY = "rr_home_giveaway_promo_first_home_done";

export function HomeGiveawayPromoModal() {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SESSION_FIRST_HOME_VISIT_KEY, "1");
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    setHydrated(true);
    if (!isGiveawayPromoActive()) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SESSION_FIRST_HOME_VISIT_KEY) === "1") return;
    setOpen(true);
  }, []);

  /** After paint so React Strict Mode’s remount doesn’t see storage set before the real mount. */
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const id = window.requestAnimationFrame(() => {
      window.sessionStorage.setItem(SESSION_FIRST_HOME_VISIT_KEY, "1");
    });
    return () => window.cancelAnimationFrame(id);
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

  if (!hydrated || !open) return null;

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
      <div
        className="relative z-10 w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl border-2 border-pop/35 bg-gradient-to-b from-pop-tint/90 via-white to-muted-blue-tint/20 shadow-[0_20px_50px_-12px_rgb(219_120_55/0.35),0_0_0_1px_rgb(219_120_55/0.12)] sm:max-w-lg"
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pop/25 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-muted-blue/15 blur-2xl"
          aria-hidden
        />
        <button
          type="button"
          className="absolute right-2 top-2 z-20 rounded-full bg-white/90 p-2 text-zinc-500 shadow-sm ring-1 ring-zinc-200/80 transition hover:bg-white hover:text-zinc-800"
          aria-label="Close"
          onClick={dismiss}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="relative px-2 pb-2 pt-10 sm:px-3 sm:pb-3 sm:pt-11">
          <span id="home-giveaway-promo-title" className="sr-only">
            April giveaway promotion
          </span>
          <GiveawayPromoStrip variant="modal" className="border-0 bg-transparent shadow-none ring-0" />
        </div>
      </div>
    </div>
  );
}
