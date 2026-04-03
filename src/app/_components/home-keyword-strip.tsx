import type { HTMLAttributes } from "react";

const KEYWORDS = [
  "Real rent context",
  "Neighborhood-first",
  "Address-level detail",
  "Renter-written",
  "Boston-focused",
  "Transparent signals",
] as const;

function KeywordRun({
  suffix,
  ...rest
}: { suffix: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="flex shrink-0 items-center gap-x-10 pr-10 pl-4 sm:pl-8"
      {...rest}
    >
      {KEYWORDS.map((word) => (
        <span
          key={`${word}-${suffix}`}
          className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 sm:text-[11px]"
        >
          {word}
        </span>
      ))}
    </div>
  );
}

export function HomeKeywordStrip({ fw }: { fw: boolean }) {
  const shell = fw
    ? "w-full border-b border-zinc-200/80 bg-[#e9ebef]"
    : "mt-12 w-full overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-100/95 shadow-[inset_0_1px_0_rgb(255_255_255/0.65)]";

  return (
    <section
      className={shell}
      aria-label="What this community cares about"
    >
      <p className="sr-only">
        Themes include real rent context, neighborhood-first insight,
        address-level detail, renter-written reviews, and Boston focus.
      </p>
      <div className="relative h-[55.5px] overflow-hidden">
        <div className="absolute inset-0 hidden items-center justify-center px-4 motion-reduce:flex">
          <p className="text-center text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 sm:text-[11px]">
            {KEYWORDS.join("  ·  ")}
          </p>
        </div>
        <div className="motion-reduce:hidden flex h-full items-center overflow-hidden">
          <div className="home-keyword-marquee-track flex w-max items-center">
            <KeywordRun suffix="a" />
            <KeywordRun suffix="b" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
