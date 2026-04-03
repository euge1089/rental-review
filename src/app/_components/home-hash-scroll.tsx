"use client";

import { useEffect } from "react";

const HASH = "#how-it-works";

export function HomeHashScroll() {
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== HASH) return;
    const id = HASH.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  return null;
}
