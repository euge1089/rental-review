# Execution Checklist

## Environment Setup (Required Before Coding)

- Install Node.js 20+ (includes `npm` and `npx`).
- Confirm tooling:
  - `node -v`
  - `npm -v`
  - `npx --version`

## Build Sequence

1. Scaffold app
   - Create Next.js TypeScript app in this repository.
2. Core data model
   - Add `Property`, `Review`, and `User` entities.
   - Enforce unique review key: `userId + propertyId + reviewYear`.
3. Geography guardrails
   - Restrict search/autocomplete to City of Boston.
   - Seed South Boston-focused neighborhood filters/content.
4. Auth and gating
   - Add Google OAuth sign-in.
   - Add SMS verification step for posting reviews.
   - Gate full review content for authenticated users only.
5. Review workflow
   - Require calendar year and majority-year attestation.
   - Add short structured fields first; optional narrative text.
6. Moderation basics
   - Add report flow.
   - Add name-detection check and moderation queue behavior.
7. Teaser UX
   - Logged-out users see counts/teaser snippets only.
8. Deployable baseline
   - Environment variables template.
   - Production-safe defaults and basic error handling.

## Credentials Needed

- Google OAuth client ID and secret.
- SMS provider credentials (Twilio or equivalent).
- Database connection string (PostgreSQL recommended).
- Optional map/geocoding key for address normalization.

## Immediate Next Command After Node Install

Run from `rental-review`:

`npx create-next-app@latest . --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm`
