"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function HomeHeroSignIn() {
  const { status } = useSession();

  if (status === "authenticated") {
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

