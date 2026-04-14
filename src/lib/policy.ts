export const PRODUCT_POLICY = {
  geography: {
    city: "Boston",
    launchNeighborhood: "South Boston",
  },
  reviews: {
    /** DB field `reviewYear` is the calendar year the lease started (lease-start year). */
    cadence: "lease-start-year",
    maxReviewsPerPropertyPerYear: 1,
    /** Max distinct reviews one account can have site-wide (new creates only; edits allowed). */
    maxReviewsPerUser: 10,
    leaseStartYearRule:
      "Select the calendar year when your lease at this address began.",
    /** Shown on profile / help copy; enforced in DB @@unique([propertyId, userId, reviewYear]). */
    oneReviewPerLeaseStartYearShort:
      "One review per lease-start year for each address. Lived there multiple years? Add another year anytime.",
    majorityYearAttestationRule:
      "Confirm this review describes the apartment you leased starting in that year (your main residence there during that lease period).",
    liveNowUserMessage: "Your review is live.",
    pendingNamesUserMessage:
      "Submitted. Your review is queued for moderation because names were detected.",
    pendingManualReviewMessage:
      "Thanks - we’ll review your review within about 5 business days. Verify your phone on Profile for faster approval next time.",
  },
  access: {
    loggedOutMode: "teaser-only",
  },
  moderation: {
    discourageIndividualNames: true,
    manualReviewReasonUnverified:
      "Awaiting manual review (profile not SMS verified)",
  },
  verification: {
    target: "google-oauth-plus-sms-profile",
    /** Shown in UI when SMS not verified; aligns with manual queue SLA. */
    unverifiedReviewSlaBusinessDays: 5,
  },
} as const;

export const REVIEW_YEAR_OPTIONS = [
  2026,
  2025,
  2024,
  2023,
  2022,
  2021,
  2020,
  2019,
  2018,
  2017,
];

/** Ten calendar years ending in the current year (for “first year renting in Boston”). */
export function getBostonRentingSinceYearChoices(now = new Date()): number[] {
  const y = now.getFullYear();
  return Array.from({ length: 10 }, (_, i) => y - i);
}

export function isValidBostonRentingSinceYear(
  year: number,
  now = new Date(),
): boolean {
  return getBostonRentingSinceYearChoices(now).includes(year);
}

/** Lease-start years allowed on forms given profile floor (intersect global list). */
export function reviewYearsAllowedForUser(
  bostonRentingSinceYear: number | null,
): number[] {
  if (bostonRentingSinceYear == null) return [];
  return REVIEW_YEAR_OPTIONS.filter((y) => y >= bostonRentingSinceYear);
}

export const SOUTH_BOSTON_ZIP_CODES = ["02127", "02210"];

/** Step 1 bedroom values: 0 studio, 1–4 exact beds, 5 = 5 or more */
export const BEDROOM_SUBMIT_OPTIONS = [
  { value: 0, label: "Studio" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5+" },
] as const;

/**
 * Stored `Review.bathrooms` on submit. `4` means 3+ baths in the UI (not “exactly 4”).
 */
export const BATHROOM_SUBMIT_OPTIONS = [
  { value: 1, label: "1" },
  { value: 1.5, label: "1.5" },
  { value: 2, label: "2" },
  { value: 2.5, label: "2.5" },
  { value: 4, label: "3+" },
] as const;

const BATH_EPS = 1e-6;

export function isAllowedBathroomsSubmitValue(n: number): boolean {
  return BATHROOM_SUBMIT_OPTIONS.some((o) => Math.abs(o.value - n) < BATH_EPS);
}

/**
 * Snap any legacy float to an allowed bucket (matches Prisma migrations for bathrooms).
 */
export function snapBathroomsToAllowedDbValue(raw: number | null): number | null {
  if (raw == null || Number.isNaN(raw)) return null;
  if (isAllowedBathroomsSubmitValue(raw)) return raw;
  if (raw < 1.25) return 1;
  if (raw < 1.75) return 1.5;
  if (raw < 2.25) return 2;
  if (raw < 2.75) return 2.5;
  return 4;
}

/** Property cards / home preview: "1 bath", "3+ baths", etc. */
export function bathroomsToPublicLabel(b: number | null | undefined): string | null {
  if (b == null) return null;
  const n = snapBathroomsToAllowedDbValue(b);
  if (n == null) return null;
  if (Math.abs(n - 4) < BATH_EPS) return "3+ baths";
  if (Math.abs(n - 1) < BATH_EPS) return "1 bath";
  return `${n} baths`;
}

/** Rent Explorer compact line, e.g. "3+ BA". */
export function bathroomsToBaAbbrev(b: number | null | undefined): string | null {
  if (b == null) return null;
  const n = snapBathroomsToAllowedDbValue(b);
  if (n == null) return null;
  if (Math.abs(n - 4) < BATH_EPS) return "3+ BA";
  return `${n} BA`;
}
