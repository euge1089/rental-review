"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function NewSignupRedirectGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

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
        const onSubmitNew =
          pathname === "/submit" &&
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("new") === "1";
        if (onSubmitNew) return;
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
  }, [pathname, router, session?.user?.email, session?.user?.justSignedUp, status]);

  return null;
}
