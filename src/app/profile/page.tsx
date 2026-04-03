import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { ProfileBookmarks } from "@/app/_components/profile-bookmarks";
import { ProfileDisplayNameCard } from "@/app/_components/profile-display-name-card";
import { ProfileOnboardingOverlay } from "@/app/_components/profile-onboarding-overlay";
import {
  ProfileReviewsGrouped,
  type ProfileReviewForList,
} from "@/app/_components/profile-reviews-grouped";
import { ProfileVerification } from "@/app/_components/profile-verification";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { linkInlineClass } from "@/lib/ui-classes";

type Props = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function ProfilePage({ searchParams }: Props) {
  const { welcome } = await searchParams;
  const fromSignupWelcome = welcome === "1";
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
    select: { phoneVerified: true, displayName: true },
  });

  const [reviews, reviewTotalCount] = await Promise.all([
    prisma.review.findMany({
      where: {
        user: { email },
      },
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.review.count({
      where: { user: { email } },
    }),
  ]);

  const displayName = user?.displayName ?? null;

  return (
    <AppPageShell>
      <ProfileOnboardingOverlay
        fromSignup={fromSignupWelcome}
        displayName={displayName}
        reviewCount={reviews.length}
      />
      <PageHeader
        eyebrow="Profile"
        title="Your reviews and saved apartments"
        description={
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Signed in as{" "}
              <span className="font-medium text-zinc-800">
                {displayName?.trim() ? displayName.trim() : email}
              </span>
              {displayName?.trim() ? (
                <span className="text-zinc-500">({email})</span>
              ) : null}
              .
            </span>
            {user?.phoneVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-600/15">
                Verified renter
              </span>
            ) : null}
          </div>
        }
      />

      <ProfileDisplayNameCard initialDisplayName={displayName} />

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
            <Link
              href="/admin/users"
              className="inline-flex rounded-full border border-muted-blue/25 bg-white px-4 py-2 text-xs font-semibold text-muted-blue-hover shadow-sm transition hover:border-muted-blue/40 hover:bg-muted-blue-tint/50"
            >
              Users
            </Link>
          </div>
        </SurfacePanel>
      ) : null}

      <ProfileReviewsGrouped
        reviews={reviews as ProfileReviewForList[]}
        reviewTotalCount={reviewTotalCount}
      />
    </AppPageShell>
  );
}
