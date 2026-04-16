import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSessionProvider } from "@/app/_components/app-session-provider";
import { SiteNav } from "@/app/_components/site-nav";
import { SiteFooter } from "@/app/_components/site-footer";

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
              gtag('config', '${gaMeasurementId}', {
                send_page_view: true
                ${gaDebugMode ? ", debug_mode: true" : ""}
              });
            `}
          </Script>
        </>
      ) : null}
      <body className="flex min-h-[100dvh] min-h-screen flex-col bg-[#f5f5f6] text-zinc-900">
        <AppSessionProvider>
          <header className="border-b border-zinc-200/80 bg-white pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_rgb(15_23_42/0.03)]">
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
