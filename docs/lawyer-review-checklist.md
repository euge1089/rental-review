# Lawyer Review Checklist (Production Redline Pass)

Purpose: accelerate counsel review and capture final production language in one pass.

Use this as a mark-up checklist against the current legal pages and related UX copy.

---

## Review Sequence (Recommended)

1. `src/app/legal/giveaway-rules/page.tsx`
2. `src/app/legal/content-complaints/page.tsx`
3. `src/app/legal/terms/page.tsx`
4. `src/app/_components/privacy-policy-content.tsx`
5. `src/app/legal/copyright/page.tsx`
6. `src/app/legal/law-enforcement-requests/page.tsx`
7. High-visibility legal copy in product surfaces:
   - `src/app/_components/giveaway-promo-strip.tsx`
   - `src/app/submit/page.tsx`
   - `src/lib/retention-emails.ts`
   - `src/app/_components/profile-verification.tsx`

---

## A) Official Giveaway Rules (`/legal/giveaway-rules`)

- Confirm sponsor legal entity name and physical mailing address.
- Confirm eligibility geography, age threshold, and exclusions.
- Confirm promotion period wording and timezone precision.
- Confirm entry method language and cap is legally compliant.
- Confirm disqualification conditions (fraud/spam/policy violations).
- Confirm prize description + ARV (exact amount and flexibility terms).
- Confirm winner selection and notification process language.
- Confirm tax reporting statement and required forms (if any).
- Confirm “void where prohibited” and required jurisdiction notices.
- Confirm governing law/dispute language for promotions.
- Confirm platform disclaimer wording (if required by promo channels).

Decision capture:
- Final sponsor name:
- Final sponsor address:
- Final jurisdiction scope:
- Final prize/ARV wording:

---

## B) Content Complaints & Takedowns (`/legal/content-complaints`)

- Confirm complaint categories cover your risk areas (defamation/privacy/harassment/IP).
- Confirm required complaint fields are sufficient for legal triage.
- Confirm good-faith declaration language is strong enough.
- Confirm review timeline language avoids overpromising.
- Confirm interim action authority wording (keep/remove/limit visibility).
- Confirm counter-notice process wording.
- Confirm bad-faith misuse warning language.
- Confirm contact route and intake format requirements.

Decision capture:
- Required evidence threshold:
- Required declaration wording:
- Counter-notice standard:

---

## C) Terms of Service (`/legal/terms`)

- Confirm promotions section wording and precedence with official rules.
- Confirm complaints/takedowns reference language.
- Confirm repeat abuse enforcement language.
- Confirm dispute forum/arbitration/class waiver strategy.
- Confirm governing law and venue language.
- Confirm severability/assignment/no waiver/entire agreement/survival clauses.
- Confirm limitation of liability and indemnity are in acceptable form.
- Confirm Terms references to other legal pages are complete.

Decision capture:
- Dispute mechanism final choice:
- Venue final text:
- Any mandatory carve-outs:

---

## D) Privacy Policy (`/legal/privacy` via `privacy-policy-content.tsx`)

- Confirm data-category matrix matches intended legal disclosures.
- Confirm legal basis statement (if targeting non-US or consent frameworks).
- Confirm rights request process details:
  - channels
  - identity verification
  - authorized agent
  - appeal
  - exceptions
- Confirm retention table windows (replace placeholders with approved values).
- Confirm third-party processor categories and examples.
- Confirm cookie/analytics controls language is accurate while LEG-10 is hidden.
- Confirm international transfer language and children’s policy language.

Decision capture:
- Final rights SLA language:
- Final retention windows:
- Final processor disclosure level:

---

## E) Copyright / DMCA (`/legal/copyright`)

- Confirm whether DMCA policy is required for launch footprint.
- Confirm designated agent details format and required fields.
- Confirm notice/counter-notice elements.
- Confirm repeat infringer policy wording.

Decision capture:
- DMCA applicability:
- Designated agent details:

---

## F) Law Enforcement Requests (`/legal/law-enforcement-requests`)

- Confirm whether this page should be live at launch.
- Confirm required legal process submission standards.
- Confirm emergency request language.
- Confirm user-notice policy wording and carve-outs.
- Confirm minimization/review language.

Decision capture:
- Publish now? (yes/no):
- User notification policy:

---

## G) In-Product Legal Copy Review

### Giveaway copy surfaces
- Confirm “official rules” references and phrasing are compliant:
  - `src/app/_components/giveaway-promo-strip.tsx`
  - `src/app/submit/page.tsx`
  - `src/lib/retention-emails.ts`

### SMS verification copy
- Confirm telecom disclosure language in:
  - `src/app/_components/profile-verification.tsx`
- Confirm required STOP/HELP/carrier/msg&data language.

### Footer discoverability
- Confirm legal link labels and ordering in:
  - `src/app/_components/site-footer.tsx`

---

## H) Launch-Specific Notes

- `LEG-10` consent UI is currently hidden by feature flag:
  - `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT` is OFF by default.
- Confirm privacy wording remains accurate in this state.
- Confirm whether counsel wants policy text to mention consent controls before rollout.

---

## I) Final Counsel Sign-Off Record

- Counsel name:
- Date:
- Version approved:
- Required pre-launch edits:
- Required post-launch edits:

