"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** Larger, full-width style for the marketing hero */
  variant?: "default" | "hero" | "heroWide";
};

export function HomeSearch({ variant = "default" }: Props) {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const query = value.trim();
    if (!query) return;
    const params = new URLSearchParams({ query });
    router.push(`/analytics?${params.toString()}`);
  }

  const isHero = variant === "hero" || variant === "heroWide";
  const isWide = variant === "heroWide";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isHero
          ? isWide
            ? "mt-2 flex w-full max-w-2xl flex-col gap-3 lg:max-w-none lg:max-w-3xl"
            : "mt-2 flex w-full flex-col gap-3"
          : "mt-4 flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center"
      }
    >
      {!isHero ? (
        <label className="text-xs font-medium text-muted-blue">
          Search by Boston address or ZIP
        </label>
      ) : null}
      <div
        className={`flex w-full gap-3 ${isHero ? "flex-col sm:flex-row sm:items-stretch" : ""} ${isWide ? "rounded-2xl border border-zinc-100 bg-white p-2 shadow-elevated" : ""}`}
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Street, apartment name, or ZIP (e.g. 02127)"
          className={
            isWide
              ? "min-h-[48px] flex-1 rounded-xl border-0 bg-zinc-50/80 px-4 py-2.5 text-[0.95rem] text-zinc-900 shadow-none outline-none transition placeholder:text-muted-blue-soft focus:bg-white focus:ring-2 focus:ring-muted-blue/25 lg:text-[0.975rem]"
              : isHero
                ? "min-h-[44px] flex-1 rounded-xl border-0 bg-zinc-50/90 px-4 py-2.5 text-[0.875rem] text-zinc-900 shadow-[inset_0_0_0_1px_rgb(15_23_42/0.06)] outline-none transition placeholder:text-muted-blue-soft focus:bg-white focus:shadow-[inset_0_0_0_2px_rgb(92_107_127/0.35)]"
                : "min-h-11 flex-1 rounded-lg border-0 bg-zinc-50/90 px-3 py-2 text-base shadow-[inset_0_0_0_1px_rgb(15_23_42/0.06)] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgb(92_107_127/0.25)] sm:text-sm"
          }
        />
        <button
          type="submit"
          className={
            isWide
              ? "inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-pop px-8 text-[0.95rem] font-semibold text-white shadow-[0_10px_28px_-6px_rgb(219_120_55/0.45)] transition hover:bg-pop-hover sm:min-w-[128px]"
              : isHero
                ? "inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-2xl bg-muted-blue px-6 text-[0.875rem] font-semibold text-white transition hover:bg-muted-blue-hover sm:px-8"
                : "inline-flex min-h-11 items-center justify-center rounded-full bg-muted-blue px-5 text-sm font-medium text-white active:bg-muted-blue-hover hover:bg-muted-blue-hover"
          }
        >
          Search
        </button>
      </div>
    </form>
  );
}
