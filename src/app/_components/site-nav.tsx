"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavUser } from "@/app/_components/nav-user";
import {
  appContentMaxWidthClass,
  appContentPaddingXClass,
} from "@/lib/ui-classes";

type SiteNavProps = {
  adminEmail?: string;
};

export function SiteNav({ adminEmail }: SiteNavProps) {
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
            className="inline-flex min-h-11 items-center rounded-full px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:py-1"
          >
            Browse Addresses
          </Link>
          <Link
            href="/analytics"
            className="inline-flex min-h-11 items-center rounded-full px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:py-1"
          >
            Rental Analytics
          </Link>
          <Link
            href="/submit"
            className="inline-flex min-h-11 items-center rounded-full bg-muted-blue px-3 py-2 font-medium text-white transition active:bg-muted-blue-hover hover:bg-muted-blue-hover sm:min-h-0 sm:py-1"
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
            className="inline-flex min-h-11 items-center rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 active:bg-zinc-100"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-site-menu"
          >
            Menu
          </button>
        </div>
      </nav>

      {isMenuOpen ? (
        <div
          className="fixed inset-0 z-50 bg-zinc-900/45 backdrop-blur-[1px] sm:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <aside
            id="mobile-site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="ml-auto flex h-full w-[min(88vw,22rem)] flex-col gap-3 overflow-y-auto bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <p className="text-sm font-semibold text-zinc-900">Menu</p>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium text-zinc-700 active:bg-zinc-100"
              >
                Close
              </button>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <Link
                href="/properties"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80"
              >
                Browse Addresses
              </Link>
              <Link
                href="/analytics"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80"
              >
                Rental Analytics
              </Link>
              <Link
                href="/submit"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80"
              >
                Submit a Review
              </Link>
            </div>
            <div className="border-t border-zinc-100 pt-3">
              <NavUser adminEmail={adminEmail} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
