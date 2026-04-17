import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import {
  ProfileBlockedRenters,
  type BlockedRow,
} from "@/app/_components/profile-blocked-renters";
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
import { ProfileVerificationPanel } from "@/app/_components/profile-verification-panel";
import { ProfileSectionNav } from "@/app/_components/profile-section-nav";
import { authOptions } from "@/lib/auth";
import { messagesUiEnabled } from "@/lib/feature-flags";
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
  const supportEmail =
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    null;
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
      id: true,
      phoneVerified: true,
      displayName: true,
      bostonRentingSinceYear: true,
      retentionEmailsOptOut: true,
      messageEmailsOptOut: true,
    },
  });

  const blockedRenters: BlockedRow[] =
    user && messagesUiEnabled
      ? (
          await prisma.userBlock.findMany({
            where: { blockerId: user.id },
            orderBy: { createdAt: "desc" },
            select: {
              blockedUserId: true,
              blocked: { select: { email: true, displayName: true } },
            },
          })
        ).map((row) => ({
          blockedUserId: row.blockedUserId,
          email: row.blocked.email,
          displayName: row.blocked.displayName,
        }))
      : [];

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

  const mobileSectionShell =
    "-mx-4 bg-white px-4 py-5 sm:mx-0 sm:rounded-2xl sm:border sm:border-zinc-200/80 sm:bg-white sm:p-6 sm:shadow-[0_1px_2px_rgb(15_23_42/0.04)]";

  return (
    <AppPageShell className="max-sm:pt-0">
      {bostonRentingSinceYear == null ? (
        <ProfileBostonYearGate yearChoices={bostonYearChoices} />
      ) : null}
      <ProfileOnboardingOverlay
        fromSignup={fromSignupWelcome}
        displayName={displayName}
        reviewCount={reviews.length}
        bostonRentingSinceYear={bostonRentingSinceYear}
      />
      <div className="flex flex-col gap-5 sm:gap-8">
        <PageHeader
          className="pt-3 sm:order-1 sm:pt-0"
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
      </div>
      <ProfileSectionNav
        sections={[
          { id: "profile-account", label: "Account" },
          { id: "profile-reviews", label: "Reviews" },
          { id: "profile-saved", label: "Saved" },
          { id: "profile-privacy", label: "Privacy" },
        ]}
        supportEmail={supportEmail}
        className="sticky top-[calc(env(safe-area-inset-top,0px)+4.25rem)] z-20 w-full min-w-0 border-y border-zinc-200/80 bg-white/95 px-3 max-sm:py-1.5 backdrop-blur max-sm:-mx-[calc(0.5rem+1rem)] max-sm:w-[calc(100%+3rem)] max-sm:max-w-none sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"
      />
      {bostonRentingSinceYear != null &&
      eligibleYearsWithoutAnyReview.length > 0 ? (
        <section
          className={`-mx-4 bg-gradient-to-b from-muted-blue-tint/50 to-muted-blue-tint/25 px-4 py-5 sm:mx-0 sm:rounded-2xl sm:border sm:border-muted-blue/20 sm:p-6`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pop">
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
        </section>
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
          {isAdmin ? (
            <section className={mobileSectionShell}>
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
            </section>
          ) : null}

          <section id="profile-account" className="space-y-2 scroll-mt-24">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pop">
              Account
            </p>
          </section>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch lg:gap-6">
            <ProfileDisplayNameCard initialDisplayName={displayName} />
            <ProfileRetentionEmailPrefs
              initialOptOut={user?.retentionEmailsOptOut ?? false}
              initialMessageEmailsOptOut={user?.messageEmailsOptOut ?? false}
            />
            <ProfileVerificationPanel
              initialVerified={Boolean(user?.phoneVerified)}
            />
          </div>

          {messagesUiEnabled ? (
            <section className={mobileSectionShell} id="profile-privacy">
              <details className="group sm:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-muted-blue-hover [&::-webkit-details-marker]:hidden">
                  Blocked renters
                  <span className="text-zinc-400 transition group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  Accounts you block can&apos;t message you or vote on your reviews, and
                  you can&apos;t message or vote on theirs.
                </p>
                <div className="mt-4">
                  <ProfileBlockedRenters initialBlocks={blockedRenters} />
                </div>
              </details>
              <div className="hidden sm:block">
                <h2 className="text-base font-semibold text-muted-blue-hover">
                  Blocked renters
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Accounts you block can&apos;t message you or vote on your reviews, and
                  you can&apos;t message or vote on theirs.
                </p>
                <div className="mt-4">
                  <ProfileBlockedRenters initialBlocks={blockedRenters} />
                </div>
              </div>
            </section>
          ) : null}

          <section
            id="profile-saved"
            className={`${mobileSectionShell} scroll-mt-24 space-y-2 sm:space-y-0`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pop sm:hidden">
              Saved listings
            </p>
            <details className="group sm:hidden" open>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-end gap-2 text-muted-blue-hover [&::-webkit-details-marker]:hidden">
                <span className="sr-only">Show or hide saved listings</span>
                <span className="text-zinc-400 transition group-open:rotate-180" aria-hidden>
                  ▼
                </span>
              </summary>
              <div className="mt-3">
                <ProfileBookmarks />
              </div>
            </details>
            <div className="hidden sm:block">
              <h2 className="text-base font-semibold text-muted-blue-hover">
                Saved listings
              </h2>
              <div className="mt-3">
                <ProfileBookmarks />
              </div>
            </div>
          </section>

          <section id="profile-reviews" className="scroll-mt-24 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pop sm:hidden">
              Your reviews
            </p>
            <ProfileReviewsGrouped
              reviews={reviews as ProfileReviewForList[]}
              reviewTotalCount={reviewTotalCount}
            />
          </section>
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
