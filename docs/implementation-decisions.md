# Rental Review Implementation Decisions

This document captures confirmed product decisions so engineering can proceed without re-opening scope.

## Confirmed Decisions

- Review cadence: one review per user per property per **lease-start year** (DB field remains `reviewYear`; UI calls it lease start year).
- **Lease start year:** the calendar year when the user’s lease at that address began (see `PRODUCT_POLICY.reviews` in `src/lib/policy.ts`).
- Geography: City of Boston only for v1.
- Neighborhood launch focus: South Boston first.
- Logged-out experience: teaser-only content.
- Growth motion: social media groups first, then expand to additional channels over time.
- **SMS verification:** lives on **Profile only**, not on the submit flow. Submit does **not** require phone verification.
- **Moderation paths (default, after name detection rules):**
  - If likely person names appear in review text → `PENDING_REVIEW` (unchanged).
  - Else if `user.phoneVerified` → `APPROVED`.
  - Else → `PENDING_REVIEW` with reason `Awaiting manual review (profile not SMS verified)`; target SLA **~5 business days** for manual review (copy in policy).
- Auth stack: NextAuth with Google provider.
- SMS stack: Twilio Verify API.
- **Submit UX:** signed-out users see an auth overlay on `/submit` and cannot use the multi-step form until signed in; draft persists in `localStorage` and restores after Google return.
- Post–sign-in **optional** modal nudges SMS on Profile (`sessionStorage` key `sms-prompt-dismissed` when dismissed).
- **Bedrooms:** `Review.bedroomCount` (0 = studio, 1–4 = count, 5 = 5+); Rent Explorer and property rent stats prefer this over unit-string inference when set.
- **Fully anonymous display:** `Review.displayFullyAnonymous` - public label is fixed “Anonymous renter” (no masked initials); admins still see account email internally.

## Product Rules To Encode

- A user can submit at most one published review for a given normalized property and lease-start year (`reviewYear`).
- Search and property pages in v1 should only return Boston addresses.
- Logged-out users can see proof of activity (review counts and limited teaser text), but never full reviews.
- Review text should be screened for personally identifying names and queued or blocked based on moderation policy.

## Open Clarification (Need Your Final Call)

- Do you want hard automatic masking/blocking of suspected person names at submit-time, or soft moderation queue only?
