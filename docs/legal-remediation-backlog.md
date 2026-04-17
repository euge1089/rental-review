# Legal Remediation Implementation Plan (Developer Playbook)

Prepared: 2026-04-17  
Source inputs: `docs/legal-risk-gap-matrix.md`, current app structure in `src/app/**` and `src/lib/**`

This is written so engineers can execute without extra instructions.

---

## How to Use This Document

- Pick tickets in order (dependencies are strict).
- For each ticket:
  - complete all implementation tasks
  - pass all verification steps
  - satisfy the Definition of Done checklist
- Do not merge policy text changes without counsel approval on the final copy.

---

## Milestones and Ownership

- **M0 Counsel Lock (blocking):** legal decisions needed before coding copy.
- **M1 P0 Risk Reduction:** publish missing legal pages and wire all links.
- **M2 P1 Policy Parity:** make Terms/Privacy match actual data flows.
- **M3 P1 Product Controls:** consent controls + SMS disclosure + footer IA.
- **M4 P2 Ops Hardening:** DMCA/legal-requests pages and internal SOPs.

Primary owners:
- **Engineering:** routes, UI copy placement, links, consent mechanics.
- **Product/Founder:** policy IA, UX language placement decisions.
- **Counsel:** final legal text and dispute/jurisdiction strategy.
- **Ops:** response ownership, inbox monitoring, SLA process.

---

## Global Technical Standards (Apply to Every Ticket)

- Reuse existing page shell patterns (`AppPageShell`, `PageHeader`, `SurfacePanel`) for legal pages.
- Keep legal routes under `src/app/legal/**`.
- Add all net-new legal pages to global discoverability in `src/app/_components/site-footer.tsx`.
- Update effective date on each policy page when content changes materially.
- Run before PR:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test:run` (or targeted tests if suite is long)

---

## Dependency Gate (Must Complete First)

### LEG-00 - Counsel Decision Pack (Blocking)
- **Priority:** P0
- **Owner:** Founder + Counsel
- **Blocks:** LEG-01 through LEG-15

#### Required decisions
- Arbitration/class waiver vs court forum.
- Giveaway jurisdiction and eligibility scope.
- Privacy regimes targeted at launch.
- Retention windows by data category.
- DMCA applicability + designated agent details.

#### Deliverable
- One approved decision memo in docs with:
  - clause-level guidance
  - required copy constraints
  - unresolved items explicitly marked

#### Definition of done
- Decision memo exists.
- Counsel signs off in writing.
- Engineering can implement without legal ambiguity.

---

## M1 - Immediate Exposure Reduction (P0)

### LEG-01 - Create Official Giveaway Rules Page
- **Priority:** P0
- **Owner:** Engineering + Counsel
- **Dependencies:** LEG-00

#### Files to create/update
- Create: `src/app/legal/giveaway-rules/page.tsx`

#### Implementation tasks
- Create a full legal page with sections:
  - Sponsor identity and address
  - Promotion period with timezone
  - Eligibility criteria and exclusions
  - Entry methods and per-person limits
  - Prize details and ARV
  - Winner selection/notification flow
  - Tax responsibility
  - Void-where-prohibited statement
  - Platform disclaimer
  - Governing law for promotion
  - Contact and effective date
- Pull support/legal email from existing env patterns used in legal pages.

#### Verification
- Navigate to `/legal/giveaway-rules` and confirm render.
- Validate mobile and desktop layout.
- Confirm no TypeScript/lint errors.

#### Definition of done
- Route is live and crawlable.
- Counsel-approved text is present.
- Effective date is visible.

---

### LEG-02 - Link Giveaway Rules Everywhere Giveaway Is Mentioned
- **Priority:** P0
- **Owner:** Engineering
- **Dependencies:** LEG-01

#### Files to update
- `src/app/_components/giveaway-promo-strip.tsx`
- `src/app/_components/home-giveaway-promo-modal.tsx`
- `src/app/submit/page.tsx`
- `src/lib/retention-emails.ts`

#### Implementation tasks
- Replace vague “official rules” references with explicit links to `/legal/giveaway-rules`.
- Ensure at least one visible link in:
  - promo strip
  - modal
  - submit success/disclosure text
  - retention emails (text and HTML bodies)

#### Verification
- Search codebase for giveaway copy and verify link present.
- Click through every UI placement manually.
- Send a test retention email and verify link correctness.

#### Definition of done
- Every giveaway mention has a direct rules URL.
- No stale or placeholder rules references remain.

---

### LEG-03 - Publish Content Complaints & Takedowns Page
- **Priority:** P0
- **Owner:** Engineering + Counsel
- **Dependencies:** LEG-00

#### Files to create/update
- Create: `src/app/legal/content-complaints/page.tsx`

#### Implementation tasks
- Add policy sections for:
  - complaint categories (defamation/privacy/harassment/IP)
  - required submission information
  - good-faith declaration language
  - review and response windows
  - counter-notice flow
  - abuse/misuse warning
  - contact channel
- Ensure policy language matches current report mechanism behavior in:
  - `src/app/api/reviews/[id]/report/route.ts`
  - `src/app/_components/report-review-button.tsx`

#### Verification
- Confirm route loads at `/legal/content-complaints`.
- Confirm links in policy are functional.
- Confirm language does not promise unsupported workflow automation.

#### Definition of done
- Page is public and usable.
- Process is specific enough for users to submit actionable complaints.

---

### LEG-04 - Update Terms for Promotions + Complaint Framework
- **Priority:** P0
- **Owner:** Engineering + Counsel
- **Dependencies:** LEG-01, LEG-03

#### Files to update
- `src/app/legal/terms/page.tsx`

#### Implementation tasks
- Add or expand sections:
  - Promotions and giveaway terms (link to `/legal/giveaway-rules`)
  - Content complaint and takedown process (link to `/legal/content-complaints`)
  - Repeat abuse enforcement ladder
- Keep existing structure and numbering clean (renumber sections if needed).

#### Verification
- Terms page renders and links resolve.
- Section numbering is sequential and readable.
- Counsel confirms no conflicting clause language.

#### Definition of done
- Terms includes both new legal pathways and accurate moderation framing.

---

## M2 - Policy-to-System Alignment (P1)

### LEG-05 - Expand Privacy Data Category Matrix
- **Priority:** P1
- **Owner:** Engineering + Product + Counsel
- **Dependencies:** LEG-00

#### Files to update
- `src/app/_components/privacy-policy-content.tsx`

#### Implementation tasks
- Add explicit data categories tied to real systems:
  - account/auth identifiers
  - SMS verification data
  - review/message/report content
  - device/network logs
  - analytics and telemetry
  - map/geocode derived location
  - email preference and campaign metadata
- Cross-check truthfulness against:
  - `src/app/layout.tsx` (GA script)
  - `src/lib/sms.ts`
  - `src/lib/retention-emails.ts`
  - `src/lib/map-privacy.ts`
  - messaging/reporting APIs

#### Verification
- Legal statements map to implemented behavior.
- No category listed that is not currently collected.

#### Definition of done
- Privacy data categories are concrete, specific, and implementation-accurate.

---

### LEG-06 - Add Privacy Rights Request Workflow
- **Priority:** P1
- **Owner:** Engineering + Counsel
- **Dependencies:** LEG-00

#### Files to update
- `src/app/_components/privacy-policy-content.tsx`

#### Implementation tasks
- Add rights process details:
  - submission channels
  - identity verification method
  - authorized agent process
  - response timeline targets
  - appeal path
  - legal/fraud exceptions

#### Verification
- Process is specific enough for support to follow.
- Contact channel is active and monitored by ops.

#### Definition of done
- Rights section is operationally executable, not generic boilerplate.

---

### LEG-07 - Add Retention Schedule Table
- **Priority:** P1
- **Owner:** Engineering + Counsel
- **Dependencies:** LEG-00

#### Files to update
- `src/app/_components/privacy-policy-content.tsx`

#### Implementation tasks
- Add retention table covering:
  - account records
  - reviews
  - moderation/report artifacts
  - message threads
  - SMS verification artifacts
  - logs
  - retention campaign data
- Include legal hold and compliance carve-outs.

#### Verification
- Windows match counsel-approved decision pack.
- Table is readable on mobile.

#### Definition of done
- Retention commitments are explicit, category-specific, and approved.

---

### LEG-08 - Add Third-Party Processor Disclosure
- **Priority:** P1
- **Owner:** Engineering + Product + Counsel
- **Dependencies:** LEG-05

#### Files to update
- `src/app/_components/privacy-policy-content.tsx`

#### Implementation tasks
- Add processor/service categories and examples:
  - authentication provider
  - SMS provider (Twilio)
  - analytics provider
  - mapping/geocoding provider
  - email provider
  - hosting/database infrastructure
- Add provider policy links where counsel approves.

#### Verification
- All listed providers are actually used in the app/infrastructure.

#### Definition of done
- Third-party disclosure is complete and current.

---

### LEG-09 - Terms Contract Hardening Clauses
- **Priority:** P1
- **Owner:** Engineering + Counsel
- **Dependencies:** LEG-00

#### Files to update
- `src/app/legal/terms/page.tsx`

#### Implementation tasks
- Add clauses per counsel direction:
  - severability
  - assignment
  - no waiver
  - entire agreement
  - survival
  - dispute resolution strategy

#### Verification
- Clause set is internally consistent.
- No conflict with existing governing law section.

#### Definition of done
- Counsel-approved hardening clauses are published and dated.

---

## M3 - Product Controls and UX Disclosures (P1)

### LEG-10 - Implement Cookie Consent + Analytics Gating
- **Priority:** P1
- **Owner:** Engineering + Product + Counsel
- **Dependencies:** LEG-00, LEG-05
- **Current rollout status:** Deferred/hidden for now (feature flag off)

#### Files to create/update
- Update: `src/app/layout.tsx` (gate GA load based on consent state)
- Create/update consent UI components (suggested path: `src/app/_components/`)
- Update: `src/app/_components/site-footer.tsx` (link to preferences entry point)
- Update privacy content to document behavior

#### Implementation tasks
- Add consent banner with accept/reject/manage.
- Persist preference client-side (localStorage/cookie).
- Load GA scripts only when permitted by jurisdiction/consent mode.
- Provide a way to reopen preferences from footer/privacy page.

#### Verification
- Fresh session: GA blocked before consent when required.
- Accept flow: GA initializes.
- Reject flow: GA remains off.
- Preference changes update behavior without reload issues.

#### Definition of done
- Consent controls are functional, testable, and policy-aligned.
- Feature flag plan:
  - Keep `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT` unset/false in production to hide UI.
  - Enable only when counsel approves rollout and geo/consent strategy is finalized.

---

### LEG-11 - Add SMS/TCPA Disclosure at Point of Collection
- **Priority:** P1
- **Owner:** Engineering + Counsel
- **Dependencies:** LEG-00

#### Files to update
- `src/app/_components/profile-verification.tsx`

#### Implementation tasks
- Add visible disclosure text near phone input:
  - consent acknowledgment language
  - message/data rates note
  - carrier non-liability line
  - STOP/HELP instructions
  - links to Terms/Privacy (and SMS Terms if created)

#### Verification
- Disclosure appears before user sends code.
- Layout remains clear on mobile.

#### Definition of done
- Counsel-required telecom language is present and non-ambiguous.

---

### LEG-12 - Expand Legal Discoverability in Footer
- **Priority:** P1
- **Owner:** Engineering
- **Dependencies:** LEG-01, LEG-03

#### Files to update
- `src/app/_components/site-footer.tsx`

#### Implementation tasks
- Add links for:
  - Giveaway Rules
  - Content Complaints
  - (when available) Copyright/DMCA
  - (optional) Law Enforcement Requests
- Preserve current responsive behavior.

#### Verification
- All footer legal links work.
- Footer remains readable and accessible on small screens.

#### Definition of done
- Global legal navigation is complete and stable.

---

## M4 - Operational Hardening (P2)

### LEG-13 - Publish Copyright/DMCA Policy
- **Priority:** P2
- **Owner:** Engineering + Counsel
- **Dependencies:** LEG-00

#### Files to create/update
- Create: `src/app/legal/copyright/page.tsx`
- Update links in Terms/footer

#### Implementation tasks
- Add sections for designated agent, valid notice fields, counter-notice process, repeat infringer handling.

#### Verification
- Route resolves at `/legal/copyright`.
- Terms/footer links updated.

#### Definition of done
- DMCA process is publicly documented and discoverable.

---

### LEG-14 - Publish Law Enforcement Requests Policy
- **Priority:** P2
- **Owner:** Engineering + Counsel + Founder
- **Dependencies:** LEG-00

#### Files to create/update
- Create: `src/app/legal/law-enforcement-requests/page.tsx`
- Update links in footer/Terms if approved

#### Implementation tasks
- Document request submission channel, emergency request handling, legal review standards, minimization principles.

#### Verification
- Route is public and linked where intended.

#### Definition of done
- Public policy exists and aligns with ops procedure.

---

### LEG-15 - Internal SOP + SLA Runbooks (Non-Public)
- **Priority:** P2
- **Owner:** Ops + Founder + Counsel
- **Dependencies:** LEG-03, LEG-13, LEG-14

#### Deliverables
- Internal runbooks covering:
  - complaint triage and escalation
  - counter-notice handling
  - legal process intake
  - ownership + backup owner
  - response SLA targets

#### Definition of done
- Named operational owner for legal inbox.
- Escalation and response timelines documented and adopted.

---

## Final QA and Release Gate

### LEG-QA-01 - Link Integrity Sweep
- Verify all giveaway mentions link to `/legal/giveaway-rules`.
- Verify footer contains all live legal routes.
- Verify Terms and Privacy cross-link correctly.
- Verify retention emails contain valid legal links.

### LEG-QA-02 - Policy/Behavior Truthfulness Sweep
- Confirm legal claims match implementation for:
  - analytics consent/load behavior
  - SMS verification behavior
  - moderation/reporting capabilities
  - anonymous public display behavior

### LEG-QA-03 - Launch Gate
- Counsel final sign-off completed.
- Effective dates updated on edited legal pages.
- Engineering checks pass (`typecheck`, `lint`, tests).

---

## Execution Sequence (No Ambiguity)

1. Complete `LEG-00`.
2. Ship `LEG-01`, `LEG-02`, `LEG-03`, `LEG-04` in one PR train (P0).
3. Ship `LEG-05` through `LEG-09` (policy parity).
4. Ship `LEG-10`, `LEG-11`, `LEG-12` (controls + discoverability).
5. Ship `LEG-13`, `LEG-14`, then finalize `LEG-15`.
6. Run full QA sweep and release only after counsel approval.

---

## Suggested Sprint Plan

- **Sprint A:** LEG-00 to LEG-04
- **Sprint B:** LEG-05 to LEG-09
- **Sprint C:** LEG-10 to LEG-12
- **Sprint D:** LEG-13 to LEG-15 + release QA

