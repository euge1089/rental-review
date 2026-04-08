"use client";

import { useCallback, useEffect, useState } from "react";
import { GiveawayPromoStrip } from "@/app/_components/giveaway-promo-strip";
import { isGiveawayPromoActive } from "@/lib/giveaway-promo";
import { modalBackdropClass, modalDialogClass } from "@/lib/ui-classes";

const STORAGE_KEY = "rr_home_giveaway_promo_dismissed";

export function HomeGiveawayPromoModal() {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    setHydrated(true);
    if (!isGiveawayPromoActive()) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    setOpen(true);
  }, []);

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
        className={`${modalDialogClass} relative z-10 max-w-lg p-0 sm:max-w-xl sm:p-0`}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-20 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
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
        <div className="p-4 pt-12 sm:p-6 sm:pt-14">
          <span id="home-giveaway-promo-title" className="sr-only">
            April giveaway promotion
          </span>
          <GiveawayPromoStrip
            variant="home"
            className="border-0 shadow-none ring-0"
          />
        </div>
      </div>
    </div>
  );
}
