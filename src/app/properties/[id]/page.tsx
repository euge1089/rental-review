import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  bedroomCountToBand,
  getPropertyRentStats,
  getSouthBostonRentBands,
} from "@/lib/analytics";
import { ReportReviewButton } from "@/app/_components/report-review-button";
import { PropertyEngagement } from "@/app/_components/property-engagement";
import { linkMutedClass, surfaceSubtleClass } from "@/lib/ui-classes";

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
      <AppPageShell gapClass="gap-4">
        <PageHeader title="Not found" eyebrow="Property" />
        <p className="text-sm text-zinc-600">
          We could not find this address. It may have been removed or never existed.
        </p>
        <Link href="/" className={linkMutedClass}>
          Back to home
        </Link>
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
    <AppPageShell gapClass="gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Property"
          title={property.addressLine1}
          description={`${property.city}, ${property.state} ${property.postalCode ?? ""}`}
        />
        <Link
          href="/properties"
          className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-muted-blue-hover shadow-sm transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 sm:min-h-0 sm:py-2"
        >
          ← Back to browse
        </Link>
      </div>

      {hasMeaningfulRentStats ? (
        <section className={`${surfaceSubtleClass} p-4 text-sm text-zinc-700 sm:p-5`}>
          <h2 className="text-sm font-semibold text-muted-blue-hover">
            What other renters have paid here
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Approximate monthly rent by bedroom band based on approved reviews for this
            apartment. Use this to sanity-check a current asking price.
          </p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            {rentStats.map((row) => (
              <div
                key={row.bedroomCount}
                className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-200/70 bg-muted-blue-tint/40 px-3 py-2"
              >
                <span className="min-w-0 shrink font-medium text-zinc-800">
                  {row.bedroomCount}
                </span>
                {typeof row.median === "number" ? (
                  isSignedIn ? (
                    <span className="min-w-0 text-right text-zinc-700 tabular-nums">
                      ${row.median.toLocaleString()}{" "}
                      <span className="text-zinc-400">
                        {typeof row.min === "number" && typeof row.max === "number"
                          ? `(range $${row.min.toLocaleString()}–$${row.max.toLocaleString()})`
                          : null}
                      </span>
                    </span>
                  ) : (
                    <span className="text-zinc-400">
                      Sign in to see exact rent numbers
                    </span>
                  )
                ) : (
                  <span className="text-zinc-400">Not enough data yet</span>
                )}
              </div>
            ))}
          </div>

          {southBostonBands.length > 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p className="font-medium">
                How this apartment compares to South Boston
              </p>
              <ul className="mt-1 space-y-1">
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
                      <li key={row.bedroomCount}>
                        {row.bedroomCount}: roughly in line with South Boston median.
                      </li>
                    );
                  }
                  const direction = diff > 0 ? "above" : "below";
                  return (
                    <li key={row.bedroomCount}>
                      {row.bedroomCount}:{" "}
                      {isSignedIn ? (
                        <>about ${abs.toLocaleString()} {direction} the South Boston median.</>
                      ) : (
                        <span className="text-amber-800">
                          Sign in to see how this compares to South Boston medians.
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {!isSignedIn && (
            <p className="mt-2 text-xs text-zinc-500">
              Sign in with Google to unlock exact rent numbers for this apartment.
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

      <section className={`${surfaceSubtleClass} p-4 text-sm text-zinc-700 sm:p-5`}>
        {isSignedIn ? (
          <p>
            You&apos;re signed in. You can see full review text and structured details.{" "}
            <Link href="/submit" className="underline">
              Add your own review
            </Link>
            .
          </p>
        ) : (
          <p>
            You&apos;re seeing a blurred view of the detailed data.{" "}
            <span className="font-medium">
              <Link href="/signin" className="underline">
                Sign in with Google
              </Link>{" "}
              to unlock full reviews, exact rents, and amenity details for this apartment.
            </span>
          </p>
        )}
      </section>

      {property.reviews.length === 0 ? (
        <p className="text-zinc-600">No reviews yet for this address.</p>
      ) : (
        <ul className="space-y-4">
          {property.reviews.map((review) => {
            const yearLabel = review.reviewYear ?? "Year not set";

            const amenities = [
              {
                key: "hasParking",
                label: "Parking (off-street, garage, etc.)",
                value: review.hasParking,
              },
              {
                key: "hasCentralHeatCooling",
                label: "Central heating / cooling",
                value: review.hasCentralHeatCooling,
              },
              {
                key: "hasInUnitLaundry",
                label: "In-unit laundry",
                value: review.hasInUnitLaundry,
              },
              {
                key: "hasStorageSpace",
                label: "Storage room / closet",
                value: review.hasStorageSpace,
              },
              {
                key: "hasOutdoorSpace",
                label: "Outdoor space (yard, balcony, roof, etc.)",
                value: review.hasOutdoorSpace,
              },
              {
                key: "petFriendly",
                label: "Pet friendly",
                value: review.petFriendly,
              },
            ] as const;

            const fullText = review.body ?? "";
            const teaser =
              fullText.length > 140 ? `${fullText.slice(0, 140)}…` : fullText;

            const textToShow = isSignedIn ? fullText || "No written review." : teaser;

            const maskedName = review.displayFullyAnonymous
              ? "Anonymous renter"
              : maskReviewerName(
                  review.user.displayName,
                  review.user.email,
                );

            return (
              <li
                key={review.id}
                className={`${surfaceSubtleClass} p-4 text-sm text-zinc-800 sm:p-5`}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-zinc-900">
                    {property.addressLine1}
                    {review.unit ? `, Unit ${review.unit}` : null}
                  </p>
                  <p className="text-xs text-zinc-600">
                    Lease start year: {yearLabel} ·{" "}
                    {typeof review.monthlyRent === "number"
                      ? isSignedIn
                        ? `$${review.monthlyRent.toLocaleString()} / month`
                        : "Sign in to see monthly rent"
                      : "Rent not provided"}
                    {review.bedroomCount != null
                      ? ` · ${bedroomCountToBand(review.bedroomCount)}`
                      : ""}
                    {typeof review.bathrooms === "number"
                      ? ` · ${review.bathrooms} bath${
                          review.bathrooms === 1 ? "" : "s"
                        }`
                      : ""}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>By {maskedName}</span>
                    {review.user.phoneVerified && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                        Verified renter
                      </span>
                    )}
                  </p>
                </div>
                <div className="mt-2 grid gap-1 border-y border-zinc-100 py-2 text-xs text-zinc-700">
                  <p className="font-medium text-zinc-600">Amenities reported</p>
                  {isSignedIn ? (
                    <div className="grid gap-1 sm:grid-cols-2">
                      {amenities.map((amenity) => (
                        <div key={amenity.key} className="flex items-center gap-2">
                          {amenity.value ? (
                            <>
                              <span className="text-[11px] font-semibold text-emerald-600">
                                ✓
                              </span>
                              <span className="text-[11px] text-emerald-700">Yes</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[11px] text-zinc-300">–</span>
                              <span className="text-[11px] text-zinc-400">No</span>
                            </>
                          )}
                          <span className="text-[11px] text-zinc-600">
                            {amenity.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      Sign in to see how past renters answered amenity questions for this
                      apartment.
                    </p>
                  )}
                </div>
                {(typeof review.overallScore === "number" ||
                  typeof review.landlordScore === "number") &&
                  (isSignedIn ? (
                    <p className="mt-1 text-xs text-zinc-600">
                      {typeof review.overallScore === "number"
                        ? `Overall: ${review.overallScore}/10`
                        : null}
                      {typeof review.overallScore === "number" &&
                      typeof review.landlordScore === "number"
                        ? " · "
                        : " "}
                      {typeof review.landlordScore === "number"
                        ? `Landlord: ${review.landlordScore}/10`
                        : null}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-500">
                      Sign in to see overall and landlord scores from past renters.
                    </p>
                  ))}
                {fullText ? (
                  isSignedIn ? (
                    <p className="mt-2 leading-6">{fullText}</p>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">
                      Review text is available for this apartment.{" "}
                      <span className="font-medium">
                        Sign in with Google to read what past renters wrote.
                      </span>
                    </p>
                  )
                ) : (
                  <p className="mt-2 text-zinc-500">No written review.</p>
                )}
                <ReportReviewButton reviewId={review.id} />
              </li>
            );
          })}
        </ul>
      )}
    </AppPageShell>
  );
}

