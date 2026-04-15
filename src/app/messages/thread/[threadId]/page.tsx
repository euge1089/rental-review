import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { BlockRenterButton } from "@/app/_components/block-renter-button";
import { ReviewThreadAuthorActions } from "@/app/_components/review-thread-author-actions";
import { ReviewThreadReplyForm } from "@/app/_components/review-thread-reply-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEitherUserBlocking } from "@/lib/user-blocks";
import { linkMutedClass } from "@/lib/ui-classes";

type Props = { params: Promise<{ threadId: string }> };

export default async function MessageThreadPage({ params }: Props) {
  const { threadId } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/messages/thread/${threadId}`)}`);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/messages/thread/${threadId}`)}`);
  }

  const thread = await prisma.reviewMessageThread.findFirst({
    where: {
      id: threadId,
      OR: [{ starterUserId: user.id }, { review: { userId: user.id } }],
    },
    include: {
      review: {
        select: {
          id: true,
          userId: true,
          moderationStatus: true,
          property: { select: { addressLine1: true, id: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, createdAt: true, senderUserId: true },
      },
    },
  });

  if (!thread || thread.review.moderationStatus !== "APPROVED") {
    notFound();
  }

  const initialMessages = thread.messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  const declined = Boolean(thread.declinedAt);
  const accepted = Boolean(thread.acceptedAt);
  const pending = !accepted && !declined;
  const viewerIsAuthor = thread.review.userId === user.id;
  const otherUserId = viewerIsAuthor ? thread.starterUserId : thread.review.userId;
  const conversationBlocked = await isEitherUserBlocking(user.id, otherUserId);

  const allowComposer = !declined && accepted && !conversationBlocked;

  let statusNote: ReactNode = null;
  if (conversationBlocked) {
    statusNote = (
      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        Messaging isn&apos;t available in this conversation because someone is blocked.
        You can manage blocks from your profile.
      </p>
    );
  } else if (declined) {
    statusNote = (
      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        This conversation was declined. No further messages can be sent.
      </p>
    );
  } else if (pending && !viewerIsAuthor) {
    statusNote = (
      <p className="rounded-xl border border-muted-blue/20 bg-muted-blue-tint/40 px-3 py-2 text-sm text-zinc-700">
        Waiting for the review author to accept before you can send another message.
      </p>
    );
  }

  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader
        eyebrow="Conversation"
        title={thread.review.property.addressLine1}
        description={
          <span className="text-sm text-zinc-600">
            {thread.starterUserId === user.id
              ? "You started this thread about another renter’s review."
              : "Someone asked a follow-up about your review at this address."}{" "}
            {pending && viewerIsAuthor
              ? "Accept or decline before replying."
              : null}
          </span>
        }
      />

      <p className="text-sm">
        <Link href="/messages" className={linkMutedClass}>
          ← All messages
        </Link>
        {" · "}
        <Link
          href={`/properties/${thread.review.property.id}`}
          className={linkMutedClass}
        >
          View property
        </Link>
      </p>

      {pending && viewerIsAuthor ? (
        <ReviewThreadAuthorActions threadId={threadId} />
      ) : null}

      {!conversationBlocked ? (
        <div className="max-w-md">
          <BlockRenterButton blockedUserId={otherUserId} />
        </div>
      ) : null}

      <ReviewThreadReplyForm
        action="thread"
        threadId={threadId}
        viewerId={user.id}
        initialMessages={initialMessages}
        allowComposer={allowComposer}
        statusNote={statusNote}
      />
    </AppPageShell>
  );
}
