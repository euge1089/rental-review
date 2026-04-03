import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { ProfileBookmarks } from "@/app/_components/profile-bookmarks";
import { ProfileVerification } from "@/app/_components/profile-verification";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { linkInlineClass } from "@/lib/ui-classes";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const adminEmail = process.env.ADMIN_EMAIL ?? null;
  const isAdmin =
    !!adminEmail && !!email && adminEmail.toLowerCase() === email.toLowerCase();

  if (!email) {
    return (
      <AppPageShell gapClass="gap-6">
        <PageHeader
          eyebrow="Profile"
          title="Your profile"
          description="You need to sign in to see your reviews and saved apartments."
        />
        <SurfacePanel variant="subtle">
          <Link href="/signin" className={`${linkInlineClass} text-sm`}>
            Sign in →
          </Link>
        </SurfacePanel>
      </AppPageShell>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { phoneVerified: true },
  });

  const reviews = await prisma.review.findMany({
    where: {
      user: { email },
    },
    include: {
      property: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <AppPageShell>
      <PageHeader
        eyebrow="Profile"
        title="Your reviews and saved apartments"
        description={
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Signed in as <span className="font-medium text-zinc-800">{email}</span>.
            </span>
            {user?.phoneVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-600/15">
                Verified renter
              </span>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-5 md:grid-cols-4">
        <SurfacePanel variant="subtle" as="div" className="md:col-span-3">
          <h2 className="text-base font-semibold text-muted-blue-hover">
            Saved apartments
          </h2>
          <div className="mt-3">
            <ProfileBookmarks />
          </div>
        </SurfacePanel>
        <SurfacePanel
          variant="subtle"
          as="div"
          id="verification"
          className="scroll-mt-24"
        >
          <h2 className="text-base font-semibold text-muted-blue-hover">
            Profile verification
          </h2>
          <div className="mt-3">
            <ProfileVerification initialVerified={Boolean(user?.phoneVerified)} />
          </div>
        </SurfacePanel>
      </section>

      {isAdmin ? (
        <SurfacePanel variant="muted">
          <h2 className="text-base font-semibold text-muted-blue-hover">
            Admin tools
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            As an admin, you can review and moderate reported or flagged reviews.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/dashboard"
              className="inline-flex rounded-full border border-muted-blue/25 bg-white px-4 py-2 text-xs font-semibold text-muted-blue-hover shadow-sm transition hover:border-muted-blue/40 hover:bg-muted-blue-tint/50"
            >
              Open admin dashboard
            </Link>
            <Link
              href="/admin/reviews"
              className="inline-flex rounded-full border border-muted-blue/25 bg-white px-4 py-2 text-xs font-semibold text-muted-blue-hover shadow-sm transition hover:border-muted-blue/40 hover:bg-muted-blue-tint/50"
            >
              Review moderation queue
            </Link>
          </div>
        </SurfacePanel>
      ) : null}

      <SurfacePanel variant="elevated">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          Your reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">
            You haven&apos;t submitted any reviews yet.{" "}
            <Link href="/submit" className={linkInlineClass}>
              Share your first experience
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-2xl border border-zinc-200/80 bg-muted-blue-tint/30 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/properties/${review.propertyId}`}
                      className="text-sm font-semibold text-muted-blue-hover underline-offset-2 hover:underline"
                    >
                      {review.property.addressLine1}
                    </Link>
                    <p className="text-xs text-zinc-600">
                      {review.property.city}, {review.property.state}{" "}
                      {review.property.postalCode ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500 ring-1 ring-zinc-200/80">
                      {review.moderationStatus}
                    </span>
                    <Link
                      href={`/profile/reviews/${review.id}/edit`}
                      className="text-[11px] font-semibold text-muted-blue hover:underline"
                    >
                      Edit review
                    </Link>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-600">
                  Lease start {review.reviewYear}
                  {typeof review.monthlyRent === "number"
                    ? ` · $${review.monthlyRent.toLocaleString()}/month`
                    : ""}
                </p>
                {review.body ? (
                  <p className="mt-2 text-xs leading-6 text-zinc-700">
                    {review.body.length > 140
                      ? `${review.body.slice(0, 140)}…`
                      : review.body}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">No written review text.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </SurfacePanel>
    </AppPageShell>
  );
}
