import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Caveat } from "next/font/google";
import type { getHomePageData } from "@/lib/home-page-data";

const caveatHint = Caveat({
  subsets: ["latin"],
  weight: ["600"],
});
import { HeroSignUpOverlay } from "@/app/_components/hero-sign-up-overlay";
import { HomeKeywordStrip } from "@/app/_components/home-keyword-strip";
import { HomeSearch } from "@/app/_components/home-search";

function SectionMaxW({
  fw,
  children,
  className,
}: {
  fw: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (fw) {
    return (
      <div
        className={`mx-auto w-full max-w-[min(88rem,calc(100%-1rem))] px-4 sm:max-w-[min(88rem,calc(100%-2rem))] sm:px-8 sm:px-12 xl:px-20 ${className ?? ""}`}
      >
        {children}
      </div>
    );
  }
  return <>{children}</>;
}

function formatBedBathFromReviews(
  reviews: {
    bedroomCount: number | null;
    bathrooms: number | null;
  }[],
): string | null {
  const r = reviews.find(
    (x) => x.bedroomCount != null || x.bathrooms != null,
  );
  if (!r) return null;
  const parts: string[] = [];
  if (r.bedroomCount != null) {
    const n = r.bedroomCount;
    if (n === 0) parts.push("Studio");
    else if (n >= 5) parts.push("5+ beds");
    else parts.push(`${n} bed${n === 1 ? "" : "s"}`);
  }
  if (r.bathrooms != null) {
    const b = r.bathrooms;
    const label = b === 1 ? "bath" : "baths";
    parts.push(
      Number.isInteger(b) ? `${b} ${label}` : `${b.toFixed(1)} ${label}`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function HomeDivider({ fw }: { fw: boolean }) {
  if (fw) {
    return (
      <div
        className="w-full px-8 py-7 sm:px-12 sm:py-8 xl:px-20"
        aria-hidden
      >
        <div className="mx-auto flex max-w-[min(88rem,calc(100%-2rem))] items-center gap-5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300/70 to-zinc-200/40" />
          <div
            className="h-1 w-1 shrink-0 rounded-full bg-pop/45 shadow-[0_0_0_6px_rgb(219_120_55/0.08)]"
            aria-hidden
          />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-zinc-300/70 to-zinc-200/40" />
        </div>
      </div>
    );
  }
  return (
    <div
      className="mx-auto my-16 h-px max-w-md bg-gradient-to-r from-transparent via-zinc-300/80 to-transparent sm:max-w-lg"
      aria-hidden
    />
  );
}

export type HomePageLayout = "contained" | "fullwidth";

type HomePageData = Awaited<ReturnType<typeof getHomePageData>>;

type Props = {
  layout: HomePageLayout;
  /** When false, hero “Sign up” CTA is hidden (e.g. signed-in users). */
  showHeroSignUp?: boolean;
} & HomePageData;

export function HomePageSections({
  layout,
  showHeroSignUp = true,
  southBostonTop,
  approvedReviewCount,
  bostonPropertyCount,
}: Props) {
  const fw = layout === "fullwidth";

  const statReviews =
    approvedReviewCount >= 10
      ? `${Math.floor(approvedReviewCount / 10) * 10}+`
      : String(approvedReviewCount);

  const statItems: {
    value: string;
    label: string;
    accent?: boolean;
  }[] = [
    { value: statReviews, label: "Renter reviews live" },
    {
      value: bostonPropertyCount > 0 ? String(bostonPropertyCount) : "—",
      label: "Boston addresses on the map",
    },
    { value: "100%", label: "Renter-written, not broker copy" },
    { value: "$0", label: "To browse & read (sign in free)", accent: true },
  ];

  const heroSectionClass = fw
    ? "relative w-full overflow-hidden border-b border-zinc-100 bg-gradient-to-br from-white via-[#fafbfc] to-muted-blue-tint/35 shadow-elevated"
    : "relative overflow-hidden rounded-3xl bg-white px-6 py-12 shadow-elevated sm:px-10 sm:py-14 lg:px-12 lg:py-16";
  const heroInnerClass = fw
    ? "relative mx-auto w-full max-w-[min(88rem,calc(100%-1rem))] px-4 py-10 sm:max-w-[min(88rem,calc(100%-2rem))] sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-20 xl:py-20"
    : "relative";

  return (
    <div
      className={
        fw
          ? "bg-[#f5f5f6] font-sans text-zinc-900"
          : "bg-[#f5f5f6] font-sans text-zinc-900"
      }
    >
      <main
        className={
          fw
            ? "flex w-full flex-col pb-0 pt-0"
            : "mx-auto flex w-full min-w-0 max-w-6xl flex-col px-4 pb-0 pt-8 sm:px-8 sm:pt-14"
        }
      >
        {/* Hero — elevated panel + soft depth (Elise-style clean slab) */}
        <section className={heroSectionClass}>
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-muted-blue-tint/70 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-zinc-100/90 blur-3xl"
            aria-hidden
          />
          {fw ? (
            <div
              className="pointer-events-none absolute right-0 top-1/2 h-[min(70vw,28rem)] w-[min(70vw,28rem)] -translate-y-1/2 translate-x-1/4 rounded-full bg-pop-tint/50 blur-3xl"
              aria-hidden
            />
          ) : null}
          <div className={heroInnerClass}>
            <div
              className={
                fw
                  ? "relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 xl:gap-20"
                  : "relative grid items-stretch gap-9 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:gap-9 lg:gap-x-14"
              }
            >
              <div
                className={
                  fw
                    ? "min-w-0 max-w-2xl text-center lg:max-w-none lg:text-left"
                    : "min-w-0 text-center sm:text-left lg:pr-2"
                }
              >
                <p
                  className={
                    fw
                      ? "inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/90 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-blue shadow-sm"
                      : "text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-blue sm:text-[10px]"
                  }
                >
                  {fw ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-pop shadow-[0_0_0_3px_rgb(253_246_240/0.9)]"
                      aria-hidden
                    />
                  ) : null}
                  Boston renters · South Boston first
                </p>
                <h1
                  className={
                    fw
                      ? "mt-6 text-[clamp(1.8rem,4.5vw,3.15rem)] font-semibold leading-[1.08] tracking-tight text-muted-blue-hover"
                      : "mt-4 text-[clamp(0.9rem,3.2vw,2.6rem)] font-semibold leading-[1.12] tracking-tight text-muted-blue-hover sm:mt-5"
                  }
                >
                  <span className="block">Built by Boston renters</span>
                  <span
                    className={
                      fw
                        ? "mt-1.5 block text-muted-blue lg:whitespace-nowrap"
                        : "mt-1 block text-pretty text-muted-blue sm:mt-1.5 sm:whitespace-nowrap"
                    }
                  >
                    Not for landlords or listing sites.
                  </span>
                </h1>
                <p
                  className={
                    fw
                      ? "mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 lg:mx-0 lg:mt-8 lg:max-w-lg lg:text-[1.015rem]"
                      : "mx-auto mt-4 max-w-2xl text-pretty text-[0.875rem] leading-relaxed text-zinc-600 sm:mx-0 sm:mt-5 sm:text-[0.975rem] sm:leading-relaxed"
                  }
                >
                  What prior tenants wish you knew — historical rent increases,
                  transparent reviews, <strong>fully anonymous</strong>.
                </p>

                <div
                  className={
                    fw
                      ? "mx-auto mt-8 flex max-w-2xl justify-center lg:mx-0 lg:mt-10 lg:max-w-none lg:justify-start"
                      : "mx-auto mt-7 max-w-2xl sm:mx-0 sm:mt-8"
                  }
                >
                  <HomeSearch variant={fw ? "heroWide" : "hero"} />
                </div>

                <div
                  className={
                    fw
                      ? "mt-8 flex flex-col items-center gap-3 lg:mt-10 lg:flex-row lg:items-center lg:gap-5"
                      : "mt-7 flex flex-col items-center gap-2.5 sm:mt-8 sm:flex-row sm:items-center sm:gap-3.5"
                  }
                >
                  {showHeroSignUp ? (
                    <HeroSignUpOverlay variant={fw ? "wide" : "narrow"} />
                  ) : null}
                  <p
                    className={
                      fw
                        ? `max-w-xs text-center text-[13px] leading-relaxed text-zinc-500 lg:max-w-sm ${showHeroSignUp ? "lg:text-left" : "lg:text-center"}`
                        : `max-w-sm text-center text-[10px] leading-relaxed text-zinc-500 sm:text-[11px] ${showHeroSignUp ? "sm:text-left" : "sm:text-center"}`
                    }
                  >
                    Your review is 100% anonymous in public. We never show your name, and
                    your account details stay private.
                  </p>
                </div>
              </div>

              <div
                className={
                  fw
                    ? "hidden animate-hero-drift relative mx-auto w-full max-w-[224px] flex-col justify-center lg:flex lg:mx-0 lg:max-w-[min(100%,304px)] lg:justify-self-end"
                    : "hidden animate-hero-drift w-full max-w-[184px] shrink-0 flex-col justify-center justify-self-center pl-2 sm:max-w-[202px] lg:flex lg:mx-0 lg:max-w-[min(100%,184px)] lg:justify-self-end lg:pl-6"
                }
                aria-hidden
              >
                <div
                  className={
                    fw
                      ? "relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-zinc-100/90 bg-white shadow-elevated ring-1 ring-zinc-900/[0.03]"
                      : "relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-zinc-100/80 bg-white shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] ring-1 ring-zinc-900/[0.04]"
                  }
                >
                  <Image
                    src="/design/hero-city-map.png"
                    alt="Stylized city map"
                    fill
                    sizes={
                      fw
                        ? "(max-width: 1024px) 224px, 304px"
                        : "(max-width: 640px) 184px, 202px"
                    }
                    className="object-cover object-[70%_center] [filter:brightness(1.08)_saturate(1.02)_contrast(1.02)]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats — dark band for page rhythm */}
        {fw ? (
          <section className="w-full overflow-hidden border-b border-white/10 bg-muted-blue-hover pt-12 pb-14 shadow-elevated lg:pt-14 lg:pb-16">
            <div className="mx-auto w-full max-w-[min(88rem,calc(100%-2rem))] px-8 sm:px-12 xl:px-20">
              <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-white lg:text-left">
                At a glance
              </p>
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-y-0">
                {statItems.map((item, i) => (
                  <div
                    key={item.label}
                    className={`text-center md:text-left ${i > 0 ? "md:border-l md:border-white/15 md:pl-8 lg:pl-10" : ""}`}
                  >
                    <p
                      className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-none ${item.accent ? "text-pop" : "text-white"}`}
                    >
                      {item.value}
                    </p>
                    <p className="mt-2 text-[13px] font-medium uppercase leading-snug tracking-wide text-white/85 sm:text-sm">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-muted-blue-hover px-6 pt-11 pb-12 shadow-elevated sm:px-10 sm:pt-12 sm:pb-14">
            <div>
              <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-white sm:text-left">
                At a glance
              </p>
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-y-0">
                {statItems.map((item, i) => (
                  <div
                    key={item.label}
                    className={`text-center md:text-left ${i > 0 ? "md:border-l md:border-white/15 md:pl-8" : ""}`}
                  >
                    <p
                      className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${item.accent ? "text-pop" : "text-white"}`}
                    >
                      {item.value}
                    </p>
                    <p className="mt-2 text-[13px] font-medium uppercase leading-snug tracking-wide text-white/85 sm:text-sm">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <HomeDivider fw={fw} />

        {/* Feature trio — top-accent cards, borderless elevation */}
        <section
          className={
            fw
              ? "w-full overflow-x-visible border-b border-zinc-100 bg-[#f5f5f6] py-16 lg:py-20"
              : "overflow-x-visible"
          }
        >
          <SectionMaxW fw={fw}>
            <div
              className={
                fw
                  ? "mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-4xl lg:text-left"
                  : ""
              }
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Why renters come here
              </p>
              <h2
                className={
                  fw
                    ? "mt-4 text-balance text-3xl font-semibold tracking-tight text-muted-blue-hover sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]"
                    : "mt-3 text-balance text-3xl font-semibold tracking-tight text-muted-blue-hover sm:text-4xl"
                }
              >
                Renter-led, not landlord-led.
              </h2>
              <p
                className={
                  fw
                    ? "mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 lg:mx-0 lg:text-lg"
                    : "mt-3 max-w-2xl text-base leading-relaxed text-zinc-600"
                }
              >
                Three things listing sites won&apos;t give you — because they&apos;re not
                on your side of the lease.
              </p>
            </div>
            <div
              className={
                fw
                  ? "relative mt-12 lg:mt-14"
                  : "relative mt-11 lg:mt-12"
              }
            >
              <div
                className="pointer-events-none absolute top-[1.625rem] z-10 hidden w-[10.5rem] motion-safe:animate-pulse motion-safe:duration-[2800ms] lg:left-[-1.75rem] lg:block lg:w-[11rem] xl:left-[-5.25rem] xl:top-[2.125rem] xl:w-[12rem] 2xl:left-[-6.5rem]"
                aria-hidden
              >
                <p
                  className={`${caveatHint.className} max-w-[9.5rem] -rotate-[19deg] text-[1.5rem] leading-[1.15] text-muted-blue-hover xl:text-[1.65rem]`}
                >
                  Hover to see more
                </p>
                <svg
                  viewBox="0 0 168 76"
                  className="ml-1 mt-1 h-[4.25rem] w-[10.25rem] -rotate-[8deg] text-pop opacity-[0.92] xl:ml-2 xl:mt-2 xl:h-[4.75rem] xl:w-[11.25rem]"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M 6 58 C 24 20 48 8 82 12 C 112 15 138 28 152 24"
                    stroke="currentColor"
                    strokeWidth="2.35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 138 14 L 152 24 L 142 34"
                    stroke="currentColor"
                    strokeWidth="2.35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div
                className={
                  fw
                    ? "grid gap-6 lg:grid-cols-3 lg:gap-6 lg:pl-[min(8rem,13vw)] xl:pl-[min(9rem,11vw)]"
                    : "grid gap-6 md:grid-cols-3 lg:pl-[min(7rem,15vw)] xl:pl-[min(8rem,12vw)]"
                }
              >
              {[
                {
                  eyebrow: "Real rent",
                  lead: "See what people",
                  leadAccent: "actually paid",
                  rest: "See historical rent ranges to spot unusual increases and walk into lease talks with leverage.",
                },
                {
                  eyebrow: "Real life",
                  lead: "Catch the red flags",
                  leadAccent: "before you tour",
                  rest: "Heat, noise, pests, deposits — the stuff you usually learn after you've already moved in.",
                },
                {
                  eyebrow: "Real privacy",
                  lead: "Your landlord",
                  leadAccent: "never sees this",
                  rest: "Your public review is anonymous. Your name and account details are never shown on review cards.",
                },
              ].map((item, index) => (
                <article
                  key={item.eyebrow}
                  tabIndex={0}
                  className={
                    fw
                      ? "group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white px-8 py-9 shadow-elevated transition duration-300 hover:-translate-y-0.5 hover:shadow-elevated-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-blue/25 lg:px-10 lg:py-10"
                      : "group flex flex-col overflow-hidden rounded-2xl border border-zinc-100/80 bg-white px-8 py-9 shadow-elevated transition duration-300 hover:shadow-elevated-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-blue/25 sm:px-9 sm:py-10"
                  }
                >
                  <div className="relative flex items-center gap-3">
                    <span
                      className={
                        fw
                          ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-sm font-semibold tabular-nums text-zinc-500"
                          : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold tabular-nums text-zinc-500"
                      }
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      {item.eyebrow}
                    </p>
                  </div>
                  <h3
                    className={
                      fw
                        ? "relative mt-6 text-pretty text-[1.1875rem] font-semibold leading-snug tracking-tight text-muted-blue-hover lg:text-[1.425rem]"
                        : "mt-5 text-pretty text-[1.28rem] font-semibold leading-snug tracking-tight text-muted-blue-hover sm:text-[1.425rem]"
                    }
                  >
                    {item.lead}{" "}
                    <span className={fw ? "text-pop" : "text-muted-blue"}>
                      {item.leadAccent}
                    </span>
                  </h3>
                  <p
                    className={
                      fw
                        ? "relative mt-0 max-h-0 overflow-hidden text-[0.89rem] leading-relaxed text-zinc-600 opacity-0 transition-[max-height,opacity,margin] duration-300 ease-out group-hover:mt-4 group-hover:max-h-64 group-hover:opacity-100 group-focus-within:mt-4 group-focus-within:max-h-64 group-focus-within:opacity-100 [@media(hover:none)]:mt-4 [@media(hover:none)]:max-h-none [@media(hover:none)]:opacity-100"
                        : "mt-0 max-h-0 overflow-hidden text-[0.89rem] leading-relaxed text-zinc-600 opacity-0 transition-[max-height,opacity,margin] duration-300 ease-out group-hover:mt-4 group-hover:max-h-64 group-hover:opacity-100 group-focus-within:mt-4 group-focus-within:max-h-64 group-focus-within:opacity-100 [@media(hover:none)]:mt-4 [@media(hover:none)]:max-h-none [@media(hover:none)]:opacity-100"
                    }
                  >
                    {item.rest}
                  </p>
                </article>
              ))}
              </div>
            </div>
          </SectionMaxW>
        </section>

        <HomeDivider fw={fw} />

        {/* How it works — solid neutral blue-gray (no gradient) */}
        <section
          id="how-it-works"
          className={
            fw
              ? "scroll-mt-24 w-full border-y border-muted-blue/25 bg-[#e4e9ef] py-16 lg:py-20"
              : "scroll-mt-24 mt-16 rounded-3xl border border-muted-blue/25 bg-[#e4e9ef] px-6 py-10 sm:px-10 sm:py-12"
          }
        >
          <SectionMaxW fw={fw}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue-hover">
              Simple path
            </p>
            <h2
              className={
                fw
                  ? "mt-3 text-3xl font-semibold tracking-tight text-muted-blue-hover sm:text-4xl"
                  : "mt-3 text-3xl font-semibold tracking-tight text-muted-blue-hover sm:text-4xl"
              }
            >
              How it works
            </h2>
            <p
              className={
                fw
                  ? "mt-3 max-w-2xl text-base leading-relaxed text-zinc-700 lg:text-lg"
                  : "mt-2 max-w-2xl text-base leading-relaxed text-zinc-700"
              }
            >
              From search to signing — with better information at every step.
            </p>
            <div
              className={
                fw
                  ? "mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
                  : "mt-9 grid gap-6 md:grid-cols-2"
              }
            >
              {[
                {
                  n: "1",
                  title: "Sign in to unlock detail",
                  body: "Exact rent, scores, amenities, and full review text — no paywall, just Google.",
                  foot: "Takes under a minute",
                },
                {
                  n: "2",
                  title: "Search an address or ZIP",
                  body: "Find out if other renters have already written about the place you're considering.",
                  foot: "Start from the search above",
                },
                {
                  n: "3",
                  title: "Use Rent Explorer",
                  body: "Search Boston by ZIP, bedroom count, and budget. Compare historical rents from real renters so you can spot unusually steep increases.",
                  foot: (
                    <Link
                      href="/analytics"
                      className="text-sm font-semibold text-muted-blue-hover hover:text-pop hover:underline"
                    >
                      Open Rent Explorer →
                    </Link>
                  ),
                },
                {
                  n: "4",
                  title: "Share your experience",
                  body: "Add your review and help the next person dodge a bad lease — or find a great one.",
                  foot: (
                    <Link
                      href="/submit"
                      className="text-sm font-semibold text-muted-blue-hover hover:text-pop hover:underline"
                    >
                      Share your experience →
                    </Link>
                  ),
                },
              ].map((step) => {
                const badgePop =
                  step.n === "1"
                    ? "bg-gradient-to-br from-pop to-pop-hover text-white shadow-md shadow-pop/30"
                    : "bg-muted-blue text-white shadow-sm shadow-black/10";
                return (
                  <div
                    key={step.n}
                    className={
                      fw
                        ? "relative flex flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 text-center shadow-[0_14px_40px_-12px_rgb(15_23_42/0.12)] ring-1 ring-muted-blue/15 transition hover:-translate-y-0.5 hover:shadow-elevated-hover lg:p-7 lg:text-left"
                        : "flex gap-5 rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_14px_40px_-12px_rgb(15_23_42/0.12)] ring-1 ring-muted-blue/15 transition duration-300 hover:shadow-elevated-hover"
                    }
                  >
                    {fw ? (
                      <div
                        className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold lg:mx-0 ${badgePop}`}
                      >
                        {step.n}
                      </div>
                    ) : (
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${badgePop}`}
                      >
                        {step.n}
                      </div>
                    )}
                    <div className={fw ? "mt-5 flex flex-1 flex-col" : "min-w-0 flex-1"}>
                      <h3
                        className={
                          fw
                            ? "text-lg font-semibold leading-snug text-muted-blue-hover"
                            : "text-lg font-semibold text-muted-blue-hover"
                        }
                      >
                        {step.title}
                      </h3>
                      <p
                        className={
                          fw
                            ? "mt-3 flex-1 text-sm leading-relaxed text-zinc-700"
                            : "mt-2 text-sm leading-relaxed text-zinc-700"
                        }
                      >
                        {step.body}
                      </p>
                      <div
                        className={
                          fw
                            ? "mt-4 text-xs font-medium text-zinc-600 [&_a]:font-semibold [&_a]:text-muted-blue-hover [&_a]:no-underline hover:[&_a]:text-pop hover:[&_a]:underline"
                            : "mt-4 text-xs font-medium text-zinc-600 [&_a]:text-muted-blue-hover [&_a]:no-underline hover:[&_a]:text-pop hover:[&_a]:underline"
                        }
                      >
                        {step.foot}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionMaxW>
        </section>

        {/* Signed-in unlock preview */}
        <section
          className={
            fw
              ? "w-full border-b border-zinc-100 bg-white py-14 lg:py-16"
              : "mt-16 rounded-3xl bg-white p-8 shadow-elevated sm:p-10"
          }
        >
          <SectionMaxW fw={fw}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p
                  className={
                    fw
                      ? "max-w-xl text-2xl font-semibold leading-snug tracking-tight text-muted-blue-hover sm:text-3xl"
                      : "text-lg font-semibold text-muted-blue-hover"
                  }
                >
                  Unlock full reviews, real rent numbers, and the Boston Rent Explorer.
                </p>
              </div>
              <Link
                href="/analytics"
                className={
                  fw
                    ? "rounded-full border border-pop/30 bg-pop-tint/50 px-5 py-2.5 text-sm font-semibold text-pop shadow-sm transition hover:border-pop/50 hover:bg-pop-tint"
                    : "text-sm font-semibold text-muted-blue hover:underline"
                }
              >
                See Rent Explorer →
              </Link>
            </div>
            <div
              className={
                fw
                  ? "mt-10 grid gap-6 md:grid-cols-2 lg:gap-8"
                  : "mt-7 grid gap-5 md:grid-cols-2"
              }
            >
              <div
                className={
                  fw
                    ? "rounded-3xl border border-zinc-100 bg-white p-8 shadow-elevated"
                    : "rounded-2xl bg-zinc-50/90 p-6 shadow-[inset_0_0_0_1px_rgb(15_23_42/0.06)]"
                }
              >
                <p className="text-xs font-semibold text-zinc-500">Preview</p>
                <p
                  className={
                    fw
                      ? "mt-3 text-lg font-semibold text-muted-blue-hover"
                      : "mt-2 text-sm font-semibold text-muted-blue-hover"
                  }
                >
                  160 K Street, South Boston
                </p>
                <p className="text-xs text-zinc-500">3 reviews · details hidden</p>
                <div className="mt-4 h-2 w-24 rounded-full bg-zinc-200" />
                <p className="mt-4 text-sm text-zinc-500">
                  Sign in to see real numbers and full stories.
                </p>
              </div>
              <div
                className={
                  fw
                    ? "rounded-3xl border border-r border-t border-b border-zinc-100 border-l-[3px] border-l-pop bg-gradient-to-br from-muted-blue-tint/60 to-white p-8 shadow-elevated"
                    : "rounded-2xl bg-muted-blue-tint/90 p-6 shadow-[inset_0_0_0_1px_rgb(92_107_127/0.15)]"
                }
              >
                <p className="text-xs font-semibold text-muted-blue">Signed in</p>
                <p
                  className={
                    fw
                      ? "mt-3 text-lg font-semibold text-muted-blue-hover"
                      : "mt-2 text-sm font-semibold text-muted-blue-hover"
                  }
                >
                  ~$3,900/mo · 2 beds
                </p>
                <p
                  className={
                    fw
                      ? "mt-2 text-sm text-zinc-600"
                      : "mt-2 text-xs text-zinc-600"
                  }
                >
                  Amenities from reviews: in-unit laundry, parking, pets, heat and AC,
                  outdoor space, and more—whatever past renters checked off.
                </p>
                <p
                  className={
                    fw
                      ? "mt-3 text-sm leading-relaxed text-zinc-700"
                      : "mt-2 text-xs text-zinc-700"
                  }
                >
                  “Quiet unit, solid heat, landlord actually fixes things…”
                </p>
                <p className="mt-3 text-xs leading-relaxed text-zinc-600">
                  Published privacy: every review shows as{" "}
                  <span className="font-semibold text-zinc-700">Anonymous renter</span>,
                  and exact lease years are displayed as broad time buckets.
                </p>
              </div>
            </div>
          </SectionMaxW>
        </section>

        {/* South Boston proof — dark band (matches At a glance rhythm) */}
        {southBostonTop.length > 0 ? (
          <section
            className={
              fw
                ? "w-full overflow-hidden border-b border-white/10 bg-muted-blue-hover py-14 shadow-elevated lg:py-16"
                : "mt-16 overflow-hidden rounded-3xl border border-white/10 bg-muted-blue-hover px-6 py-10 shadow-elevated sm:px-10 sm:py-12"
            }
          >
            <SectionMaxW fw={fw}>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/80 sm:text-left">
                    Neighborhood spotlight
                  </p>
                  <h2
                    className={
                      fw
                        ? "mt-3 text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-left"
                        : "mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl"
                    }
                  >
                    Live in South Boston right now
                  </h2>
                  <p
                    className={
                      fw
                        ? "mt-3 max-w-xl text-center text-base leading-relaxed text-white/85 sm:text-left lg:text-lg"
                        : "mt-2 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base"
                    }
                  >
                    Real addresses renters have already reviewed. Browse without signing
                    in.
                  </p>
                </div>
                <Link
                  href="/properties"
                  className={
                    fw
                      ? "mx-auto w-full max-w-xs rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:border-white/55 hover:bg-white/20 sm:mx-0 sm:w-auto sm:max-w-none"
                      : "w-full rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:border-white/55 hover:bg-white/20 sm:w-auto"
                  }
                >
                  Browse apartments without signing in →
                </Link>
              </div>
              <div
                className={
                  fw
                    ? "mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-5"
                    : "mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
                }
              >
                {southBostonTop.map((property) => {
                  const rents = property.reviews
                    .map((r) => r.monthlyRent)
                    .filter((r): r is number => r != null)
                    .sort((a, b) => a - b);
                  const median =
                    rents.length > 0 ? rents[Math.floor(rents.length / 2)] : null;
                  const bedBath = formatBedBathFromReviews(property.reviews);

                  return (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                      className={
                        fw
                          ? "group relative flex h-full min-h-[9.775rem] flex-col overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_6px_20px_-6px_rgb(15_23_42/0.08)] backdrop-blur-[2px] transition duration-300 hover:border-white/45 hover:bg-white hover:shadow-[0_8px_28px_-10px_rgb(15_23_42/0.12)]"
                          : "group relative flex h-full min-h-[9.775rem] flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/95 p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_6px_20px_-6px_rgb(15_23_42/0.07)] transition duration-300 hover:border-zinc-300/80 hover:shadow-[0_8px_24px_-10px_rgb(15_23_42/0.1)]"
                      }
                    >
                      <div
                        className={
                          fw
                            ? "flex min-h-0 flex-1 flex-col px-5 pb-4 pt-4"
                            : "flex min-h-0 flex-1 flex-col"
                        }
                      >
                        <span
                          className={
                            fw
                              ? "absolute right-3.5 top-3.5 rounded-full bg-zinc-100/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
                              : "absolute right-3 top-3 rounded-full bg-zinc-100/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
                          }
                        >
                          {property._count.reviews}{" "}
                          {property._count.reviews === 1 ? "review" : "reviews"}
                        </span>
                        <p
                          className={
                            fw
                              ? "pr-14 text-[0.9375rem] font-medium leading-snug text-muted-blue-hover line-clamp-2"
                              : "pr-14 text-sm font-medium leading-snug text-muted-blue-hover line-clamp-2"
                          }
                        >
                          {property.addressLine1}
                        </p>
                        <p className="mt-1.5 text-xs text-zinc-500">
                          {property.city}, {property.state} {property.postalCode ?? ""}
                        </p>
                        {bedBath ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {bedBath}
                          </p>
                        ) : null}
                        <p
                          className={
                            fw
                              ? "mt-auto pt-4 text-xs font-medium text-pop/90"
                              : "mt-auto pt-3 text-xs font-medium text-muted-blue/90"
                          }
                        >
                          {median
                            ? "Sign in to see typical rent here."
                            : "Sign in to see rent details."}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </SectionMaxW>
          </section>
        ) : null}

        <HomeKeywordStrip fw={fw} />

        {/* Closing CTA — dark slab + subtle highlight */}
        <section
          className={
            fw
              ? "relative mt-0 w-full overflow-hidden border-t border-zinc-600/25 bg-gradient-to-br from-zinc-800 via-zinc-800 to-zinc-900 py-16 text-center shadow-elevated sm:py-20 sm:text-left"
              : "relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#2d333d] px-8 py-12 text-center shadow-[0_24px_56px_-12px_rgba(15,23,42,0.35)] sm:px-12 sm:text-left"
          }
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_90%_0%,rgb(92_107_127/0.22),transparent_50%)]"
            aria-hidden
          />
          {fw ? (
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_12%_100%,rgb(219_120_55/0.09),transparent_52%)]"
              aria-hidden
            />
          ) : null}
          <SectionMaxW fw={fw} className="relative z-10 py-0">
            <div className="relative flex flex-col items-center justify-between gap-10 sm:flex-row sm:items-center lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Community-powered
                </p>
                <h2
                  className={
                    fw
                      ? "mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
                      : "mt-3 text-2xl font-semibold text-white sm:text-3xl"
                  }
                >
                  A better way to rent in Boston.
                </h2>
                <p
                  className={
                    fw
                      ? "mt-4 max-w-lg text-base leading-relaxed text-zinc-400"
                      : "mt-2 max-w-xl text-sm leading-relaxed text-zinc-400"
                  }
                >
                  Share what you paid and how it went — your review shifts the picture for
                  everyone who comes after you.
                </p>
              </div>
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/submit"
                  className={
                    fw
                      ? "inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-base font-semibold text-muted-blue-hover shadow-lg shadow-black/10 ring-1 ring-white/70 transition hover:bg-zinc-50 hover:ring-pop/35"
                      : "inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-muted-blue-hover shadow-lg shadow-black/20 transition hover:bg-zinc-100"
                  }
                >
                  Share your experience
                </Link>
                <a
                  href="#how-it-works"
                  className={
                    fw
                      ? "text-center text-sm font-medium text-zinc-400 transition hover:text-pop sm:text-left"
                      : "text-sm font-medium text-zinc-400 transition hover:text-white"
                  }
                >
                  How it works
                </a>
              </div>
            </div>
          </SectionMaxW>
        </section>

      </main>
    </div>
  );
}
