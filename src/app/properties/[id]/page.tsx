import Link from "next/link";
import { getServerSession } from "next-auth";
import { AppPageShell } from "@/app/_components/app-page-shell";
import { PropertyDetailHero } from "@/app/_components/property-detail-hero";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  bedroomCountToBand,
  getPropertyRentStats,
  getSouthBostonRentBands,
} from "@/lib/analytics";
import { ReportReviewButton } from "@/app/_components/report-review-button";
import { PropertyEngagement } from "@/app/_components/property-engagement";
import {
  linkInlineClass,
  linkMutedClass,
  surfaceElevatedClass,
} from "@/lib/ui-classes";

function maskReviewerName(displayName: string | null, email: string | null): string {
  const source = displayName?.trim() || email?.split("@")[0] || "";
  if (!source) return "Renter";

  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "";
  const last = parts[1] ?? "";

  if (!first && !last) return "Renter";

  const firstInitial = first[0]?.toUpperCase() ?? "";
  const lastInitial = last[0]?.toUpperCase() ?? "";

  if (!lastInitial) {
    return `${firstInitial}***`;
  }

  return `${firstInitial}*** ${lastInitial}.`;
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [property, rentStats, southBostonBands] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { displayName: true, email: true, phoneVerified: true },
            },
          },
        },
      },
    }),
    getPropertyRentStats(id),
    getSouthBostonRentBands(),
  ]);

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
  const hasMeaningfulRentStats =
    rentStats.length > 0 &&
    rentStats.some(
      (row) =>
        row.bedroomCount !== "Unknown" && typeof row.median === "number",
    );

  return (
    <AppPageShell gapClass="gap-8 sm:gap-10">
      <PropertyDetailHero
        addressLine1={property.addressLine1}
        city={property.city}
        state={property.state}
        postalCode={property.postalCode}
        reviewCount={property.reviews.length}
      />

      {hasMeaningfulRentStats ? (
        <section
          className={`${surfaceElevatedClass} relative overflow-hidden p-5 sm:p-7 md:p-8`}
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-muted-blue/25 to-transparent"
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-24 top-12 h-56 w-56 rounded-full bg-accent-teal-tint/40 blur-3xl" />

          <div className="relative space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-blue">
              Rent signals
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-muted-blue-hover sm:text-xl">
              What other renters have paid here
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">
              Approximate monthly rent by bedroom band from approved reviews. Use this
              to sanity-check an asking price — not as an appraisal.
            </p>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
            {rentStats.map((row) => (
              <div
                key={row.bedroomCount}
                className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-gradient-to-br from-white to-muted-blue-tint/30 px-4 py-3.5 transition hover:border-muted-blue/20 hover:shadow-elevated-hover"
              >
                <span className="shrink-0 text-sm font-semibold text-muted-blue-hover">
                  {row.bedroomCount}
                </span>
                {typeof row.median === "number" ? (
                  isSignedIn ? (
                    <span className="min-w-0 text-right text-sm tabular-nums text-zinc-800">
                      <span className="font-semibold text-muted-blue-hover">
                        ${row.median.toLocaleString()}
                      </span>
                      <span className="text-zinc-500"> / mo</span>
                      {typeof row.min === "number" && typeof row.max === "number" ? (
                        <span className="mt-0.5 block text-xs font-normal text-zinc-400">
                          Range ${row.min.toLocaleString()}–$
                          {row.max.toLocaleString()}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-right text-xs text-zinc-400">
                      Sign in for amounts
                    </span>
                  )
                ) : (
                  <span className="text-xs text-zinc-400">Not enough data</span>
                )}
              </div>
            ))}
          </div>

          {southBostonBands.length > 0 ? (
            <div className="relative mt-6 rounded-2xl border border-accent-coral/20 bg-gradient-to-br from-accent-coral-tint/80 to-white px-4 py-4 sm:px-5">
              <p className="text-sm font-semibold text-muted-blue-hover">
                South Boston context
              </p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-zinc-700">
                {rentStats.map((row) => {
                  const hood = southBostonBands.find(
                    (b) => b.bedroomCount === row.bedroomCount,
                  );
                  if (!hood || typeof row.median !== "number" || !hood.median) {
                    return null;
                  }
                  const diff = row.median - hood.median;
                  const abs = Math.abs(diff);
                  if (abs === 0) {
                    return (
                      <li key={row.bedroomCount} className="flex gap-2">
                        <span className="text-accent-teal" aria-hidden>
                          ◆
                        </span>
                        <span>
                          <strong>{row.bedroomCount}:</strong> in line with the South
                          Boston median.
                        </span>
                      </li>
                    );
                  }
                  const direction = diff > 0 ? "above" : "below";
                  return (
                    <li key={row.bedroomCount} className="flex gap-2">
                      <span className="text-pop" aria-hidden>
                        ◆
                      </span>
                      <span>
                        <strong>{row.bedroomCount}:</strong>{" "}
                        {isSignedIn ? (
                          <>
                            about <strong>${abs.toLocaleString()}</strong> {direction}{" "}
                            South Boston&apos;s median.
                          </>
                        ) : (
                          <span className="text-zinc-500">
                            Sign in to see comparison to South Boston medians.
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {!isSignedIn && (
            <p className="relative mt-4 text-sm text-zinc-500">
              <Link href="/signin" className={linkInlineClass}>
                Sign in
              </Link>{" "}
              to unlock exact rent figures for this building.
            </p>
          )}
        </section>
      ) : null}

      {isSignedIn ? (
        <PropertyEngagement
          propertyId={property.id}
          addressLine1={property.addressLine1}
          city={property.city}
          state={property.state}
          postalCode={property.postalCode}
        />
      ) : null}

      <section
        className={`${surfaceElevatedClass} relative overflow-hidden border-l-4 border-l-accent-teal p-5 sm:p-6`}
      >
        <div className="pointer-events-none absolute -right-20 bottom-0 h-32 w-32 rounded-full bg-accent-teal-tint/50 blur-2xl" />
        <div className="relative text-sm leading-relaxed text-zinc-700">
          {isSignedIn ? (
            <>
              <p className="font-medium text-muted-blue-hover">
                You&apos;re signed in — full detail mode
              </p>
              <p className="mt-2 text-zinc-600">
                Read complete reviews, scores, and amenities below.{" "}
                <Link href="/submit" className={linkInlineClass}>
                  Add your own review
                </Link>{" "}
                to grow the signal for the next renter.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-muted-blue-hover">
                Teaser view — sign in for the full picture
              </p>
              <p className="mt-2 text-zinc-600">
                <Link href="/signin" className={linkInlineClass}>
                  Sign in
                </Link>{" "}
                for full review text, exact rents, amenity answers, and scores from past
                renters.
              </p>
            </>
          )}
        </div>
      </section>

      {property.reviews.length === 0 ? (
        <div
          className={`${surfaceElevatedClass} flex flex-col items-center gap-4 p-10 text-center`}
        >
          <p className="text-sm font-medium text-muted-blue-hover">
            No reviews here yet
          </p>
          <p className="max-w-md text-sm text-zinc-600">
            Be the first to share a lease-year snapshot for this address — it helps the
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
                const yearLabel = review.reviewYear ?? "Year not set";

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

                const maskedName = review.displayFullyAnonymous
                  ? "Anonymous renter"
                  : maskReviewerName(
                      review.user.displayName,
                      review.user.email,
                    );

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
                        <p className="text-xs text-zinc-600">
                          Lease year {yearLabel}
                          {typeof review.monthlyRent === "number"
                            ? ` · $${review.monthlyRent.toLocaleString()}/mo`
                            : " · Rent not shared"}
                          {review.bedroomCount != null
                            ? ` · ${bedroomCountToBand(review.bedroomCount)}`
                            : ""}
                          {typeof review.bathrooms === "number"
                            ? ` · ${review.bathrooms} bath${
                                review.bathrooms === 1 ? "" : "s"
                              }`
                            : ""}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-xs text-zinc-500">By {maskedName}</span>
                          {review.user.phoneVerified && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80">
                              Verified renter
                            </span>
                          )}
                        </div>
                      </div>

                      {(typeof review.overallScore === "number" ||
                        typeof review.landlordScore === "number") && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {typeof review.overallScore === "number" ? (
                            <span className="rounded-full bg-muted-blue-tint px-3 py-1 text-xs font-semibold tabular-nums text-muted-blue-hover ring-1 ring-zinc-200/60">
                              Overall {review.overallScore}/10
                            </span>
                          ) : null}
                          {typeof review.landlordScore === "number" ? (
                            <span className="rounded-full bg-accent-teal-tint px-3 py-1 text-xs font-semibold tabular-nums text-teal-900 ring-1 ring-teal-200/60">
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
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                              amenity.value
                                ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/70"
                                : "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200/80"
                            }`}
                          >
                            <span aria-hidden>{amenity.value ? "✓" : "—"}</span>
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

                    <div className="mt-3">
                      <ReportReviewButton reviewId={review.id} />
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
                  const yearLabel = review.reviewYear ?? "Year not set";
                  const maskedName = review.displayFullyAnonymous
                    ? "Anonymous renter"
                    : maskReviewerName(
                        review.user.displayName,
                        review.user.email,
                      );
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
                          <p className="text-xs text-zinc-600">
                            Lease year {yearLabel}
                            {review.bedroomCount != null
                              ? ` · ${bedroomCountToBand(review.bedroomCount)}`
                              : ""}
                            {typeof review.bathrooms === "number"
                              ? ` · ${review.bathrooms} bath${
                                  review.bathrooms === 1 ? "" : "s"
                                }`
                              : ""}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-xs text-zinc-500">By {maskedName}</span>
                            {review.user.phoneVerified && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80">
                                Verified renter
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <span className="h-7 w-28 rounded-full bg-zinc-200/90 ring-1 ring-zinc-200/80" />
                          <span className="h-7 w-32 rounded-full bg-zinc-200/90 ring-1 ring-zinc-200/80" />
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
