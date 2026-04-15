import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { AppPageShell } from "@/app/_components/app-page-shell";
import { PropertyDetailHero } from "@/app/_components/property-detail-hero";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { bedroomCountToBand } from "@/lib/analytics";
import { bathroomsToPublicLabel } from "@/lib/policy";
import { ReportReviewButton } from "@/app/_components/report-review-button";
import { ReviewVoteButtons } from "@/app/_components/review-vote-buttons";
import { PropertyEngagement } from "@/app/_components/property-engagement";
import { linkMutedClass, surfaceElevatedClass } from "@/lib/ui-classes";

type Props = {
  params: Promise<{ id: string }>;
};

function reviewYearToPrivacyBucket(reviewYear: number | null): string {
  if (typeof reviewYear !== "number") return "Older experience (5+ years)";
  const nowYear = new Date().getFullYear();
  const yearsAgo = Math.max(0, nowYear - reviewYear);
  if (yearsAgo <= 2) return "Recent (within ~2 years)";
  if (yearsAgo <= 5) return "A few years ago (2-5 years)";
  return "Older experience (5+ years)";
}

/** Pipe-separated review meta; `monthlyRent` undefined omits rent (e.g. signed-out teaser). */
function ReviewMetadataLine({
  privacyYearBucket,
  monthlyRent,
  bedroomCount,
  bathPublicLabel,
}: {
  privacyYearBucket: string;
  monthlyRent?: number | null;
  bedroomCount: number | null;
  bathPublicLabel: string | null;
}) {
  const parts: ReactNode[] = [
    <span key="tp">
      <span className="font-medium text-zinc-700">Time period:</span>{" "}
      {privacyYearBucket}
    </span>,
  ];

  if (monthlyRent !== undefined) {
    parts.push(
      typeof monthlyRent === "number" ? (
        <span key="rent" className="tabular-nums">
          ${monthlyRent.toLocaleString()}/mo
        </span>
      ) : (
        <span key="rent" className="text-zinc-500">
          Rent not shared
        </span>
      ),
    );
  }

  if (bedroomCount != null) {
    parts.push(
      <span key="br">{bedroomCountToBand(bedroomCount)}</span>,
    );
  }

  if (bathPublicLabel) {
    parts.push(<span key="bath">{bathPublicLabel}</span>);
  }

  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm leading-relaxed text-zinc-600 sm:gap-x-4">
      {parts.flatMap((node, i) =>
        i === 0
          ? [node]
          : [
              <span
                key={`sep-${i}`}
                className="select-none px-1 font-bold text-zinc-400"
                aria-hidden
              >
                |
              </span>,
              node,
            ],
      )}
    </p>
  );
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      reviews: {
        where: { moderationStatus: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              phoneVerified: true,
            },
          },
        },
      },
    },
  });

  if (!property) {
    return (
      <AppPageShell gapClass="gap-6">
        <div
          className={`${surfaceElevatedClass} mx-auto max-w-lg p-8 text-center sm:p-10`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-blue">
            Property
          </p>
          <h1 className="mt-3 text-xl font-semibold text-muted-blue-hover">
            We couldn&apos;t find that address
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            It may have been removed or the link is outdated.
          </p>
          <Link
            href="/properties"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-muted-blue-hover"
          >
            Browse addresses
          </Link>
        </div>
      </AppPageShell>
    );
  }

  const isSignedIn = Boolean(session?.user?.email);
  const reviewIds = property?.reviews.map((r) => r.id) ?? [];

  const viewerRow =
    isSignedIn && session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

  const authorIds = [...new Set(property.reviews.map((r) => r.user.id))];

  const [voteGroups, myVoteRows, blockedWithAuthorIds] = await Promise.all([
    reviewIds.length > 0
      ? prisma.reviewVote.groupBy({
          by: ["reviewId"],
          where: { reviewId: { in: reviewIds }, value: 1 },
          _count: { _all: true },
        })
      : Promise.resolve(
          [] as {
            reviewId: string;
            _count: { _all: number };
          }[],
        ),
    reviewIds.length > 0 && viewerRow
      ? prisma.reviewVote.findMany({
          where: { userId: viewerRow.id, reviewId: { in: reviewIds }, value: 1 },
          select: { reviewId: true, value: true },
        })
      : Promise.resolve([]),
    viewerRow && authorIds.length > 0
      ? prisma.userBlock.findMany({
          where: {
            OR: [
              { blockerId: viewerRow.id, blockedUserId: { in: authorIds } },
              { blockedUserId: viewerRow.id, blockerId: { in: authorIds } },
            ],
          },
          select: { blockerId: true, blockedUserId: true },
        })
      : Promise.resolve([]),
  ]);

  const voteTally = new Map<string, number>();
  for (const rid of reviewIds) {
    voteTally.set(rid, 0);
  }
  for (const row of voteGroups) {
    voteTally.set(row.reviewId, row._count._all);
  }
  const myVoteByReviewId = new Map<string, number>();
  for (const v of myVoteRows) {
    if (v.value === 1) myVoteByReviewId.set(v.reviewId, 1);
  }

  const blockedWithAuthor = new Set<string>();
  for (const b of blockedWithAuthorIds) {
    blockedWithAuthor.add(
      b.blockerId === viewerRow?.id ? b.blockedUserId : b.blockerId,
    );
  }

  return (
    <AppPageShell gapClass="gap-8 sm:gap-10">
      <PropertyDetailHero
        addressLine1={property.addressLine1}
        city={property.city}
        state={property.state}
        postalCode={property.postalCode}
        reviewCount={property.reviews.length}
        engagementSlot={
          isSignedIn ? (
            <PropertyEngagement
              propertyId={property.id}
              addressLine1={property.addressLine1}
              city={property.city}
              state={property.state}
              postalCode={property.postalCode}
            />
          ) : null
        }
      />

      {property.reviews.length === 0 ? (
        <div
          className={`${surfaceElevatedClass} flex flex-col items-center gap-4 p-10 text-center`}
        >
          <p className="text-sm font-medium text-muted-blue-hover">
            No reviews here yet
          </p>
          <p className="max-w-md text-sm text-zinc-600">
            Be the first to share a lease-year snapshot for this address - it helps the
            next person negotiating rent.
          </p>
          <Link
            href="/submit"
            className="inline-flex min-h-11 items-center rounded-full bg-pop px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(219_120_55/0.4)] transition hover:bg-pop-hover"
          >
            Submit a review
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-blue">
            Real renter reviews
          </p>
          <h2 className="text-lg font-semibold text-muted-blue-hover sm:text-xl">
            Reviews ({property.reviews.length})
          </h2>

          {isSignedIn ? (
            <ul className="space-y-5 pt-2">
              {property.reviews.map((review) => {
                const privacyYearBucket = reviewYearToPrivacyBucket(review.reviewYear);

                const amenities = [
                  {
                    key: "hasParking",
                    label: "Parking",
                    value: review.hasParking,
                  },
                  {
                    key: "hasCentralHeatCooling",
                    label: "Central HVAC",
                    value: review.hasCentralHeatCooling,
                  },
                  {
                    key: "hasInUnitLaundry",
                    label: "In-unit laundry",
                    value: review.hasInUnitLaundry,
                  },
                  {
                    key: "hasStorageSpace",
                    label: "Storage",
                    value: review.hasStorageSpace,
                  },
                  {
                    key: "hasOutdoorSpace",
                    label: "Outdoor space",
                    value: review.hasOutdoorSpace,
                  },
                  {
                    key: "petFriendly",
                    label: "Pet-friendly",
                    value: review.petFriendly,
                  },
                ] as const;

                const fullText = review.body ?? "";
                const textToShow = fullText || "No written review.";

                const maskedName = "Anonymous renter";
                const bathPublicLabel = bathroomsToPublicLabel(review.bathrooms);

                return (
                  <li
                    key={review.id}
                    className={`${surfaceElevatedClass} relative overflow-hidden p-5 sm:p-6`}
                  >
                    <div
                      className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-pop/30 to-transparent sm:inset-x-8"
                      aria-hidden
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-muted-blue-hover">
                          {property.addressLine1}
                          {review.unit ? (
                            <span className="font-normal text-zinc-500">
                              {" "}
                              · Unit {review.unit}
                            </span>
                          ) : null}
                        </p>
                        <ReviewMetadataLine
                          privacyYearBucket={privacyYearBucket}
                          monthlyRent={review.monthlyRent}
                          bedroomCount={review.bedroomCount}
                          bathPublicLabel={bathPublicLabel}
                        />
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-sm text-zinc-500">By {maskedName}</span>
                          {review.user.phoneVerified && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80">
                              SMS verified
                            </span>
                          )}
                        </div>
                      </div>

                      {(typeof review.overallScore === "number" ||
                        typeof review.landlordScore === "number") && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {typeof review.overallScore === "number" ? (
                            <span className="rounded-full bg-muted-blue-tint px-3.5 py-1.5 text-sm font-semibold tabular-nums text-muted-blue-hover ring-1 ring-zinc-200/60 sm:text-base sm:px-4 sm:py-2">
                              Overall {review.overallScore}/10
                            </span>
                          ) : null}
                          {typeof review.landlordScore === "number" ? (
                            <span className="rounded-full bg-accent-teal-tint px-3.5 py-1.5 text-sm font-semibold tabular-nums text-teal-900 ring-1 ring-teal-200/60 sm:text-base sm:px-4 sm:py-2">
                              Landlord {review.landlordScore}/10
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 border-t border-zinc-100 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Amenities reported
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {amenities.map((amenity) => (
                          <span
                            key={amenity.key}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                              amenity.value
                                ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/70"
                                : "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200/80"
                            }`}
                          >
                            <span aria-hidden>{amenity.value ? "✓" : "-"}</span>
                            {amenity.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      {fullText ? (
                        <p className="text-sm leading-relaxed text-zinc-800">
                          {textToShow}
                        </p>
                      ) : (
                        <p className="text-sm text-zinc-500">No written review.</p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      {viewerRow && viewerRow.id !== review.user.id ? (
                        <ReviewVoteButtons
                          reviewId={review.id}
                          initialUp={voteTally.get(review.id) ?? 0}
                          initialMyVote={myVoteByReviewId.get(review.id) ?? null}
                          disabled={blockedWithAuthor.has(review.user.id)}
                        />
                      ) : (
                        <p className="text-xs text-zinc-500">
                          <span className="font-semibold tabular-nums text-zinc-700">
                            {voteTally.get(review.id) ?? 0}
                          </span>{" "}
                          marked helpful
                          {viewerRow?.id === review.user.id
                            ? " (others can vote on your review)"
                            : null}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        {viewerRow &&
                        viewerRow.id !== review.user.id &&
                        !blockedWithAuthor.has(review.user.id) ? (
                          <Link
                            href={`/messages/review/${review.id}`}
                            className="inline-flex min-h-10 items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
                          >
                            Message the author
                          </Link>
                        ) : null}
                        <ReportReviewButton reviewId={review.id} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="relative pt-2">
              <p className="sr-only">
                {property.reviews.length}{" "}
                {property.reviews.length === 1 ? "review" : "reviews"} at this
                address. Sign in to read full details.
              </p>
              <ul
                className="pointer-events-none select-none space-y-5 blur-md sm:blur-lg"
                aria-hidden
              >
                {property.reviews.map((review) => {
                  const privacyYearBucket = reviewYearToPrivacyBucket(review.reviewYear);
                  const maskedName = "Anonymous renter";
                  const bathPublicLabel = bathroomsToPublicLabel(review.bathrooms);
                  const amenityLabels = [
                    "Parking",
                    "Central HVAC",
                    "In-unit laundry",
                    "Storage",
                    "Outdoor space",
                    "Pet-friendly",
                  ] as const;

                  return (
                    <li
                      key={review.id}
                      className={`${surfaceElevatedClass} relative overflow-hidden p-5 sm:p-6`}
                    >
                      <div
                        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-pop/30 to-transparent sm:inset-x-8"
                        aria-hidden
                      />

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-muted-blue-hover">
                            {property.addressLine1}
                            {review.unit ? (
                              <span className="font-normal text-zinc-500">
                                {" "}
                                · Unit {review.unit}
                              </span>
                            ) : null}
                          </p>
                          <ReviewMetadataLine
                            privacyYearBucket={privacyYearBucket}
                            bedroomCount={review.bedroomCount}
                            bathPublicLabel={bathPublicLabel}
                          />
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-sm text-zinc-500">By {maskedName}</span>
                            {review.user.phoneVerified && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80">
                                SMS verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <span className="h-9 w-32 rounded-full bg-zinc-200/90 ring-1 ring-zinc-200/80" />
                          <span className="h-9 w-36 rounded-full bg-zinc-200/90 ring-1 ring-zinc-200/80" />
                        </div>
                      </div>

                      <div className="mt-4 border-t border-zinc-100 pt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Amenities reported
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {amenityLabels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex h-8 min-w-[5.5rem] rounded-full bg-zinc-200/80 ring-1 ring-zinc-200/70"
                              aria-hidden
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <span className="block h-3 w-full max-w-md rounded-full bg-zinc-200/90" />
                        <span className="block h-3 w-[92%] max-w-md rounded-full bg-zinc-200/90" />
                        <span className="block h-3 w-[78%] max-w-md rounded-full bg-zinc-200/90" />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div
                className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-gradient-to-b from-white/55 via-white/65 to-muted-blue-tint/40 px-4 py-10 backdrop-blur-[2px] sm:px-6"
                role="region"
                aria-label="Sign in to view reviews"
              >
                <div
                  className={`${surfaceElevatedClass} max-w-md px-6 py-7 text-center shadow-elevated sm:px-8 sm:py-8`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-blue">
                    Members only
                  </p>
                  <p className="mt-3 text-lg font-semibold tracking-tight text-muted-blue-hover">
                    Sign in to read full reviews
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Create a free account or sign in to unlock full review text, scores,
                    rent details, and amenity answers for this address.
                  </p>
                  <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                    <Link
                      href={`/signin?callbackUrl=${encodeURIComponent(`/properties/${property.id}`)}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-muted-blue-hover"
                    >
                      Sign in
                    </Link>
                    <Link
                      href={`/signin?callbackUrl=${encodeURIComponent(`/properties/${property.id}`)}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-muted-blue-hover shadow-sm transition hover:border-muted-blue/25 hover:bg-muted-blue-tint/40"
                    >
                      Create account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-zinc-500 sm:text-left">
        <Link href="/properties" className={linkMutedClass}>
          ← Back to all properties
        </Link>
      </p>
    </AppPageShell>
  );
}
