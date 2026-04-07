"use client";

import { useEffect, useState } from "react";
import { EmailAuthPanel } from "@/app/_components/email-auth-panel";
import { modalBackdropClass, modalDialogClass } from "@/lib/ui-classes";

type Props = {
  callbackUrl?: string;
  /** Matches hero primary button sizing for full-width vs contained layouts */
  variant: "wide" | "narrow";
};

export function HeroSignUpOverlay({
  callbackUrl = "/",
  variant,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const buttonClass =
    variant === "wide"
      ? "inline-flex min-h-11 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-muted-blue px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition active:bg-muted-blue-hover/95 hover:bg-muted-blue-hover lg:w-auto"
      : "inline-flex min-h-11 w-full shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-muted-blue px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition active:bg-muted-blue-hover/95 hover:bg-muted-blue-hover sm:w-auto";

  return (
    <>
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          setPanelKey((k) => k + 1);
          setOpen(true);
        }}
      >
        Sign up
      </button>

      {open ? (
        <div className={modalBackdropClass}>
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hero-signup-title"
            className={`${modalDialogClass} overflow-hidden`}
          >
            <div
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-pop/35 to-transparent sm:inset-x-8"
              aria-hidden
            />
            <button
              type="button"
              className="absolute right-2 top-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-zinc-400 transition active:bg-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-700 sm:right-3 sm:top-3 sm:min-h-0 sm:min-w-0 sm:p-2"
              aria-label="Close dialog"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close</span>
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
            <h2
              id="hero-signup-title"
              className="pr-10 text-xl font-semibold tracking-tight text-muted-blue-hover"
            >
              Sign up
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Continue with Google or create an account with email. New accounts
              receive a short verification code before you can sign in.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Your public review is anonymous. We never show your name on review cards,
              and your account information stays private.
            </p>
            <div className="mt-6">
              <EmailAuthPanel
                key={panelKey}
                callbackUrl={callbackUrl}
                signupFocus
                onSignedIn={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
