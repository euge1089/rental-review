import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { authOptions } from "@/lib/auth";
import {
  RETENTION_CAMPAIGN_LEASE_YEAR_GAP,
  RETENTION_CAMPAIGN_NO_REVIEW,
  RETENTION_CAMPAIGN_NO_REVIEW_FOLLOWUP,
} from "@/lib/retention-emails";
import { prisma } from "@/lib/prisma";
import { linkInlineClass, linkMutedClass, surfaceSubtleClass } from "@/lib/ui-classes";

const CAMPAIGN_ORDER = [
  RETENTION_CAMPAIGN_NO_REVIEW,
  RETENTION_CAMPAIGN_NO_REVIEW_FOLLOWUP,
  RETENTION_CAMPAIGN_LEASE_YEAR_GAP,
] as const;

function campaignLabel(campaign: string): string {
  switch (campaign) {
    case RETENTION_CAMPAIGN_NO_REVIEW:
      return "No review reminder";
    case RETENTION_CAMPAIGN_NO_REVIEW_FOLLOWUP:
      return "No review follow-up";
    case RETENTION_CAMPAIGN_LEASE_YEAR_GAP:
      return "Lease year gap";
    default:
      return campaign;
  }
}

export default async function AdminRetentionPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const adminEmail = process.env.ADMIN_EMAIL ?? null;
  const isAdmin =
    !!adminEmail && !!email && adminEmail.toLowerCase() === email.toLowerCase();

  if (!isAdmin) {
    return (
      <AppPageShell gapClass="gap-4">
        <PageHeader title="Retention emails" eyebrow="Admin" />
        <p className="text-sm text-zinc-600">
          You must be signed in as an admin to view this page.
        </p>
        <Link href="/signin" className={`${linkInlineClass} text-sm`}>
          Sign in →
        </Link>
      </AppPageShell>
    );
  }

  const [sendByCampaign, clickByCampaign, recentSends, recentClicks] =
    await Promise.all([
      prisma.retentionEmailLog.groupBy({
        by: ["campaign"],
        _count: { _all: true },
      }),
      prisma.retentionEmailClick.groupBy({
        by: ["campaign"],
        _count: { _all: true },
      }),
      prisma.retentionEmailLog.findMany({
        orderBy: { sentAt: "desc" },
        take: 80,
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      }),
      prisma.retentionEmailClick.findMany({
        orderBy: { clickedAt: "desc" },
        take: 80,
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      }),
    ]);

  const sendMap = new Map(
    sendByCampaign.map((r) => [r.campaign, r._count._all]),
  );
  const clickMap = new Map(
    clickByCampaign.map((r) => [r.campaign, r._count._all]),
  );

  const allCampaigns = new Set([
    ...sendMap.keys(),
    ...clickMap.keys(),
    ...CAMPAIGN_ORDER,
  ]);

  const orderedCampaigns = [
    ...CAMPAIGN_ORDER.filter((c) => allCampaigns.has(c)),
    ...[...allCampaigns].filter((c) => !CAMPAIGN_ORDER.includes(c as (typeof CAMPAIGN_ORDER)[number])).sort(),
  ];

  const totalSent = [...sendMap.values()].reduce((a, b) => a + b, 0);
  const totalClicks = [...clickMap.values()].reduce((a, b) => a + b, 0);

  return (
    <AppPageShell gapClass="gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Admin"
          title="Retention emails"
          description={
            <p className="mt-1 max-w-2xl text-sm text-zinc-600">
              Sends are logged when the daily cron successfully queues mail.
              Clicks are recorded the first time someone uses the tracked link
              in an email (per user and campaign), then they are redirected to
              submit a review.
            </p>
          }
        />
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
          <Link href="/admin/dashboard" className={linkMutedClass}>
            Dashboard
          </Link>
          <Link href="/admin/users" className={linkMutedClass}>
            Users
          </Link>
          <Link href="/admin/reviews" className={linkMutedClass}>
            Reviews
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          className={`${surfaceSubtleClass} p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}
        >
          <p className="text-xs text-zinc-500">Total sends logged</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{totalSent}</p>
        </div>
        <div
          className={`${surfaceSubtleClass} p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}
        >
          <p className="text-xs text-zinc-500">Total tracked clicks</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {totalClicks}
          </p>
        </div>
        <div
          className={`${surfaceSubtleClass} p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:col-span-2 lg:col-span-1`}
        >
          <p className="text-xs text-zinc-500">Overall click rate</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {totalSent > 0
              ? `${((totalClicks / totalSent) * 100).toFixed(1)}%`
              : "—"}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Clicks ÷ sends (not unique users across campaigns).
          </p>
        </div>
      </section>

      <section className={`${surfaceSubtleClass} p-5 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}>
        <h2 className="text-base font-semibold text-muted-blue-hover">
          By campaign
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Click rate = tracked clicks ÷ sends for that campaign.
        </p>
        {orderedCampaigns.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">No data yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 pr-4 font-medium">Campaign</th>
                  <th className="py-2 pr-4 font-medium">Sends</th>
                  <th className="py-2 pr-4 font-medium">Clicks</th>
                  <th className="py-2 font-medium">Click rate</th>
                </tr>
              </thead>
              <tbody>
                {orderedCampaigns.map((campaign) => {
                  const sent = sendMap.get(campaign) ?? 0;
                  const clicks = clickMap.get(campaign) ?? 0;
                  const rate =
                    sent > 0 ? `${((clicks / sent) * 100).toFixed(1)}%` : "—";
                  return (
                    <tr
                      key={campaign}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-medium text-zinc-800">
                        {campaignLabel(campaign)}
                        <span className="mt-0.5 block font-mono text-[10px] font-normal text-zinc-400">
                          {campaign}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-700">{sent}</td>
                      <td className="py-2.5 pr-4 text-zinc-700">{clicks}</td>
                      <td className="py-2.5 text-zinc-700">{rate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div
          className={`${surfaceSubtleClass} p-5 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}
        >
          <h2 className="text-base font-semibold text-muted-blue-hover">
            Recent sends
          </h2>
          <p className="mt-1 text-xs text-zinc-500">Newest first (up to 80).</p>
          {recentSends.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">No sends logged yet.</p>
          ) : (
            <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto text-xs">
              {recentSends.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-zinc-200/70 bg-muted-blue-tint/35 px-3 py-2"
                >
                  <p className="font-medium text-zinc-900">
                    {row.user.displayName?.trim() || row.user.email}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {row.user.email}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    {campaignLabel(row.campaign)}
                    <span className="text-zinc-400">
                      {" "}
                      · {row.sentAt.toLocaleString()}
                    </span>
                  </p>
                  <Link
                    href={`/admin/reviews?userId=${encodeURIComponent(row.user.id)}`}
                    className="mt-1 inline-block text-[11px] font-semibold text-muted-blue hover:underline"
                  >
                    User&apos;s reviews
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className={`${surfaceSubtleClass} p-5 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)]`}
        >
          <h2 className="text-base font-semibold text-muted-blue-hover">
            Recent clicks
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            First tracked click per user and campaign (up to 80).
          </p>
          {recentClicks.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">
              No tracked clicks yet.
            </p>
          ) : (
            <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto text-xs">
              {recentClicks.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-zinc-200/70 bg-muted-blue-tint/35 px-3 py-2"
                >
                  <p className="font-medium text-zinc-900">
                    {row.user.displayName?.trim() || row.user.email}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {row.user.email}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    {campaignLabel(row.campaign)}
                    <span className="text-zinc-400">
                      {" "}
                      · {row.clickedAt.toLocaleString()}
                    </span>
                  </p>
                  <Link
                    href={`/admin/reviews?userId=${encodeURIComponent(row.user.id)}`}
                    className="mt-1 inline-block text-[11px] font-semibold text-muted-blue hover:underline"
                  >
                    User&apos;s reviews
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppPageShell>
  );
}
