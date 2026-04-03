 "use client";

import { useState } from "react";

type Props = {
  reviewId: string;
};

export function ReportReviewButton({ reviewId }: Props) {
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");

  async function handleClick() {
    const reason = window.prompt(
      "Why are you reporting this review? (e.g. contains names, harassment, false information)",
    );
    if (!reason) return;
    try {
      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const result = (await response.json()) as { ok: boolean };
      if (result.ok) {
        setState("sent");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-2 text-xs">
      <button
        type="button"
        onClick={handleClick}
        className="-mx-1 inline-flex min-h-11 items-center rounded-md px-1 py-2 text-zinc-400 underline-offset-2 active:bg-zinc-100 hover:text-zinc-600 hover:underline sm:min-h-0 sm:py-0"
      >
        Report this review
      </button>
      {state === "sent" ? (
        <span className="ml-2 text-[11px] text-zinc-500">
          Thank you, this will be reviewed.
        </span>
      ) : state === "error" ? (
        <span className="ml-2 text-[11px] text-red-500">Could not send report.</span>
      ) : null}
    </div>
  );
}

