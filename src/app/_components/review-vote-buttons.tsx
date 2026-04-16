"use client";

import { useState } from "react";

type Props = {
  reviewId: string;
  initialUp: number;
  initialMyVote: number | null;
  /** When true, voting is disabled (e.g. block relationship). */
  disabled?: boolean;
};

function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}

export function ReviewVoteButtons({
  reviewId,
  initialUp,
  initialMyVote,
  disabled = false,
}: Props) {
  const [up, setUp] = useState(initialUp);
  const [myVote, setMyVote] = useState<number | null>(
    initialMyVote === 1 ? 1 : null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function postVote(value: 1 | 0) {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        up?: number;
        myVote?: number | null;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Couldn’t save vote.");
        return;
      }
      setUp(data.up ?? 0);
      const m = data.myVote;
      setMyVote(m === 1 ? 1 : null);
    } catch {
      setError("Couldn’t save vote.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:mr-1">
          Helpful?
        </span>
        <button
          type="button"
          disabled={pending || disabled}
          onClick={() => postVote(myVote === 1 ? 0 : 1)}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-50 sm:min-h-0 sm:gap-1 sm:px-2.5 sm:py-1 sm:text-xs ${
            myVote === 1
              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50/50"
          }`}
          aria-pressed={myVote === 1}
          aria-label={myVote === 1 ? "Remove helpful vote" : "Mark as helpful"}
        >
          <ThumbUpIcon />
          <span className="tabular-nums">{up}</span>
        </button>
      </div>
      {disabled ? (
        <p className="text-[11px] text-zinc-500">Voting isn’t available here.</p>
      ) : null}
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
