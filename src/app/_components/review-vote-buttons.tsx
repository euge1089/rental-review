"use client";

import { useState } from "react";

type Props = {
  reviewId: string;
  initialUp: number;
  initialDown: number;
  initialMyVote: number | null;
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

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
    </svg>
  );
}

export function ReviewVoteButtons({
  reviewId,
  initialUp,
  initialDown,
  initialMyVote,
}: Props) {
  const [up, setUp] = useState(initialUp);
  const [down, setDown] = useState(initialDown);
  const [myVote, setMyVote] = useState<number | null>(initialMyVote);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function postVote(value: 1 | -1 | 0) {
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
        down?: number;
        myVote?: number | null;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Couldn’t save vote.");
        return;
      }
      setUp(data.up ?? 0);
      setDown(data.down ?? 0);
      const m = data.myVote;
      setMyVote(m === 1 || m === -1 ? m : null);
    } catch {
      setError("Couldn’t save vote.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Helpful?
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => postVote(myVote === 1 ? 0 : 1)}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            myVote === 1
              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50/50"
          }`}
          aria-pressed={myVote === 1}
          aria-label={myVote === 1 ? "Remove upvote" : "Thumbs up"}
        >
          <ThumbUpIcon />
          <span className="tabular-nums">{up}</span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => postVote(myVote === -1 ? 0 : -1)}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            myVote === -1
              ? "border-rose-400 bg-rose-50 text-rose-900"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-rose-200 hover:bg-rose-50/50"
          }`}
          aria-pressed={myVote === -1}
          aria-label={myVote === -1 ? "Remove downvote" : "Thumbs down"}
        >
          <ThumbDownIcon />
          <span className="tabular-nums">{down}</span>
        </button>
      </div>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
