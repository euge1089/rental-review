"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavUser } from "@/app/_components/nav-user";
import {
  appContentMaxWidthClass,
  appContentPaddingXClass,
} from "@/lib/ui-classes";

type SiteNavProps = {
  adminEmail?: string;
};

function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const desktopNavLinkClass = (active: boolean) =>
  `inline-flex min-h-11 items-center rounded-full px-3 py-2 font-medium sm:min-h-0 sm:py-1 ${
    active
      ? "bg-muted-blue-tint font-semibold text-muted-blue-hover"
      : "text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint"
  }`;

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

const mobileDrawerLinkClass = (active: boolean) =>
  `flex min-h-[3.25rem] items-center rounded-xl px-4 py-3 text-base font-semibold leading-snug tracking-tight transition active:scale-[0.99] ${
    active
      ? "bg-muted-blue-tint text-muted-blue-hover ring-1 ring-muted-blue/20"
      : "text-zinc-800 hover:bg-muted-blue-tint/50"
  }`;

export function SiteNav({ adminEmail }: SiteNavProps) {
  const pathname = usePathname() ?? "";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    queueMicrotask(() => {
      setIsMenuOpen(false);
    });
  }, [pathname]);

  const mobileMenuOverlay =
    isMenuOpen ? (
      <div
        className="fixed inset-0 z-50 min-h-[100dvh] bg-zinc-900/50 backdrop-blur-[2px] sm:hidden"
        onClick={() => setIsMenuOpen(false)}
      >
        <aside
          id="mobile-site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="ml-auto flex h-full min-h-[100dvh] max-h-[100dvh] w-[min(73.5vw,17.325rem)] flex-col overflow-y-auto rounded-l-2xl border border-zinc-200/90 border-r-0 bg-white shadow-[-8px_0_32px_-8px_rgb(15_23_42/0.25)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 border-b border-zinc-200/80 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-blue">
                Rent Review Boston
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
                Menu
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-100/90 text-zinc-700 transition active:bg-zinc-200"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-3 py-3" aria-label="Primary">
            <Link
              href="/properties"
              onClick={() => setIsMenuOpen(false)}
              className={mobileDrawerLinkClass(
                isActiveHref(pathname, "/properties"),
              )}
            >
              Browse Addresses
            </Link>
            <Link
              href="/analytics"
              onClick={() => setIsMenuOpen(false)}
              className={mobileDrawerLinkClass(
                isActiveHref(pathname, "/analytics"),
              )}
            >
              Rental Analytics
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsMenuOpen(false)}
              className={mobileDrawerLinkClass(
                isActiveHref(pathname, "/profile"),
              )}
            >
              Profile
            </Link>
            <Link
              href="/submit"
              onClick={() => setIsMenuOpen(false)}
              className={
                isActiveHref(pathname, "/submit")
                  ? mobileDrawerLinkClass(true)
                  : "mt-1 flex min-h-[3.25rem] items-center justify-center rounded-xl bg-muted-blue px-4 py-3 text-base font-semibold leading-snug tracking-tight text-white shadow-sm transition hover:bg-muted-blue-hover active:scale-[0.99]"
              }
            >
              Submit a Review
            </Link>
          </nav>

          <div className="mt-auto border-t border-zinc-200/80 bg-white px-3 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
            <p className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Account
            </p>
            <NavUser adminEmail={adminEmail} variant="drawer" />
          </div>
        </aside>
      </div>
    ) : null;

  return (
    <>
      <nav
        className={`mx-auto flex w-full min-w-0 ${appContentMaxWidthClass} items-center justify-between gap-3 py-3 ${appContentPaddingXClass}`}
      >
        <div className="flex min-w-0 items-center">
          <Link
            href="/"
            className="inline-flex min-h-11 min-w-0 items-baseline gap-1.5 rounded-md py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-blue-hover"
          >
            <span className="text-[calc(1rem+2pt)] font-semibold tracking-tight text-muted-blue-hover sm:text-lg">
              Rent Review
            </span>
            <span className="text-[calc(1rem+2pt)] font-bold tracking-tight text-muted-blue sm:text-lg">
              Boston
            </span>
          </Link>
        </div>

        <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <Link
            href="/properties"
            className={desktopNavLinkClass(isActiveHref(pathname, "/properties"))}
          >
            Browse Addresses
          </Link>
          <Link
            href="/analytics"
            className={desktopNavLinkClass(isActiveHref(pathname, "/analytics"))}
          >
            Rental Analytics
          </Link>
          <Link
            href="/submit"
            className={`inline-flex min-h-11 items-center rounded-full px-3 py-2 font-medium text-white transition sm:min-h-0 sm:py-1 ${
              isActiveHref(pathname, "/submit")
                ? "bg-muted-blue-hover ring-2 ring-muted-blue-hover/40"
                : "bg-muted-blue active:bg-muted-blue-hover hover:bg-muted-blue-hover"
            }`}
          >
            Submit
          </Link>
          <NavUser adminEmail={adminEmail} />
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/submit"
            className="inline-flex min-h-11 items-center rounded-full bg-muted-blue px-3 py-2 text-sm font-medium text-white transition active:bg-muted-blue-hover"
          >
            Submit
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex size-11 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-800 transition active:bg-zinc-100"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-site-menu"
            aria-label="Open menu"
          >
            <HamburgerIcon className="shrink-0" />
          </button>
        </div>
      </nav>

      {typeof document !== "undefined" && mobileMenuOverlay
        ? createPortal(mobileMenuOverlay, document.body)
        : null}
    </>
  );
}
