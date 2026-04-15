"use client";

import { type ReactNode, useCallback, useState } from "react";

type Tone = "neutral" | "emerald";

type Props = {
  id?: string;
  title: string;
  /** One-line preview when collapsed */
  summary: string;
  defaultExpanded?: boolean;
  /** Styling when collapsed */
  collapsedTone?: Tone;
  /** Styling when expanded (name card uses white when expanded) */
  expandedTone?: Tone;
  children: ReactNode;
  /** Controlled mode (optional) */
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
};

function shellClass(collapsed: boolean, collapsedTone: Tone, expandedTone: Tone) {
  const base =
    "scroll-mt-24 rounded-2xl border shadow-[0_1px_2px_rgb(15_23_42/0.04)] flex flex-col min-h-0 lg:h-full";
  if (collapsed) {
    if (collapsedTone === "emerald") {
      return `${base} border-emerald-200/70 bg-emerald-50/50 px-4 py-3.5 sm:px-5 sm:py-4`;
    }
    return `${base} border-zinc-200/80 bg-white px-4 py-3.5 sm:px-5 sm:py-4`;
  }
  if (expandedTone === "emerald") {
    return `${base} border-emerald-200/70 bg-emerald-50/50 p-5 sm:p-6`;
  }
  return `${base} border-zinc-200/80 bg-white p-5 sm:p-6`;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronUp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832l-3.71 3.938a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ProfileAccordionSection({
  id,
  title,
  summary,
  defaultExpanded = false,
  collapsedTone = "neutral",
  expandedTone = "neutral",
  children,
  expanded: expandedControlled,
  onExpandedChange,
}: Props) {
  const [uncontrolled, setUncontrolled] = useState(defaultExpanded);
  const isControlled = expandedControlled !== undefined;
  const expanded = isControlled ? expandedControlled : uncontrolled;

  const setExpanded = useCallback(
    (next: boolean) => {
      if (isControlled) {
        onExpandedChange?.(next);
      } else {
        setUncontrolled(next);
      }
    },
    [isControlled, onExpandedChange],
  );

  const collapsed = !expanded;

  return (
    <section
      id={id}
      className={shellClass(collapsed, collapsedTone, expandedTone)}
    >
      {collapsed ? (
        <>
          <h2 className="text-base font-semibold text-muted-blue-hover">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="group mt-2 flex min-h-[4.5rem] w-full flex-1 flex-col justify-between gap-3 rounded-lg text-left outline-none ring-muted-blue/40 focus-visible:ring-2"
            aria-expanded={false}
            aria-label={`Expand ${title}`}
          >
            <span className="min-w-0 flex-1 text-sm leading-snug text-zinc-700">
              {summary}
            </span>
            <span className="flex justify-end pt-1">
              <span
                className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-zinc-500 transition group-hover:text-zinc-700 ${
                  collapsedTone === "emerald"
                    ? "border-emerald-200/80 bg-white/80 group-hover:border-emerald-300"
                    : "border-zinc-200/90 bg-white/90 group-hover:border-zinc-300"
                }`}
                aria-hidden
              >
                <ChevronDown className="size-4" />
              </span>
            </span>
          </button>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
              aria-expanded
              aria-label={`Collapse ${title}`}
            >
              <ChevronUp className="size-4" />
            </button>
          </div>
          <div className="mt-3 min-w-0">{children}</div>
        </>
      )}
    </section>
  );
}
