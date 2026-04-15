"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { modalBackdropClass, modalDialogClass } from "@/lib/ui-classes";

const STORAGE_KEY = "rr_profile_onboarding_dismissed";

type Props = {
  /** Opened after email sign-up (`?welcome=1`). */
  fromSignup: boolean;
  /** Current display name from the server (empty means not set). */
  displayName: string | null;
  reviewCount: number;
  /** Welcome tips wait until Boston renting year is set. */
  bostonRentingSinceYear: number | null;
};

export function ProfileOnboardingOverlay({
  fromSignup,
  displayName,
  reviewCount,
  bostonRentingSinceYear,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  const missingName = !displayName?.trim();
  const persistedDismissed =
    typeof window !== "undefined" &&
    window.localStorage.getItem(STORAGE_KEY) === "1";
  const open =
    bostonRentingSinceYear != null &&
    (fromSignup || (missingName && !dismissedThisSession && !persistedDismissed));

  const handleDismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setDismissedThisSession(true);
    router.replace(pathname ?? "/profile");
  }, [router, pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleDismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, handleDismiss]);

  if (!open) return null;

  const showNameStep = missingName;
  const showReviewStep = reviewCount === 0;

  return (
    <div className={`${modalBackdropClass} z-[110]`}>
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close welcome message"
        onClick={handleDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-welcome-title"
        className={`${modalDialogClass} z-10 max-w-lg`}
      >
        <h2
          id="profile-welcome-title"
          className="text-xl font-semibold tracking-tight text-muted-blue-hover"
        >
          Welcome to Rent Review Boston
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          We&apos;re glad you&apos;re here. Here are a few friendly next steps to get
          the most out of the site:
        </p>
        <ol className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-700">
          {showNameStep ? (
            <li className="flex gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted-blue-tint text-xs font-bold text-muted-blue-hover"
                aria-hidden
              >
                1
              </span>
              <div>
                <p className="font-medium text-zinc-900">Add your name</p>
                <p className="mt-1 text-zinc-600">
                  It helps other renters recognize a real person behind a review.
                  You can change it whenever you like.
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm font-semibold text-muted-blue hover:underline"
                  onClick={() => {
                    handleDismiss();
                    document
                      .getElementById("profile-display-name")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Go to name →
                </button>
              </div>
            </li>
          ) : null}
          {showReviewStep ? (
            <li className="flex gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted-blue-tint text-xs font-bold text-muted-blue-hover"
                aria-hidden
              >
                {showNameStep ? "2" : "1"}
              </span>
              <div>
                <p className="font-medium text-zinc-900">Share your first review</p>
                <p className="mt-1 text-zinc-600">
                  Tell neighbors what it was like renting your place - rent, building,
                  landlord, the works.
                </p>
                <Link
                  href="/submit"
                  className="mt-2 inline-block text-sm font-semibold text-muted-blue hover:underline"
                  onClick={handleDismiss}
                >
                  Start a review →
                </Link>
              </div>
            </li>
          ) : null}
          <li className="flex gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted-blue-tint text-xs font-bold text-muted-blue-hover"
              aria-hidden
            >
              {showNameStep && showReviewStep
                ? "3"
                : showNameStep || showReviewStep
                  ? "2"
                  : "1"}
            </span>
            <div>
              <p className="font-medium text-zinc-900">Look around Boston</p>
              <p className="mt-1 text-zinc-600">
                Browse addresses others have reviewed and peek at rent patterns for
                your neighborhood.
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-muted-blue">
                <Link href="/properties" className="hover:underline" onClick={handleDismiss}>
                  Browse reviews →
                </Link>
                <Link href="/analytics" className="hover:underline" onClick={handleDismiss}>
                  Rent explorer →
                </Link>
              </div>
            </div>
          </li>
        </ol>
        <button
          type="button"
          className="mt-8 w-full rounded-full bg-muted-blue py-3 text-sm font-semibold text-white transition hover:bg-muted-blue-hover"
          onClick={handleDismiss}
        >
          Got it, thanks
        </button>
      </div>
    </div>
  );
}
