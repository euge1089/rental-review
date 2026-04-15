import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { AskerReviewMessagesClient } from "@/app/_components/asker-review-messages-client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { linkMutedClass, surfaceElevatedClass } from "@/lib/ui-classes";

type Props = { params: Promise<{ reviewId: string }> };

export default async function MessageAboutReviewPage({ params }: Props) {
  const { reviewId } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    redirect(
      `/signin?callbackUrl=${encodeURIComponent(`/messages/review/${reviewId}`)}`,
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    redirect(
      `/signin?callbackUrl=${encodeURIComponent(`/messages/review/${reviewId}`)}`,
    );
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      moderationStatus: true,
      property: { select: { addressLine1: true, id: true } },
    },
  });

  if (!review || review.moderationStatus !== "APPROVED") {
    notFound();
  }

  if (review.userId === user.id) {
    return (
      <AppPageShell gapClass="gap-6">
        <PageHeader
          eyebrow="Your review"
          title="This is your review"
          description="Questions from other renters show up in your inbox — you can reply there."
        />
        <div className={`${surfaceElevatedClass} p-6`}>
          <p className="text-sm text-zinc-600">
            <Link href="/messages" className="font-semibold text-muted-blue-hover underline-offset-2 hover:underline">
              Open messages
            </Link>{" "}
            to see conversations about your reviews.
          </p>
          <p className="mt-4 text-sm">
            <Link
              href={`/properties/${review.property.id}`}
              className={linkMutedClass}
            >
              ← Back to {review.property.addressLine1}
            </Link>
          </p>
        </div>
      </AppPageShell>
    );
  }

  const thread = await prisma.reviewMessageThread.findUnique({
    where: {
      reviewId_starterUserId: { reviewId, starterUserId: user.id },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, createdAt: true, senderUserId: true },
      },
    },
  });

   const initialMessages =
    thread?.messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })) ?? [];

  const initialThread = thread
    ? {
        id: thread.id,
        acceptedAt: thread.acceptedAt?.toISOString() ?? null,
        declinedAt: thread.declinedAt?.toISOString() ?? null,
      }
    : null;

  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader
        eyebrow="Private message"
        title={`Ask about this review`}
        description={
          <span className="text-sm text-zinc-600">
            <span className="font-medium text-zinc-800">
              {review.property.addressLine1}
            </span>
            . Only you and the review author can read this thread. Keep it respectful;
            don&apos;t use this to harass or share personal contact info. The author
            must accept before the conversation continues; you can send at most two
            messages in a row before they reply.
          </span>
        }
      />

      <p className="text-sm">
        <Link href={`/properties/${review.property.id}`} className={linkMutedClass}>
          ← Back to property
        </Link>
        {" · "}
        <Link href="/messages" className={linkMutedClass}>
          Inbox
        </Link>
      </p>

      <AskerReviewMessagesClient
        reviewId={reviewId}
        viewerId={user.id}
        initialThread={initialThread}
        initialMessages={initialMessages}
      />
    </AppPageShell>
  );
}
