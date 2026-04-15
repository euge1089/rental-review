import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { ProfileBookmarks } from "@/app/_components/profile-bookmarks";
import { ProfileDisplayNameCard } from "@/app/_components/profile-display-name-card";
import { ProfileRetentionEmailPrefs } from "@/app/_components/profile-retention-email-prefs";
import { ProfileOnboardingOverlay } from "@/app/_components/profile-onboarding-overlay";
import {
  ProfileReviewsGrouped,
  type ProfileReviewForList,
} from "@/app/_components/profile-reviews-grouped";
import { ProfileBostonYearGate } from "@/app/_components/profile-boston-year-gate";
import { ProfileContributorLadder } from "@/app/_components/profile-contributor-ladder";
import { ProfileVerification } from "@/app/_components/profile-verification";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getBostonRentingSinceYearChoices,
  PRODUCT_POLICY,
  reviewYearsAllowedForUser,
} from "@/lib/policy";
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
    select: {
      phoneVerified: true,
      displayName: true,
      bostonRentingSinceYear: true,
      retentionEmailsOptOut: true,
      messageEmailsOptOut: true,
    },
  });

  const bostonYearChoices = getBostonRentingSinceYearChoices();
  const bostonRentingSinceYear = user?.bostonRentingSinceYear ?? null;

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

  const allowedLeaseYearsForProfile =
    bostonRentingSinceYear != null
      ? reviewYearsAllowedForUser(bostonRentingSinceYear)
      : [];
  const reviewYearsCovered = new Set(reviews.map((r) => r.reviewYear));
  const eligibleYearsWithoutAnyReview = allowedLeaseYearsForProfile.filter(
    (y) => !reviewYearsCovered.has(y),
  );

  function formatYearsForMessage(years: number[]): string {
    const desc = [...years].sort((a, b) => b - a);
    if (desc.length <= 4) return desc.join(", ");
    return `${desc.slice(0, 3).join(", ")}, +${desc.length - 3} more`;
  }

  return (
    <AppPageShell>
      {bostonRentingSinceYear == null ? (
        <ProfileBostonYearGate yearChoices={bostonYearChoices} />
      ) : null}
      <ProfileOnboardingOverlay
        fromSignup={fromSignupWelcome}
        displayName={displayName}
        reviewCount={reviews.length}
        bostonRentingSinceYear={bostonRentingSinceYear}
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
                <span className="text-zinc-500"> ({email})</span>
              ) : null}
              .
            </span>
            {user?.phoneVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-600/15">
                SMS verified
              </span>
            ) : null}
          </div>
        }
      />
      {bostonRentingSinceYear != null &&
      eligibleYearsWithoutAnyReview.length > 0 ? (
        <SurfacePanel
          variant="subtle"
          as="section"
          className="border border-muted-blue/20 bg-gradient-to-b from-muted-blue-tint/50 to-muted-blue-tint/25"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-blue">
                Grow your impact
              </p>
              <p className="mt-2 text-base font-semibold leading-snug text-muted-blue-hover">
                Ready to help the next renter?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                We don&apos;t see a review yet for every lease-start year you&apos;re allowed
                to share since{" "}
                <span className="font-medium text-zinc-900">
                  {bostonRentingSinceYear}
                </span>
                . Examples:{" "}
                <span className="font-medium text-zinc-900">
                  {formatYearsForMessage(eligibleYearsWithoutAnyReview)}
                </span>
                .
              </p>
            </div>
            <Link
              href="/submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-muted-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-muted-blue-hover"
            >
              Add a review
            </Link>
          </div>
        </SurfacePanel>
      ) : null}

      <div
        className={
          bostonRentingSinceYear != null
            ? "flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_19.5rem]"
            : "space-y-5"
        }
      >
        <div
          className={
            bostonRentingSinceYear != null
              ? "order-2 min-w-0 space-y-5 lg:order-1"
              : "space-y-5"
          }
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6">
            <div className="min-w-0 flex-1 space-y-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:space-y-5">
              <ProfileDisplayNameCard initialDisplayName={displayName} />
              <ProfileRetentionEmailPrefs
                initialOptOut={user?.retentionEmailsOptOut ?? false}
                initialMessageEmailsOptOut={user?.messageEmailsOptOut ?? false}
              />
            </div>
            <div className="lg:flex lg:h-full lg:min-h-0 lg:w-[min(100%,22rem)] lg:shrink-0 lg:flex-col">
              <SurfacePanel
                variant="subtle"
                as="section"
                id="verification"
                className={`scroll-mt-24 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col ${
                  user?.phoneVerified
                    ? "!border-emerald-200/70 !bg-emerald-50/50 px-4 py-3.5 sm:px-5 sm:py-4 md:px-5 md:py-4"
                    : ""
                }`}
              >
              <h2 className="text-base font-semibold text-muted-blue-hover">
                Profile verification
              </h2>
              {!user?.phoneVerified ? (
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  After SMS verification, your reviews can show SMS verified and are
                  often approved faster.
                </p>
              ) : null}
              <div
                className={`min-h-0 lg:flex-1 lg:flex lg:flex-col ${
                  user?.phoneVerified ? "mt-2" : "mt-3"
                }`}
              >
                <ProfileVerification
                  initialVerified={Boolean(user?.phoneVerified)}
                />
              </div>
            </SurfacePanel>
            </div>
          </div>

          <SurfacePanel variant="subtle" as="section">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Saved apartments
            </h2>
            <div className="mt-3">
              <ProfileBookmarks />
            </div>
          </SurfacePanel>

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
        </div>

        {bostonRentingSinceYear != null ? (
          <ProfileContributorLadder
            className="order-1 lg:sticky lg:top-28 lg:order-2 lg:self-start"
            reviewCount={reviewTotalCount}
            maxReviews={PRODUCT_POLICY.reviews.maxReviewsPerUser}
          />
        ) : null}
      </div>
    </AppPageShell>
  );
}
