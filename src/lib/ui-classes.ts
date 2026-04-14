/**
 * Shared Tailwind class strings - see docs/design-system.md.
 */

/** Matches home page `SectionMaxW` (full-width layout) - use for header, footer, and `AppPageShell`. */
export const appContentMaxWidthClass =
  "max-w-[min(88rem,calc(100%-1rem))] sm:max-w-[min(88rem,calc(100%-2rem))]";

/** Horizontal gutters - roomier on phones (iPhone-friendly). */
export const appContentPaddingXClass =
  "px-4 sm:px-8 lg:px-12 xl:px-20";

export const surfaceElevatedClass =
  "rounded-3xl border border-zinc-100 bg-white shadow-elevated";

export const surfaceSubtleClass =
  "rounded-2xl border border-zinc-200/80 bg-white";

/** Full-screen overlay; includes `z-[100]`. Override with `className` when nesting modals. */
export const modalBackdropClass =
  "fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-zinc-900/45 p-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-[2px] sm:p-6";

export const modalDialogClass =
  "relative z-10 w-full max-w-md max-h-[min(90dvh,92vh)] overflow-y-auto overscroll-contain rounded-3xl border border-zinc-100 bg-white p-5 shadow-elevated sm:p-8";

/** Default height for dense forms (submit flow). */
/** Auth panels, profile forms - matches home modal fields. */
export const formInputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-muted-blue/40 focus:ring-2 focus:ring-muted-blue/20 sm:text-sm";

export const formInputCompactClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-muted-blue/40 focus:ring-2 focus:ring-muted-blue/20 sm:h-10 sm:text-sm";

export const formTextareaClass =
  "min-h-[7.5rem] w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-muted-blue/40 focus:ring-2 focus:ring-muted-blue/20 sm:text-sm";

export const formSelectCompactClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-700 outline-none focus:border-muted-blue/40 focus:ring-2 focus:ring-muted-blue/20 sm:h-10 sm:text-sm";

export const linkInlineClass =
  "font-medium text-muted-blue transition hover:text-muted-blue-hover hover:underline";

export const linkMutedClass =
  "text-sm text-zinc-600 underline-offset-2 transition hover:text-muted-blue-hover hover:underline";
