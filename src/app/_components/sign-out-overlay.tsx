"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { signOut } from "next-auth/react";
import { modalBackdropClass, modalDialogClass } from "@/lib/ui-classes";

type Props = {
  /** Classes for the “Sign out” control in the nav (matches previous link styling). */
  triggerClassName: string;
};

export function SignOutOverlay({ triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeModal = useCallback(() => {
    setError(null);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) closeModal();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, busy, closeModal]);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Sign out
      </button>

      {mounted && open
        ? createPortal(
            <div className={`${modalBackdropClass} z-[220]`}>
              <button
                type="button"
                className="absolute inset-0"
                aria-label="Close"
                disabled={busy}
                onClick={() => !busy && closeModal()}
              >
              </button>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="sign-out-title"
                className={`${modalDialogClass} overflow-hidden`}
              >
                <div
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-pop/35 to-transparent sm:inset-x-8"
                  aria-hidden
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-zinc-400 transition active:bg-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-40 sm:right-3 sm:top-3 sm:min-h-0 sm:min-w-0 sm:p-2"
                  aria-label="Close dialog"
                  disabled={busy}
                  onClick={closeModal}
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
                  id="sign-out-title"
                  className="pr-10 text-xl font-semibold tracking-tight text-muted-blue-hover"
                >
                  Sign out
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  You&apos;ll be signed out of Rent Review Boston. You can sign back in
                  anytime with the same account.
                </p>
                {error ? (
                  <p className="mt-3 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 sm:w-auto"
                    disabled={busy}
                    onClick={closeModal}
                  >
                    Stay signed in
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full bg-muted-blue px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition hover:bg-muted-blue-hover disabled:opacity-60 sm:w-auto"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      try {
                        await signOut({ callbackUrl: "/" });
                      } catch {
                        setError("Something went wrong. Try again.");
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </div>
            </div>
            ,
            document.body,
          )
        : null}
    </>
  );
}
