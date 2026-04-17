import Link from "next/link";
import {
  appContentMaxWidthClass,
  appContentPaddingXClass,
} from "@/lib/ui-classes";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const cookieConsentEnabled =
    process.env.NEXT_PUBLIC_ENABLE_COOKIE_CONSENT === "1" ||
    process.env.NEXT_PUBLIC_ENABLE_COOKIE_CONSENT === "true";

  return (
    <footer className="mt-auto border-t border-zinc-200/90 bg-zinc-100/95 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] text-zinc-500">
      <div
        className={`mx-auto flex w-full ${appContentMaxWidthClass} flex-col items-center justify-between gap-4 text-center text-xs leading-relaxed sm:flex-row sm:text-left ${appContentPaddingXClass}`}
      >
        <p className="text-zinc-600">
          © {year} Rent Review Boston. All rights reserved.
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-end"
          aria-label="Footer"
        >
          <Link
            href="/properties"
            className="inline-flex min-h-11 items-center font-medium text-muted-blue transition active:opacity-80 hover:text-muted-blue-hover"
          >
            Browse Addresses
          </Link>
          <Link
            href="/submit"
            className="inline-flex min-h-11 items-center font-medium text-muted-blue transition active:opacity-80 hover:text-muted-blue-hover"
          >
            Submit a review
          </Link>
          <Link
            href="/legal/terms"
            className="inline-flex min-h-11 items-center font-medium text-muted-blue transition active:opacity-80 hover:text-muted-blue-hover"
          >
            Terms
          </Link>
          <Link
            href="/legal/privacy"
            className="inline-flex min-h-11 items-center font-medium text-muted-blue transition active:opacity-80 hover:text-muted-blue-hover"
          >
            Privacy
          </Link>
          {cookieConsentEnabled ? (
            <Link
              href="/legal/privacy#cookie-preferences"
              className="inline-flex min-h-11 items-center font-medium text-muted-blue transition active:opacity-80 hover:text-muted-blue-hover"
            >
              Cookie Preferences
            </Link>
          ) : null}
          <Link
            href="/legal/giveaway-rules"
            className="inline-flex min-h-11 items-center font-medium text-muted-blue transition active:opacity-80 hover:text-muted-blue-hover"
          >
            Giveaway Rules
          </Link>
          <Link
            href="/legal/content-complaints"
            className="inline-flex min-h-11 items-center font-medium text-muted-blue transition active:opacity-80 hover:text-muted-blue-hover"
          >
            Content Complaints
          </Link>
          <Link
            href="/legal/copyright"
            className="inline-flex min-h-11 items-center font-medium text-muted-blue transition active:opacity-80 hover:text-muted-blue-hover"
          >
            Copyright
          </Link>
          <Link
            href="/legal/law-enforcement-requests"
            className="inline-flex min-h-11 items-center font-medium text-muted-blue transition active:opacity-80 hover:text-muted-blue-hover"
          >
            Legal Requests
          </Link>
        </nav>
      </div>
    </footer>
  );
}
