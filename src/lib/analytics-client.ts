"use client";

type EventParams = Record<string, string | number | boolean | null | undefined>;

type WindowWithGtag = Window & {
  gtag?: (command: "event", eventName: string, params?: EventParams) => void;
};

export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === "undefined") return;
  const w = window as WindowWithGtag;
  if (typeof w.gtag !== "function") return;
  w.gtag("event", eventName, params);
}

