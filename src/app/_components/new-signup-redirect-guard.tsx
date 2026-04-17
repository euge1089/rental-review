"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export function NewSignupRedirectGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email;
    const justSignedUp = session?.user?.justSignedUp;
    if (!email) return;

    const storageKey = `rr_new_signup_redirect_done:${email.toLowerCase()}`;
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") return;
    } catch {
      // Ignore storage failures and continue with redirect check.
    }

    if (pathname === "/submit" && searchParams?.get("new") === "1") {
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // Ignore storage failures.
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        const data = (await res.json()) as {
          ok?: boolean;
          bostonRentingSinceYear?: number | null;
        };
        if (cancelled) return;
        if (!data.ok || data.bostonRentingSinceYear != null) return;
        try {
          window.sessionStorage.setItem(storageKey, "1");
        } catch {
          // Ignore storage failures.
        }
        if (justSignedUp) {
          router.replace("/submit?new=1");
        } else {
          router.replace("/submit");
        }
      } catch {
        // Ignore profile lookup errors; do not interrupt navigation.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, searchParams, session?.user?.email, session?.user?.justSignedUp, status]);

  return null;
}
