import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSessionProvider } from "@/app/_components/app-session-provider";
import { NewSignupRedirectGuard } from "@/app/_components/new-signup-redirect-guard";
import { SiteNav } from "@/app/_components/site-nav";
import { SiteFooter } from "@/app/_components/site-footer";
import { CookieConsentManager } from "@/app/_components/cookie-consent-manager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const metadataBase =
  process.env.NEXTAUTH_URL != null && process.env.NEXTAUTH_URL.length > 0
    ? new URL(process.env.NEXTAUTH_URL)
    : undefined;

export const metadata: Metadata = {
  metadataBase,
  title: "Rent Review Boston",
  description:
    "Address-level rental reviews for Boston with teaser-only public access.",
  openGraph: {
    title: "Rent Review Boston",
    description:
      "Address-level rental reviews for Boston with teaser-only public access.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rent Review Boston",
    description:
      "Address-level rental reviews for Boston with teaser-only public access.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  /** When true, GA4 sends debug hits so they appear in Admin → DebugView (not just Realtime). */
  const gaDebugMode =
    process.env.NEXT_PUBLIC_GA_DEBUG === "1" ||
    process.env.NEXT_PUBLIC_GA_DEBUG === "true";
  const cookieConsentEnabled =
    process.env.NEXT_PUBLIC_ENABLE_COOKIE_CONSENT === "1" ||
    process.env.NEXT_PUBLIC_ENABLE_COOKIE_CONSENT === "true";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-[100dvh] min-h-screen flex-col bg-[#f5f5f6] text-zinc-900">
        <AppSessionProvider>
          {cookieConsentEnabled ? (
            <CookieConsentManager
              gaMeasurementId={gaMeasurementId}
              gaDebugMode={gaDebugMode}
            />
          ) : null}
          <NewSignupRedirectGuard />
          <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_rgb(15_23_42/0.03)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
            <SiteNav adminEmail={process.env.ADMIN_EMAIL} />
          </header>
          <div className="flex min-h-0 flex-1 flex-col bg-[#f5f5f6]">
            {children}
          </div>
          <SiteFooter />
        </AppSessionProvider>
      </body>
    </html>
  );
}
