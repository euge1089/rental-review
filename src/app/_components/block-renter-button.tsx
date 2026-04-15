"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  blockedUserId: string;
};

export function BlockRenterButton({ blockedUserId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onBlock() {
    if (pending || done) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Block this renter? You won’t be able to exchange private messages or vote on each other’s reviews until you unblock them from your profile.",
      )
    ) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/user-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUserId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not block.");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Could not block.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="text-xs text-zinc-600">
        Blocked. You can unblock from your profile under Blocked renters.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={onBlock}
        className="inline-flex min-h-9 items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        {pending ? "Blocking…" : "Block this renter"}
      </button>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
