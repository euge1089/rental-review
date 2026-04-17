"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { linkInlineClass } from "@/lib/ui-classes";

const CONSENT_KEY = "rr_cookie_preferences_v1";

type CookiePreferences = {
  analytics: boolean | null;
};

function readPreferences(): CookiePreferences {
  if (typeof window === "undefined") {
    return { analytics: null };
  }
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return { analytics: null };
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (typeof parsed.analytics !== "boolean") return { analytics: null };
    return parsed;
  } catch {
    return { analytics: null };
  }
}

function writePreferences(next: CookiePreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("rr-cookie-preferences-updated"));
}

export function CookieConsentManager({
  gaMeasurementId,
  gaDebugMode,
}: {
  gaMeasurementId?: string;
  gaDebugMode?: boolean;
}) {
  const [prefs, setPrefs] = useState<CookiePreferences>(() => readPreferences());
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    function openManage() {
      setShowManage(true);
    }
    function refresh() {
      setPrefs(readPreferences());
    }
    window.addEventListener("rr-open-cookie-preferences", openManage);
    window.addEventListener("rr-cookie-preferences-updated", refresh);
    return () => {
      window.removeEventListener("rr-open-cookie-preferences", openManage);
      window.removeEventListener("rr-cookie-preferences-updated", refresh);
    };
  }, []);

  const canLoadAnalytics = useMemo(
    () => Boolean(gaMeasurementId && prefs.analytics === true),
    [gaMeasurementId, prefs.analytics],
  );

  const showBanner = prefs.analytics === null;

  function acceptAll() {
    const next = { analytics: true as const };
    setPrefs(next);
    writePreferences(next);
    setShowManage(false);
  }

  function rejectNonEssential() {
    const next = { analytics: false as const };
    setPrefs(next);
    writePreferences(next);
    setShowManage(false);
  }

  return (
    <>
      {canLoadAnalytics ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', {
                send_page_view: true
                ${gaDebugMode ? ", debug_mode: true" : ""}
              });
            `}
          </Script>
        </>
      ) : null}

      {showBanner ? (
        <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-zinc-200/90 bg-white/98 p-4 shadow-[0_-8px_24px_-12px_rgb(15_23_42/0.25)] backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted-blue-hover">
                Cookie preferences
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 sm:text-sm">
                We use essential cookies for sign-in and security. With your
                permission, we also use analytics cookies to measure product
                usage. See our{" "}
                <Link href="/legal/privacy#cookie-preferences" className={linkInlineClass}>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={rejectNonEssential}
                className="inline-flex min-h-10 items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 sm:text-sm"
              >
                Reject optional
              </button>
              <button
                type="button"
                onClick={() => setShowManage(true)}
                className="inline-flex min-h-10 items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/30 sm:text-sm"
              >
                Manage
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex min-h-10 items-center rounded-full bg-muted-blue px-4 py-2 text-xs font-semibold text-white transition hover:bg-muted-blue-hover sm:text-sm"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showManage ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-900/40 p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close cookie preferences"
            onClick={() => setShowManage(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cookie preferences"
            className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_20px_50px_-12px_rgb(15_23_42/0.3)] sm:p-6"
          >
            <h2 className="text-lg font-semibold text-muted-blue-hover">
              Manage cookie preferences
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Essential cookies are always on. You can choose whether to allow
              analytics cookies.
            </p>

            <div className="mt-4 rounded-xl border border-zinc-200/90 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-800">Analytics cookies</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                Help us understand site usage and improve features.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = { analytics: true as const };
                    setPrefs(next);
                    writePreferences(next);
                  }}
                  className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                    prefs.analytics === true
                      ? "bg-muted-blue text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Allow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = { analytics: false as const };
                    setPrefs(next);
                    writePreferences(next);
                  }}
                  className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                    prefs.analytics === false
                      ? "bg-zinc-800 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Disallow
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManage(false)}
                className="inline-flex min-h-10 items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 sm:text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
