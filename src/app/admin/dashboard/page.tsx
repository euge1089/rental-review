import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { linkInlineClass, surfaceSubtleClass } from "@/lib/ui-classes";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const adminEmail = process.env.ADMIN_EMAIL ?? null;
  const isAdmin =
    !!adminEmail && !!email && adminEmail.toLowerCase() === email.toLowerCase();

  if (!isAdmin) {
    return (
      <AppPageShell gapClass="gap-4">
        <PageHeader title="Admin dashboard" />
        <p className="text-sm text-zinc-600">
          You must be signed in as an admin to view this page.
        </p>
        <Link href="/signin" className={`${linkInlineClass} text-sm`}>
          Sign in →
        </Link>
      </AppPageShell>
    );
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [userCount, reviewStats, propertyStats, recentReviews] = await Promise.all([
    prisma.user.count(),
    prisma.review.groupBy({
      by: ["moderationStatus"],
      _count: { _all: true },
    }),
    prisma.property.findMany({
      include: {
        _count: { select: { reviews: true } },
        reviews: {
          select: { moderationStatus: true, moderationReasons: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.review.findMany({
      include: {
        property: true,
        user: { select: { id: true, email: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      where: {
        createdAt: { gte: oneWeekAgo },
      },
      take: 20,
    }),
  ] as const);

  const totalReviews = reviewStats.reduce(
    (sum, r) => sum + r._count._all,
    0,
  );
  const pendingCount =
    reviewStats.find((r) => r.moderationStatus === "PENDING_REVIEW")?._count
      ._all ?? 0;
  const approvedCount =
    reviewStats.find((r) => r.moderationStatus === "APPROVED")?._count._all ?? 0;
  const rejectedCount =
    reviewStats.find((r) => r.moderationStatus === "REJECTED")?._count._all ?? 0;

  const totalProperties = propertyStats.length;

  const reportedCount = await prisma.review.count({
    where: {
      NOT: {
        moderationReasons: {
          isEmpty: true,
        },
      },
    },
  });

  return (
    <AppPageShell gapClass="gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="Admin" title="Dashboard" />
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
          <Link href="/admin/reviews" className={linkInlineClass}>
            All reviews →
          </Link>
          <Link href="/admin/users" className={linkInlineClass}>
            Users →
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className={`${surfaceSubtleClass} p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}>
          <p className="text-xs text-zinc-500">Registered users</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{userCount}</p>
          <Link
            href="/admin/users"
            className={`${linkInlineClass} mt-2 inline-block text-xs font-medium`}
          >
            View list
          </Link>
        </div>
        <div className={`${surfaceSubtleClass} p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}>
          <p className="text-xs text-zinc-500">Total reviews</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {totalReviews}
          </p>
        </div>
        <div className={`${surfaceSubtleClass} p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}>
          <p className="text-xs text-zinc-500">Approved</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {approvedCount}
          </p>
        </div>
        <div className={`${surfaceSubtleClass} p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}>
          <p className="text-xs text-zinc-500">Pending review</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">
            {pendingCount}
          </p>
        </div>
        <div className={`${surfaceSubtleClass} p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}>
          <p className="text-xs text-zinc-500">Reported / flagged</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">
            {reportedCount}
          </p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className={`${surfaceSubtleClass} p-5 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}>
          <h2 className="text-base font-semibold text-muted-blue-hover">
            Top recent properties
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Up to 10 properties with their review counts and pending/flagged
            status.
          </p>
          {propertyStats.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">
              No properties yet. As reviews are added, they&apos;ll appear
              here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs">
              {propertyStats.map((p) => {
                const pending = p.reviews.filter(
                  (r) => r.moderationStatus === "PENDING_REVIEW",
                ).length;
                const flagged = p.reviews.filter(
                  (r) => r.moderationReasons.length > 0,
                ).length;
                return (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200/70 bg-muted-blue-tint/35 px-3 py-2"
                  >
                    <div>
                      <Link
                        href={`/properties/${p.id}`}
                        className="text-xs font-semibold text-muted-blue-hover underline-offset-2 hover:underline"
                      >
                        {p.addressLine1}
                      </Link>
                      <p className="text-[11px] text-zinc-600">
                        {p.city}, {p.state} {p.postalCode ?? ""}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-zinc-600">
                      <p>{p._count.reviews} reviews</p>
                      {pending > 0 && (
                        <p className="text-amber-700">
                          {pending} pending review
                          {pending === 1 ? "" : "s"}
                        </p>
                      )}
                      {flagged > 0 && (
                        <p className="text-red-700">
                          {flagged} flagged
                          {flagged === 1 ? "" : " reviews"}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={`${surfaceSubtleClass} p-5 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}>
          <h2 className="text-base font-semibold text-muted-blue-hover">
            Reviews in the last 7 days
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Recent submissions with quick context.
          </p>
          {recentReviews.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">
              No reviews in the last 7 days.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs">
              {recentReviews.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-zinc-200/70 bg-muted-blue-tint/35 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/properties/${r.propertyId}`}
                        className="font-semibold text-muted-blue-hover underline-offset-2 hover:underline"
                      >
                        {r.property.addressLine1}
                      </Link>
                      <p className="text-[11px] text-zinc-600">
                        {r.property.city}, {r.property.state}{" "}
                        {r.property.postalCode ?? ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium uppercase text-zinc-500 ring-1 ring-zinc-200/80">
                      {r.moderationStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Year {r.reviewYear}
                    {typeof r.monthlyRent === "number"
                      ? ` · $${r.monthlyRent.toLocaleString()}/month`
                      : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {r.user.displayName?.trim() || r.user.email}
                    {" · "}
                    <Link
                      href={`/admin/reviews?userId=${encodeURIComponent(r.user.id)}`}
                      className="font-medium text-muted-blue hover:underline"
                    >
                      Open in review tools
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppPageShell>
  );
}

