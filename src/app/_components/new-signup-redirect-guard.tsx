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
        if (pathname === "/submit" && searchParams?.get("new") === "1") return;
        if (pathname === "/submit" && !justSignedUp) return;
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
