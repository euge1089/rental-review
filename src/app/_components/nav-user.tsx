"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { SignOutOverlay } from "@/app/_components/sign-out-overlay";
import { messagesUiEnabled } from "@/lib/feature-flags";

type Props = {
  adminEmail?: string;
  /** Larger touch targets and stacked layout for the mobile slide-out menu. */
  variant?: "default" | "drawer";
};

export function NavUser({ adminEmail, variant = "default" }: Props) {
  const { data: session, status } = useSession();
  const user = status === "authenticated" ? session?.user : null;

  const email = user?.email ?? null;
  const displayName = user?.name ?? email ?? null;
  const isAdmin =
    !!adminEmail &&
    !!email &&
    adminEmail.toLowerCase() === email.toLowerCase();

  if (!user) {
    if (variant === "drawer") {
      return (
        <Link
          href="/signin"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-muted-blue px-4 py-3 text-base font-semibold text-white shadow-sm transition active:bg-muted-blue-hover"
        >
          Sign in
        </Link>
      );
    }
    return (
      <Link
        href="/signin"
        className="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:py-1"
      >
        Sign in
      </Link>
    );
  }

  if (variant === "drawer") {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        {messagesUiEnabled ? (
          <Link
            href="/messages"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-4 py-3 text-base font-semibold text-muted-blue-hover shadow-sm transition active:bg-muted-blue-tint/40"
          >
            Messages
          </Link>
        ) : null}
        <Link
          href="/profile"
          className="flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-200/90 bg-white px-4 py-3 text-left shadow-sm transition active:bg-zinc-50"
        >
          <span className="min-w-0 flex-1 truncate text-base font-semibold text-zinc-900">
            {displayName}
          </span>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${
              isAdmin
                ? "bg-amber-100 text-amber-900 ring-amber-200/80"
                : "bg-muted-blue-tint text-muted-blue-hover ring-muted-blue/25"
            }`}
          >
            {isAdmin ? "Admin" : "Member"}
          </span>
        </Link>
        <SignOutOverlay triggerClassName="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base font-semibold text-zinc-700 shadow-sm transition active:bg-zinc-50" />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 text-sm">
      {messagesUiEnabled ? (
        <Link
          href="/messages"
          className="inline-flex min-h-11 items-center rounded-full px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:py-1"
        >
          Messages
        </Link>
      ) : null}
      <Link
        href="/profile"
        className="flex min-h-11 min-w-0 max-w-[min(100%,14rem)] items-center gap-2 rounded-full px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:max-w-[18rem] sm:gap-4 sm:py-1 md:max-w-none"
      >
        <span className="min-w-0 flex-1 truncate">{displayName}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            isAdmin
              ? "bg-amber-100 text-amber-700"
              : "bg-muted-blue-tint text-muted-blue-hover"
          }`}
        >
          {isAdmin ? "Admin" : "Member"}
        </span>
      </Link>
      <SignOutOverlay triggerClassName="inline-flex min-h-11 items-center rounded-full px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:py-1" />
    </div>
  );
}

