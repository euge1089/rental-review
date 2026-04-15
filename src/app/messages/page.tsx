import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { surfaceElevatedClass } from "@/lib/ui-classes";

export default async function MessagesInboxPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    redirect("/signin?callbackUrl=/messages");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    redirect("/signin?callbackUrl=/messages");
  }

  const threads = await prisma.reviewMessageThread.findMany({
    where: {
      OR: [{ starterUserId: user.id }, { review: { userId: user.id } }],
      review: { moderationStatus: "APPROVED" },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      review: {
        select: {
          id: true,
          userId: true,
          property: { select: { addressLine1: true, id: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true },
      },
    },
  });

  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Private notes between you and other renters about a specific review. Only you and the other participant can see a thread."
        descriptionClassName="max-w-none text-sm leading-relaxed text-zinc-600"
      />

      <section className="space-y-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-blue">
          Conversations
        </h2>

        {threads.length === 0 ? (
          <div className={`${surfaceElevatedClass} p-8 text-center`}>
            <p className="text-sm leading-relaxed text-zinc-600">
              No conversations yet. Open a building page, pick a review, and use{" "}
              <span className="font-bold text-zinc-900">Message the author</span> to ask
              follow-up questions.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/properties"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200/90 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover shadow-sm transition hover:border-muted-blue/35 hover:bg-muted-blue-tint/50"
              >
                Browse addresses
              </Link>
              <Link
                href="/analytics"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200/90 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover shadow-sm transition hover:border-muted-blue/35 hover:bg-muted-blue-tint/50"
              >
                Rental analytics
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {threads.map((t) => {
              const preview = t.messages[0];
              const isAsker = t.starterUserId === user.id;
              const declined = Boolean(t.declinedAt);
              const pending = !t.acceptedAt && !declined;
              const label = isAsker
                ? `Your question · ${t.review.property.addressLine1}`
                : `Question about your review · ${t.review.property.addressLine1}`;
              return (
                <li key={t.id}>
                  <Link
                    href={`/messages/thread/${t.id}`}
                    className={`${surfaceElevatedClass} block p-4 transition hover:border-muted-blue/25 hover:shadow-sm sm:p-5`}
                  >
                    <p className="text-sm font-semibold text-muted-blue-hover">{label}</p>
                    {declined ? (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                        Declined
                      </p>
                    ) : pending ? (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                        {isAsker ? "Awaiting acceptance" : "Needs your response"}
                      </p>
                    ) : null}
                    {preview ? (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                        {preview.body}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-zinc-400">
                      Updated{" "}
                      {t.updatedAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppPageShell>
  );
}
