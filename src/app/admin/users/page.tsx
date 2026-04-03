import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRODUCT_POLICY } from "@/lib/policy";
import { linkInlineClass, linkMutedClass, surfaceSubtleClass } from "@/lib/ui-classes";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const adminEmail = process.env.ADMIN_EMAIL ?? null;
  const isAdmin =
    !!adminEmail && !!email && adminEmail.toLowerCase() === email.toLowerCase();

  if (!isAdmin) {
    return (
      <AppPageShell gapClass="gap-4">
        <PageHeader title="Users" eyebrow="Admin" />
        <p className="text-sm text-zinc-600">
          You must be signed in as an admin to view this page.
        </p>
        <Link href="/signin" className={`${linkInlineClass} text-sm`}>
          Sign in →
        </Link>
      </AppPageShell>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      phoneVerified: true,
      _count: { select: { reviews: true } },
    },
  });

  const cap = PRODUCT_POLICY.reviews.maxReviewsPerUser;

  return (
    <AppPageShell gapClass="gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Admin"
          title="Users"
          description={
            <p className="mt-1 max-w-xl text-sm text-zinc-600">
              Each account can post up to {cap} reviews site-wide. Open a user&apos;s
              reviews to moderate, search, or remove entries.
            </p>
          }
        />
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/dashboard" className={linkMutedClass}>
            Dashboard
          </Link>
          <Link href="/admin/reviews" className={`${linkInlineClass} font-semibold`}>
            All reviews →
          </Link>
        </div>
      </div>

      <p className="text-sm text-zinc-600">
        Showing {users.length} user{users.length === 1 ? "" : "s"} (most recent first).
      </p>

      {users.length === 0 ? (
        <p className="text-sm text-zinc-600">No users yet.</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => {
            const atCap = u._count.reviews >= cap;
            return (
              <li key={u.id}>
                <div
                  className={`${surfaceSubtleClass} flex flex-col gap-2 p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:flex-row sm:items-center sm:justify-between`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900">
                      {u.displayName?.trim() || u.email}
                    </p>
                    {u.displayName?.trim() ? (
                      <p className="truncate text-xs text-zinc-500">{u.email}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Joined {u.createdAt.toLocaleDateString()}
                      {u.phoneVerified ? (
                        <span className="ml-2 text-emerald-700">· Phone verified</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${
                        atCap
                          ? "bg-amber-50 text-amber-800 ring-amber-200"
                          : "bg-zinc-50 text-zinc-600 ring-zinc-200"
                      }`}
                    >
                      {u._count.reviews} / {cap} reviews
                    </span>
                    <Link
                      href={`/admin/reviews?userId=${encodeURIComponent(u.id)}`}
                      className="inline-flex min-h-10 items-center rounded-full bg-muted-blue px-4 py-2 text-xs font-semibold text-white hover:bg-muted-blue-hover sm:min-h-0"
                    >
                      View reviews
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppPageShell>
  );
}
