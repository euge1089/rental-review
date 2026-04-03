"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignOutOverlay } from "@/app/_components/sign-out-overlay";

type Props = {
  adminEmail?: string;
};

type SessionUser = {
  name?: string | null;
  email?: string | null;
};

export function NavUser({ adminEmail }: Props) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const data = (await res.json()) as { user?: SessionUser | null };
        if (!cancelled) {
          setUser(data.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const email = user?.email ?? null;
  const displayName = user?.name ?? email ?? null;
  const isAdmin =
    !!adminEmail &&
    !!email &&
    adminEmail.toLowerCase() === email.toLowerCase();

  if (!user) {
    return (
      <Link
        href="/signin"
        className="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:py-1"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 text-sm">
      <Link
        href="/profile"
        className="flex min-h-11 min-w-0 max-w-[min(100%,14rem)] items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:max-w-[18rem] sm:gap-4 sm:py-1 md:max-w-none"
      >
        <span className="min-w-0 flex-1 truncate">{displayName}</span>
        {isAdmin && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
            Admin
          </span>
        )}
      </Link>
      <SignOutOverlay triggerClassName="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-xs font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:py-1" />
    </div>
  );
}

