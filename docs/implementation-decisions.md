# Rental Review Implementation Decisions

This document captures confirmed product decisions so engineering can proceed without re-opening scope.

## Confirmed Decisions

- Review cadence: one review per user per property per calendar year.
- Calendar-year guidance: users should review the property where they lived for the majority of that year.
- Geography: City of Boston only for v1.
- Neighborhood launch focus: South Boston first.
- Logged-out experience: teaser-only content.
- Growth motion: social media groups first, then expand to additional channels over time.
- Verification direction: add SMS verification in v1 if feasible.
- Naming policy: do not encourage naming individual landlords.
- Moderation policy direction: discourage or censor personally identifying names where needed.

## Product Rules To Encode

- A user can submit at most one published review for a given normalized property and calendar year.
- The review flow must include a required "review year" field.
- Search and property pages in v1 should only return Boston addresses.
- Logged-out users can see proof of activity (review counts and limited teaser text), but never full reviews.
- Review text should be screened for personally identifying names and queued or blocked based on moderation policy.

## Open Clarification (Need Your Final Call)

- Do you want hard automatic masking/blocking of suspected person names at submit-time, or soft moderation queue only?
