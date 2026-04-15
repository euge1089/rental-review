"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  threadId: string;
};

export function ReviewThreadAuthorActions({ threadId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(path: "accept" | "decline") {
    setError(null);
    setPending(path);
    try {
      const res = await fetch(`/api/messages/threads/${threadId}/${path}`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium text-amber-950">Accept this conversation?</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
        Another renter asked a follow-up about your review. Until you accept, they
        can&apos;t send more messages and you can&apos;t reply. You can decline if you
        don&apos;t want to chat.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => post("accept")}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-muted-blue px-5 py-2 text-xs font-semibold text-white transition hover:bg-muted-blue-hover disabled:opacity-50"
        >
          {pending === "accept" ? "Accepting…" : "Accept"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => post("decline")}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-amber-300 bg-white px-5 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-100/80 disabled:opacity-50"
        >
          {pending === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
