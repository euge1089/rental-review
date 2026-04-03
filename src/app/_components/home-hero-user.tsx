"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SessionUser = {
  email?: string | null;
};

export function HomeHeroSignIn() {
  const [user, setUser] = useState<SessionUser | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = (await res.json()) as { user?: SessionUser | null };
        if (!cancelled) {
          setUser(data.user ?? null);
        }
      } catch {
        if (!cancelled) setUser(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (user && user !== "loading") {
    // Signed in: hide the sign-in CTA
    return null;
  }

  return (
    <Link
      href="/signin"
      className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700"
    >
      Sign in to unlock full reviews
    </Link>
  );
}

