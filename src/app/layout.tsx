import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSessionProvider } from "@/app/_components/app-session-provider";
import { NavUser } from "@/app/_components/nav-user";
import { SiteFooter } from "@/app/_components/site-footer";
import {
  appContentMaxWidthClass,
  appContentPaddingXClass,
} from "@/lib/ui-classes";

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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {gaMeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');
            `}
          </Script>
        </>
      ) : null}
      <body className="flex min-h-[100dvh] min-h-screen flex-col bg-[#f5f5f6] text-zinc-900">
        <AppSessionProvider>
        <header className="border-b border-zinc-200/80 bg-white pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_rgb(15_23_42/0.03)]">
          <nav
            className={`mx-auto flex w-full min-w-0 ${appContentMaxWidthClass} flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 ${appContentPaddingXClass}`}
          >
            <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
              <Link
                href="/"
                className="inline-flex min-h-11 min-w-0 items-baseline gap-1.5 rounded-md py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-blue-hover"
              >
                <span className="text-base font-semibold tracking-tight text-muted-blue-hover sm:text-lg">
                  Rent Review
                </span>
                <span className="text-base font-bold tracking-tight text-muted-blue sm:text-lg">
                  Boston
                </span>
              </Link>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-2 text-sm sm:justify-end sm:gap-2">
              <Link
                href="/properties"
                className="inline-flex min-h-11 items-center rounded-full px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:py-1"
              >
                Browse
              </Link>
              <Link
                href="/analytics"
                className="inline-flex min-h-11 items-center rounded-full px-3 py-2 font-medium text-muted-blue active:bg-muted-blue-tint/80 hover:bg-muted-blue-tint sm:min-h-0 sm:py-1"
              >
                <span className="sm:hidden">Explorer</span>
                <span className="hidden sm:inline">Rent explorer</span>
              </Link>
              <Link
                href="/submit"
                className="inline-flex min-h-11 items-center rounded-full bg-muted-blue px-3 py-2 font-medium text-white transition active:bg-muted-blue-hover hover:bg-muted-blue-hover sm:min-h-0 sm:py-1"
              >
                Submit
              </Link>
              <NavUser adminEmail={process.env.ADMIN_EMAIL} />
            </div>
          </nav>
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
