import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  reviewCount: number;
  /** Signed-in: Save apartment + Tour checklist, top-right, stacked */
  engagementSlot?: ReactNode;
};

export function PropertyDetailHero({
  addressLine1,
  city,
  state,
  postalCode,
  reviewCount,
  engagementSlot,
}: Props) {
  const location = [city, state, postalCode].filter(Boolean).join(", ");

  return (
    <section className="relative -mx-4 overflow-hidden border-b border-zinc-100 bg-gradient-to-br from-white via-[#fafbfc] to-muted-blue-tint/40 shadow-elevated sm:mx-0 sm:rounded-3xl sm:border sm:border-zinc-100">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-muted-blue-tint/80 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-pop-tint/60 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/4 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-accent-teal-tint/50 blur-3xl"
        aria-hidden
      />

      <div className="relative px-4 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200/90 bg-white/95 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-blue shadow-sm">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-pop shadow-[0_0_0_3px_rgb(253_246_240/0.95)]"
                aria-hidden
              />
              Address snapshot
            </p>
            <h1 className="break-words text-pretty text-[clamp(1.35rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight text-muted-blue-hover">
              {addressLine1}
            </h1>
            <p className="text-sm leading-relaxed text-zinc-600 sm:text-base">
              {location}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-[0_1px_2px_rgb(15_23_42/0.06)] ring-1 ring-zinc-200/80">
                <span className="font-semibold tabular-nums text-muted-blue-hover">
                  {reviewCount}
                </span>
                <span className="text-zinc-500">
                  review{reviewCount === 1 ? "" : "s"} at this address
                </span>
              </span>
            </div>

            <div className="flex max-w-md flex-col gap-3 pt-1 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/submit"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-muted-blue px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition hover:bg-muted-blue-hover sm:min-h-0 sm:w-fit"
              >
                Add your review
              </Link>
              <Link
                href="/properties"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200/90 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover shadow-sm transition hover:border-muted-blue/35 hover:bg-muted-blue-tint/50 hover:shadow-elevated sm:min-h-0 sm:w-fit"
              >
                ← Browse all
              </Link>
            </div>
          </div>

          {engagementSlot ? (
            <div className="flex w-full shrink-0 flex-col gap-3 lg:mt-0 lg:w-auto lg:min-w-[12rem] lg:self-stretch lg:items-stretch">
              {engagementSlot}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
