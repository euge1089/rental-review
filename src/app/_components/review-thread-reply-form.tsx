"use client";

import { FormEvent, useState } from "react";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderUserId: string;
};

type Props = {
  action: "review" | "thread";
  reviewId?: string;
  threadId?: string;
  viewerId: string;
  initialMessages: Message[];
  /** When false, composer is hidden (e.g. pending acceptance or declined). */
  allowComposer?: boolean;
  statusNote?: React.ReactNode;
  onMessagesUpdated?: (payload: {
    messages: Message[];
    threadId?: string;
  }) => void;
};

export function ReviewThreadReplyForm({
  action,
  reviewId,
  threadId,
  viewerId,
  initialMessages,
  allowComposer = true,
  statusNote,
  onMessagesUpdated,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || pending) return;
    setError(null);
    setPending(true);
    try {
      const url =
        action === "review"
          ? `/api/reviews/${reviewId}/messages`
          : `/api/messages/threads/${threadId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        messages?: Message[];
        threadId?: string;
        error?: string;
      };
      if (!data.ok || !data.messages) {
        setError(data.error ?? "Couldn’t send.");
        return;
      }
      setMessages(data.messages);
      onMessagesUpdated?.({
        messages: data.messages,
        threadId: data.threadId,
      });
      setBody("");
    } catch {
      setError("Couldn’t send.");
    } finally {
      setPending(false);
    }
  }

  function labelForSender(senderId: string) {
    return senderId === viewerId ? "You" : "Other renter";
  }

  return (
    <div className="space-y-4">
      {statusNote}
      <ul className="space-y-3">
        {messages.map((m) => (
          <li
            key={m.id}
            className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 text-sm text-zinc-800"
          >
            <p className="text-[11px] font-semibold text-zinc-500">
              {labelForSender(m.senderUserId)} ·{" "}
              {new Date(m.createdAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</p>
          </li>
        ))}
      </ul>

      {allowComposer ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <label htmlFor={`reply-${threadId ?? reviewId}`} className="sr-only">
            Your message
          </label>
          <textarea
            id={`reply-${threadId ?? reviewId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Write a message…"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none ring-muted-blue/20 placeholder:text-zinc-400 focus:border-muted-blue/40 focus:ring-2"
          />
          <p className="text-[11px] text-zinc-500">
            After the author accepts, you can send at most two messages in a row before
            they reply.
          </p>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-muted-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-muted-blue-hover disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
