import Link from "next/link";
import type { ModerationStatus } from "@prisma/client";
import { ProfileAddAnotherLeaseYearButton } from "@/app/_components/profile-add-another-year-button";
import { PRODUCT_POLICY } from "@/lib/policy";
import { linkInlineClass, surfaceElevatedClass } from "@/lib/ui-classes";

export type ProfileReviewForList = {
  id: string;
  propertyId: string;
  reviewYear: number;
  monthlyRent: number | null;
  body: string | null;
  moderationStatus: ModerationStatus;
  unit: string | null;
  bedroomCount: number | null;
  bathrooms: number | null;
  hasParking: boolean;
  hasCentralHeatCooling: boolean;
  hasInUnitLaundry: boolean;
  hasStorageSpace: boolean;
  hasOutdoorSpace: boolean;
  petFriendly: boolean;
  property: {
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string | null;
  };
};

type PropertyGroup = {
  propertyId: string;
  property: ProfileReviewForList["property"];
  reviews: ProfileReviewForList[];
};

function groupByProperty(reviews: ProfileReviewForList[]): PropertyGroup[] {
  const map = new Map<string, ProfileReviewForList[]>();
  for (const r of reviews) {
    const list = map.get(r.propertyId) ?? [];
    list.push(r);
    map.set(r.propertyId, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => b.reviewYear - a.reviewYear);
  }
  return [...map.entries()]
    .map(([propertyId, list]) => ({
      propertyId,
      property: list[0]!.property,
      reviews: list,
    }))
    .sort((a, b) => {
      const maxYear = (xs: ProfileReviewForList[]) =>
        Math.max(...xs.map((r) => r.reviewYear));
      return maxYear(b.reviews) - maxYear(a.reviews);
    });
}

function moderationLabel(status: ModerationStatus): string {
  switch (status) {
    case "APPROVED":
      return "Live";
    case "PENDING_REVIEW":
      return "Pending";
    case "REJECTED":
      return "Not published";
    default:
      return status;
  }
}

type Props = {
  reviews: ProfileReviewForList[];
  reviewTotalCount: number;
};

export function ProfileReviewsGrouped({ reviews, reviewTotalCount }: Props) {
  const atCap =
    reviewTotalCount >= PRODUCT_POLICY.reviews.maxReviewsPerUser;
  const groups = groupByProperty(reviews);

  return (
    <section className={`${surfaceElevatedClass} p-5 sm:p-7`}>
      <h2 className="text-base font-semibold text-muted-blue-hover">
        Your reviews
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        {PRODUCT_POLICY.reviews.oneReviewPerLeaseStartYearShort}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {reviewTotalCount} of {PRODUCT_POLICY.reviews.maxReviewsPerUser} review
        slots used
        {atCap ? (
          <span className="font-medium text-amber-800">
            {" "}
            - at your limit; edit or remove a review to add a new address or year.
          </span>
        ) : null}
        .
      </p>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">
          You haven&apos;t submitted any reviews yet.{" "}
          <Link href="/submit" className={linkInlineClass}>
            Share your first experience
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-6">
          {groups.map((group) => (
            <li
              key={group.propertyId}
              className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-muted-blue-tint/25 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
            >
              <div className="flex flex-col gap-3 border-b border-zinc-100 bg-muted-blue-tint/35 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <Link
                    href={`/properties/${group.propertyId}`}
                    className="text-base font-semibold text-muted-blue-hover underline-offset-2 hover:underline"
                  >
                    {group.property.addressLine1}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {group.property.city}, {group.property.state}{" "}
                    {group.property.postalCode ?? ""}
                  </p>
                  {group.reviews.length > 1 ? (
                    <p className="mt-2 text-xs font-medium text-muted-blue">
                      {group.reviews.length} lease years at this address
                    </p>
                  ) : null}
                </div>
                <ProfileAddAnotherLeaseYearButton
                  templateReview={group.reviews[0]!}
                  disabled={atCap}
                />
              </div>
              <ul className="divide-y divide-zinc-100">
                {group.reviews.map((review) => (
                  <li key={review.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                      <div className="flex w-full shrink-0 flex-row items-center gap-3 sm:w-24 sm:flex-col sm:items-center sm:justify-start sm:gap-1 sm:pt-0.5">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted-blue-tint/60 ring-1 ring-muted-blue/15 sm:h-auto sm:w-full sm:py-3">
                          <span className="text-xl font-bold tabular-nums leading-none text-muted-blue-hover sm:text-2xl">
                            {review.reviewYear}
                          </span>
                          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Lease
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${
                              review.moderationStatus === "APPROVED"
                                ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
                                : review.moderationStatus === "PENDING_REVIEW"
                                  ? "bg-amber-50 text-amber-900 ring-amber-200/80"
                                  : "bg-zinc-100 text-zinc-600 ring-zinc-200/80"
                            }`}
                          >
                            {moderationLabel(review.moderationStatus)}
                          </span>
                          {review.unit ? (
                            <span className="text-xs text-zinc-500">
                              Unit {review.unit}
                            </span>
                          ) : null}
                          <Link
                            href={`/profile/reviews/${review.id}/edit`}
                            className="ml-auto text-xs font-semibold text-muted-blue hover:underline sm:ml-0"
                          >
                            Edit
                          </Link>
                        </div>
                        <p className="mt-2 text-xs text-zinc-600">
                          {typeof review.monthlyRent === "number"
                            ? `$${review.monthlyRent.toLocaleString()}/month`
                            : "Rent not shared"}
                        </p>
                        {review.body ? (
                          <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                            {review.body.length > 200
                              ? `${review.body.slice(0, 200)}…`
                              : review.body}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-zinc-500">
                            No written review text.
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
