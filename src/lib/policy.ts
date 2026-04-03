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
    majorityYearAttestationRule:
      "Confirm this review describes the apartment you leased starting in that year (your main residence there during that lease period).",
    liveNowUserMessage: "Your review is live.",
    pendingNamesUserMessage:
      "Submitted. Your review is queued for moderation because names were detected.",
    pendingManualReviewMessage:
      "Thanks — we’ll review your review within about 5 business days. Verify your phone on Profile for faster approval next time.",
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
