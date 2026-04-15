## Rent Review Boston

Rent Review Boston is a **Next.js 16** (App Router) app that lets renters search Boston buildings, read structured reviews, see rent analytics, and contribute their own reviews. Logged-out visitors see teaser-only content; signed-in users get full review detail and additional tooling (profile, moderation, admin).

### Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Database**: PostgreSQL via Prisma
- **Auth**: NextAuth (Google provider, JWT sessions)
- **Messaging**: Twilio Verify for SMS (optional trust layer)
- **Mapping**: Mapbox GL (optional Rent Explorer map layer)
- **Validation**: zod for API payloads

### Core Domain Model (Prisma)

- **User**: `id`, `email` (unique), `displayName`, timestamps, `reviews`
- **Property**: `id`, `addressLine1`, `city`, `state`, optional `postalCode`, `normalizedAddress` (unique), optional geocode fields (`latitude`, `longitude`, `geocodeStatus`, `geocodeQueryAddress`), timestamps, `reviews`
- **Review**:
  - Links `userId` + `propertyId` + `reviewYear` with `@@unique([propertyId, userId, reviewYear])`
  - Fields: `unit`, `monthlyRent`, `bathrooms`, free-text `body`, amenity booleans, `overallScore`, `landlordScore`, `majorityYearAttested`
  - Moderation: `moderationStatus` enum (`APPROVED | PENDING_REVIEW | REJECTED`), `moderationReasons` string[]

### Product Rules (v1)

- **Geography**: City of Boston only; South Boston focus (ZIPs 02127, 02210) in analytics
- **Review cadence**: One review per user per property per calendar year (enforced at DB + API via composite unique key)
- **Access control**:
  - Logged out: teaser-only review text, counts, rent bands
  - Logged in: full review text and richer context
- **Moderation**:
  - Simple regex-based name detection for PII → queues review as `PENDING_REVIEW`
  - Admin can approve/reject; user reports append reasons and can re-queue reviews

### Key Directories

- `src/app/**`: App Router pages and UI components
  - `page.tsx`: landing page (hero, search, saved/recent)
  - `properties/page.tsx`: property search/list
  - `properties/[id]/page.tsx`: property detail + reviews + analytics
  - `submit/page.tsx`: client-only review form
  - `profile/page.tsx`: user’s reviews + bookmarked properties
  - `neighborhoods/south-boston/page.tsx`: South Boston rent bands
  - `admin/dashboard/page.tsx`, `admin/reviews/page.tsx`: admin dashboard + moderation queue
- `src/app/_components/**`: shared components (hero, search, nav, bookmarks, property engagement, report button, etc.)
- `src/app/api/**`: API routes (reviews, properties, moderation, SMS, admin, auth)
- `src/lib/**`:
  - `prisma.ts`: Prisma client singleton
  - `auth.ts`: NextAuth `authOptions`
  - `policy.ts`: product configuration (geography, access rules, South Boston ZIPs, review year options)
  - `analytics.ts`: rent band/median analytics helpers
  - `moderation.ts`: name detection and moderation helpers
  - `sms.ts`: Twilio Verify integration
- `prisma/schema.prisma`: Prisma models and relations
- `docs/*.md`: product and implementation docs

### Main User Flows

- **Browse/search properties**
  - `/` → `HomeSearch` → `/properties?query=…`
  - `/api/properties` returns Boston properties with review counts + average rent (approved reviews only)
  - `/properties/[id]` loads property + reviews + analytics on the server
- **Submit a review**
  - Google sign-in via NextAuth (`/api/auth/[...nextauth]`)
  - `/submit` client form → `POST /api/reviews`
  - API validates payload (zod), enforces Boston-only, detects names for moderation, upserts `User`, `Property`, and `Review`
- **Moderation + reporting**
  - Auto-moderation on submit (name detection)
  - User reports via `POST /api/reviews/[id]/report`
  - Admin review queue via `/admin/reviews` and `/api/admin/reviews*`

### Environment Variables

Set these in `.env` (and `.env.local` for local dev as needed):

- **Database**
  - `DATABASE_URL` – PostgreSQL connection string
- **Auth**
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `NEXTAUTH_SECRET` – secret for NextAuth JWT
- **Admin**
  - `ADMIN_EMAIL` – email address with admin privileges
- **Twilio Verify**
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_VERIFY_SERVICE_SID`
- **Map / Geocoding**
  - `NEXT_PUBLIC_ENABLE_RENT_EXPLORER_MAP` (`1` to enable map UI)
  - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (browser map rendering)
  - `MAPBOX_GEOCODING_TOKEN` (server geocode backfill)
- **Scheduled jobs**
  - `CRON_SECRET` (required for `/api/cron/*` routes, including property geocoding backfill)

### Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

Prisma commands:

```bash
npx prisma migrate dev
npx prisma studio
```

Automated quality checks:

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
```

Current automated coverage includes:

- `src/lib/policy.test.ts` (review year + bathroom policy helpers)
- `src/lib/normalize-address.test.ts` (address normalization/display formatting)
- `src/app/api/reviews/duplicate-check/route.test.ts` (auth gate + Boston gating + duplicate year detection)
- `src/app/api/reviews/batch/route.test.ts` (submit guardrails: auth required, Boston-only, duplicate years rejected)
- `src/app/api/reviews/public/route.test.ts` (teaser-only payload protection for public API)
- `src/app/api/auth/register/route.test.ts` (existing-account conflict + new-user verification flow)
- `src/app/api/auth/verify-email/route.test.ts` (incorrect-code handling + successful account verification)
- `src/app/api/auth/resend-verification/route.test.ts` (password gate + resend flow)
- `src/app/api/admin/reviews/route.test.ts` (admin authorization guard + authorized response path)
- `src/app/api/admin/users/route.test.ts` (admin authorization guard + authorized response path)
- `src/app/api/reviews/[id]/route.test.ts` (owner-only edit/delete authorization for review mutations)
- `src/app/api/reviews/[id]/report/route.test.ts` (report auth requirement + duplicate-report protection + success path)
- `src/app/api/bookmarks/route.test.ts` (bookmark auth + validation + create/delete behavior)
- `src/app/api/profile/route.test.ts` (profile auth + immutable Boston start-year rule + update path)
- `src/app/api/reviews/my-count/route.test.ts` (review quota count and at-cap behavior)
- `src/app/api/moderation/check/route.test.ts` (moderation decision + detected names response shape)
- `src/app/api/reviews/duplicate-check/route.test.ts` (adds rate-limit and invalid-input edge coverage)
- `src/app/api/analytics/rent-explorer/map/route.test.ts` (auth gate + marker payload for map mode)

### Testing the Core Flows Locally

1. **Sign in** with a Google account via `/signin`.
2. **Submit a review** at `/submit` (Boston address only); verify moderation behavior with/without names in the text.
3. **Browse** properties at `/properties` and click through to `/properties/[id]`.
4. **Report a review** via the Report button and resolve it via `/admin/reviews` using the configured `ADMIN_EMAIL`.

### Security & Data Access Invariants

- **No public API returns full review text.**
  - Public endpoints like `/api/properties` expose only aggregates (counts, average rent).
  - Any future review APIs should use `serializeReviewForPublic` from `src/lib/serialization.ts`, which returns a teaser-only `teaser` field and never `body` or reviewer email.
- **Full review text + reviewer email are admin-only.**
  - Only the admin review API (`/api/admin/reviews`) and admin pages surface full `body` and `user.email`, and they require a signed-in session whose email matches `ADMIN_EMAIL`.
- **Logged-out users see teaser-only text on property pages.**
  - `/properties/[id]` enforces teaser-vs-full text rendering on the server via `getServerSession(authOptions)`.

For a deeper product overview, see `docs/boston-rental-reviews-plan.md` and `docs/implementation-decisions.md`.
