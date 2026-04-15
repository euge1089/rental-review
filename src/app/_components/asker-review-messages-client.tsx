"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ReviewThreadReplyForm } from "@/app/_components/review-thread-reply-form";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderUserId: string;
};

type ThreadMeta = {
  id: string;
  acceptedAt: string | null;
  declinedAt: string | null;
};

type Props = {
  reviewId: string;
  viewerId: string;
  initialThread: ThreadMeta | null;
  initialMessages: Message[];
};

export function AskerReviewMessagesClient({
  reviewId,
  viewerId,
  initialThread,
  initialMessages,
}: Props) {
  const [threadMeta, setThreadMeta] = useState<ThreadMeta | null>(initialThread);
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    if (!threadMeta || threadMeta.acceptedAt || threadMeta.declinedAt) return;
    const timer = window.setInterval(async () => {
      try {
        const r = await fetch(`/api/reviews/${reviewId}/messages`);
        const d = (await r.json()) as {
          ok: boolean;
          thread?: {
            id: string;
            acceptedAt: string | null;
            declinedAt: string | null;
            messages: Message[];
          };
        };
        if (!d.ok || !d.thread) return;
        setThreadMeta({
          id: d.thread.id,
          acceptedAt: d.thread.acceptedAt,
          declinedAt: d.thread.declinedAt,
        });
        setMessages(d.thread.messages);
      } catch {
        /* ignore */
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [reviewId, threadMeta]);

  const declined = Boolean(threadMeta?.declinedAt);
  const accepted = Boolean(threadMeta?.acceptedAt);
  const pending = Boolean(threadMeta && !accepted && !declined);

  const allowComposer =
    !declined && (!threadMeta || accepted || (pending && messages.length === 0));

  let statusNote: ReactNode = null;
  if (declined) {
    statusNote = (
      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        The review author declined this conversation. No further messages can be sent.
      </p>
    );
  } else if (pending && messages.length > 0) {
    statusNote = (
      <p className="rounded-xl border border-muted-blue/20 bg-muted-blue-tint/40 px-3 py-2 text-sm text-zinc-700">
        Waiting for the review author to accept. You&apos;ll be able to send more after
        they accept (up to two messages in a row before they reply). This page checks for
        updates every few seconds.
      </p>
    );
  }

  return (
    <ReviewThreadReplyForm
      action="review"
      reviewId={reviewId}
      viewerId={viewerId}
      initialMessages={messages}
      allowComposer={allowComposer}
      statusNote={statusNote}
      onMessagesUpdated={(payload) => {
        setMessages(payload.messages);
        if (payload.threadId && !threadMeta) {
          setThreadMeta({
            id: payload.threadId,
            acceptedAt: null,
            declinedAt: null,
          });
        }
      }}
    />
  );
}
