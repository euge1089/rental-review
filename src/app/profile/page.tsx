import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
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
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue">
            Profile
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-muted-blue-hover">
            Your profile
          </h1>
          <p className="text-sm text-zinc-600">
            You need to sign in to see your reviews and saved apartments.
          </p>
        </div>
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
  const rankRungs = [
    { need: 0, title: "Getting Started" },
    { need: 1, title: "Contributor" },
    { need: 2, title: "Verified" },
    { need: 3, title: "Established" },
    { need: 4, title: "Insider" },
    { need: 5, title: "Veteran Contributor" },
  ] as const;
  const currentRank =
    [...rankRungs].reverse().find((r) => reviewTotalCount >= r.need)?.title ??
    rankRungs[0].title;
  const nextRung = rankRungs.find((r) => r.need > reviewTotalCount) ?? null;

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
    <AppPageShell gapClass="gap-8">
      {bostonRentingSinceYear == null ? (
        <ProfileBostonYearGate yearChoices={bostonYearChoices} />
      ) : null}
      <ProfileOnboardingOverlay
        fromSignup={fromSignupWelcome}
        displayName={displayName}
        reviewCount={reviews.length}
        bostonRentingSinceYear={bostonRentingSinceYear}
      />
      <SurfacePanel
        variant="subtle"
        as="section"
        className="border border-zinc-200/80 bg-gradient-to-b from-muted-blue-tint/45 to-white p-6 sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue">
              Profile
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-muted-blue-hover sm:text-3xl">
              Your profile
            </h1>
            <p className="text-sm leading-relaxed text-zinc-600">
              Manage your reviews, saved apartments, and account details.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {user?.phoneVerified ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80">
                  SMS Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 ring-1 ring-zinc-200/80">
                  Not verified
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200/80">
                {reviewTotalCount} of {PRODUCT_POLICY.reviews.maxReviewsPerUser} review
                slots used
              </span>
            </div>
          </div>
          <Link
            href="/submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(21_42_69/0.35)] transition hover:bg-muted-blue-hover"
          >
            Write a review
          </Link>
        </div>
        {bostonRentingSinceYear != null &&
        eligibleYearsWithoutAnyReview.length > 0 ? (
          <p className="mt-4 border-t border-zinc-200/70 pt-3 text-xs text-zinc-600">
            You can still add reviews for lease-start years:{" "}
            <span className="font-medium text-zinc-800">
              {formatYearsForMessage(eligibleYearsWithoutAnyReview)}
            </span>
            .
          </p>
        ) : null}
      </SurfacePanel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <ProfileReviewsGrouped
            reviews={reviews as ProfileReviewForList[]}
            reviewTotalCount={reviewTotalCount}
          />

          <SurfacePanel variant="subtle" as="section" className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-muted-blue-hover">
                Saved apartments
              </h2>
            </div>
            <ProfileBookmarks />
          </SurfacePanel>
        </div>

        <div className="space-y-6">
          <SurfacePanel variant="subtle" as="section" className="space-y-4">
            <h2 className="text-lg font-semibold text-muted-blue-hover">
              Account & preferences
            </h2>
            <div className="space-y-4 divide-y divide-zinc-200/70">
              <div className="pb-4">
                <ProfileDisplayNameCard
                  initialDisplayName={displayName}
                  embedded
                />
              </div>
              <div className="pt-4">
                <p className="text-sm font-semibold text-muted-blue-hover">
                  Profile verification
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                  {user?.phoneVerified
                    ? "Verified via SMS. Reviews from verified users are shown as SMS verified and are usually approved more quickly."
                    : "Verify via SMS to get the SMS verified badge and speed up approval for new submissions."}
                </p>
                <div className="mt-3">
                  <ProfileVerification
                    initialVerified={Boolean(user?.phoneVerified)}
                  />
                </div>
              </div>
              <div className="pt-4">
                <ProfileRetentionEmailPrefs
                  initialOptOut={user?.retentionEmailsOptOut ?? false}
                  embedded
                />
              </div>
              {bostonRentingSinceYear != null ? (
                <div className="pt-4">
                  <p className="text-sm font-semibold text-muted-blue-hover">
                    Boston renting history
                  </p>
                  <p className="mt-1.5 text-sm text-zinc-600">
                    First rented in Boston:{" "}
                    <span className="font-semibold text-zinc-800">
                      {bostonRentingSinceYear}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    If this is incorrect, contact support. Admin edit only.
                  </p>
                </div>
              ) : null}
            </div>
          </SurfacePanel>

          <SurfacePanel variant="subtle" as="section" className="space-y-3">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Contributor progress
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-zinc-600">
                Current rank:{" "}
                <span className="font-semibold text-zinc-800">{currentRank}</span>
              </p>
              <p className="text-zinc-600">
                <span className="font-semibold text-zinc-800 tabular-nums">
                  {reviewTotalCount}
                </span>{" "}
                review{submissionPlural(reviewTotalCount)} submitted
              </p>
              <p className="text-zinc-600">
                Next rank:{" "}
                <span className="font-semibold text-zinc-800">
                  {nextRung
                    ? `${nextRung.title} at ${nextRung.need} reviews`
                    : "Top rank unlocked"}
                </span>
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200/70">
              <div
                className="h-full rounded-full bg-muted-blue transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (reviewTotalCount / PRODUCT_POLICY.reviews.maxReviewsPerUser) * 100,
                  )}%`,
                }}
              />
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
        </div>
      </div>
    </AppPageShell>
  );
}

function submissionPlural(n: number): string {
  return n === 1 ? "" : "s";
}
