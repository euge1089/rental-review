"use client";

type EventParams = Record<string, string | number | boolean | null | undefined>;

type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | undefined {
  if (typeof window === "undefined") return undefined;
  const g = (window as Window & { gtag?: GtagFn }).gtag;
  return typeof g === "function" ? g : undefined;
}

/**
 * Sends a GA4 event. Retries briefly if gtag.js has not finished loading yet.
 */
export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === "undefined") return;

  const send = () => {
    const gtag = getGtag();
    if (!gtag) return false;
    gtag("event", eventName, params);
    return true;
  };

  if (send()) return;

  let attempts = 0;
  const maxAttempts = 40;
  const id = window.setInterval(() => {
    attempts += 1;
    if (send() || attempts >= maxAttempts) {
      window.clearInterval(id);
    }
  }, 50);
}
