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
    if (!email || !justSignedUp) return;

    const storageKey = `rr_new_signup_redirect_done:${email.toLowerCase()}`;
    if (window.sessionStorage.getItem(storageKey) === "1") return;

    if (pathname === "/submit" && searchParams?.get("new") === "1") {
      window.sessionStorage.setItem(storageKey, "1");
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");
    router.replace("/submit?new=1");
  }, [pathname, router, searchParams, session?.user?.email, session?.user?.justSignedUp, status]);

  return null;
}
