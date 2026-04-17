# Rent Review Boston - Legal Risk Gap Matrix (Attorney Review Draft)

**Prepared:** 2026-04-17  
**Prepared by:** AI assistant (non-lawyer) for counsel review  
**Purpose:** Identify likely legal exposure and provide concrete draft language/process recommendations for attorney refinement.

## Scope reviewed

- `src/app/legal/terms/page.tsx`
- `src/app/legal/privacy/page.tsx`
- `src/app/_components/privacy-policy-content.tsx`
- Product and backend flows touching legal risk:
  - reviews/moderation/reporting
  - messaging/blocking
  - giveaway promotions
  - auth, SMS verification, analytics/cookies
  - map privacy/geocoding and retention emails

---

## Executive risk ranking


| Priority | Risk Area                                                      | Current Exposure | Why it matters                                                                                                                                      |
| -------- | -------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Sweepstakes / giveaway law                                     | High             | Promotion tied to review submissions without full published official rules and required disclosures can create regulatory/private enforcement risk. |
| 2        | UGC defamation/privacy complaints process                      | High             | Reviews about housing actors create predictable disputes; Terms do not currently publish a robust formal complaint/takedown workflow.               |
| 3        | Privacy rights operations (US state + potential GDPR visitors) | High             | Policy references rights but lacks specific mechanics, categories, retention detail, and response framework.                                        |
| 4        | Cookies/analytics consent/disclosure                           | Medium-High      | GA tracking is implemented globally; disclosure/choice architecture appears generic and may be inadequate for some jurisdictions.                   |
| 5        | SMS/TCPA/A2P disclosures                                       | Medium-High      | Twilio verification is used, but user-facing legal text is not specific about consent/rates/carrier disclaimers/controls.                           |
| 6        | Email marketing compliance detail                              | Medium           | Retention campaign exists; policy should more clearly separate transactional vs optional messages and opt-out timing mechanics.                     |
| 7        | Contract enforceability hardening                              | Medium           | Terms are solid baseline but missing several common enforceability clauses/processes that reduce litigation friction.                               |


---

## Detailed gap matrix


| Area                           | Current coverage (observed)                                                                                                     | Gap                                                                                                                  | Recommended fix (for counsel review)                                                                                              | Suggested owner                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Giveaway/sweepstakes           | Giveaway language appears in submit UX and promo components; references "official rules" but no standalone rules page detected. | Missing promotion-specific legal instrument and disclosures.                                                         | Publish dedicated `Official Giveaway Rules` page and require explicit cross-linking from all promo placements and related emails. | Founder + counsel               |
| UGC disputes/takedowns         | Terms prohibit defamatory/false content and allow moderation/removal. Reporting endpoint exists.                                | No public formal complaint intake standard, no documented response path, no repeat infringer/abuser policy language. | Add `Content Complaints & Takedowns` page and incorporate notice-and-action framework in Terms.                                   | Product + counsel               |
| Privacy rights                 | Privacy includes generic rights statement.                                                                                      | No detailed rights handling process, verification standard, appeal mechanism, retention schedule by category.        | Expand Privacy into category-by-category disclosure and rights workflow.                                                          | Founder + counsel               |
| Cookies/analytics              | Privacy mentions cookies generally; GA instrumentation in layout.                                                               | No explicit cookie categories, legal basis by region, or preference/opt-out details.                                 | Add Cookies section + controls (banner/preferences as needed).                                                                    | Product + engineering + counsel |
| SMS verification               | SMS APIs present; Twilio Verify integrated.                                                                                     | Limited legal text on consent, rates, STOP/HELP handling, and telecom disclaimers.                                   | Add SMS Terms section and clear in-flow disclosures on phone verification UI.                                                     | Product + counsel               |
| Email campaigns                | Opt-out flags and retention email workflows implemented.                                                                        | Policy does not fully describe optional campaign logic, tracking links, and unsubscribe timing.                      | Add detailed Email Communications section in Privacy and possibly Terms.                                                          | Product + counsel               |
| Arbitration/forum/disputes     | Governing law is Massachusetts.                                                                                                 | No dispute-resolution mechanics (forum/arbitration/class waiver) if desired by counsel.                              | Add dispute-resolution section based on counsel strategy and enforceability constraints.                                          | Counsel                         |
| IP/DMCA                        | General IP ownership language exists.                                                                                           | No dedicated copyright complaint process and agent notice workflow.                                                  | Add DMCA/copyright policy page + designated contact details.                                                                      | Counsel                         |
| Data retention                 | Privacy says retained as needed.                                                                                                | Lacks category-specific retention windows and deletion/anonymization logic.                                          | Add retention table and legal-hold carve-outs.                                                                                    | Engineering + counsel           |
| Law enforcement/legal requests | Terms mention lawful disclosure.                                                                                                | No published policy/process for legal process handling.                                                              | Add short Legal Requests section (subpoena, emergency requests, scope minimization).                                              | Founder + counsel               |


---

## Draft add-ons for Terms of Service (redline-ready starting text)

> Note: language below is intentionally conservative and generic; counsel should localize by jurisdiction, business entity type, and dispute strategy.

### 1) Add new section: "Promotions and giveaway terms"

**Draft text**

```
From time to time, we may offer promotions, sweepstakes, giveaways, or similar programs ("Promotions"). Promotions are governed by these Terms and by additional official rules published for each Promotion (the "Official Rules"). If there is a conflict between these Terms and the Official Rules for a Promotion, the Official Rules control for that Promotion.

No purchase is necessary unless explicitly stated in the Official Rules. Eligibility, entry limits, selection method, prize details, timing, taxes, and any restrictions are described in the applicable Official Rules. Promotions may be void where prohibited or restricted by law.
```

### 2) Add new section: "Content complaints and takedown process"

**Draft text**

```
If you believe content on the Service is unlawful, defamatory, infringes your rights, violates privacy, or otherwise violates these Terms, you may submit a complaint to [LEGAL CONTACT EMAIL]. Your complaint should include sufficient detail for us to identify the content, evaluate the claim, and contact you for follow-up.

We may remove, limit, or retain content while we investigate. We may request additional information, including sworn statements where appropriate. Repeated abusive, fraudulent, or bad-faith complaints may result in account restrictions.
```

### 3) Add new section: "Repeat abuse and enforcement transparency"

**Draft text**

```
We may apply escalating enforcement for repeat violations, including warning, reduced visibility, temporary restrictions, content removal, account suspension, and permanent termination. We reserve the right to preserve records relevant to trust and safety, legal compliance, and dispute resolution.
```

### 4) Expand existing "Termination, governing law, and updates"

**Suggested additions**

- Severability
- Assignment
- No waiver
- Entire agreement
- Survival clauses
- Limitation period for claims (if counsel recommends)
- Venue/arbitration/class waiver strategy (counsel decision)

---

## Draft add-ons for Privacy Policy (redline-ready starting text)

### 1) Replace generic collection bullets with a category matrix

Add explicit categories:

- Identifiers (email, profile fields)
- Verification data (phone number, verification status, anti-abuse signals)
- User submissions (reviews, votes, reports, messages)
- Device/network data (IP, user agent, logs)
- Approximate location/map data (including snapped display logic)
- Communications metadata (email sends/clicks/preferences)

### 2) Add "Legal bases / jurisdictional framework" section

**Draft text**

```
Depending on your location, we process personal information under one or more legal bases, including performance of a contract, legitimate interests (such as platform safety and abuse prevention), compliance with legal obligations, and consent where required.
```

### 3) Add "Your privacy rights and request process"

Must define:

- Request channels (email + web form if possible)
- Identity verification method
- Authorized agent handling
- Response timelines
- Appeal path (where legally required)
- Exceptions (legal hold, fraud prevention, compliance obligations)

### 4) Add "Cookies and analytics controls"

Include:

- What cookies/SDKs are used
- Essential vs analytics/measurement categories
- How users opt out (preference center/browser controls)
- Region-specific consent logic statement

### 5) Add "Retention schedule"

Create a plain-language table with target windows by data type (account records, review records, reports/moderation records, logs, marketing events, SMS verification artifacts), plus legal hold exceptions.

### 6) Add "Third-party recipients and processors"

Name categories and examples (auth, SMS, geocoding/maps, email delivery, analytics, hosting/infrastructure) and reference provider links where appropriate.

---

## New legal pages to add

### A) `Official Giveaway Rules`

**Minimum fields to include:**

- Sponsor legal name/address
- Promotion period with timezone
- Eligibility (age, residency, exclusions)
- Entry methods and any limits
- Odds statement
- Prize details + ARV
- Winner selection and notification process
- Publicity release (if used and lawful)
- Tax responsibility and required forms
- Disqualification criteria
- Void where prohibited
- Platform disclaimer language
- Privacy handling for entrants
- Governing law/dispute terms for the promotion

### B) `Content Complaints & Takedowns`

**Minimum fields to include:**

- Complaint categories (defamation/privacy/harassment/IP)
- Required submission details
- Good-faith declaration language
- Counter-notice path
- Abuse/misuse warning
- Contact channel and expected response windows

### C) `Copyright / DMCA Policy` (if U.S.-facing)

- Designated agent information
- Notice requirements
- Counter-notice process
- Repeat infringer policy statement

### D) `Law Enforcement & Legal Requests` (optional but useful)

- How requests should be submitted
- Emergency request handling
- Scope minimization and legal review expectations

---

## Product/legal consistency checks to run before publish

1. Ensure every giveaway mention links to the official rules URL.
2. Ensure privacy statements match actual storage and telemetry behavior.
3. Ensure "anonymous" claims match internal access controls and de-identification practice.
4. Ensure moderation workflow in docs matches real queueing/enforcement behavior.
5. Ensure opt-out controls described in policy exist and are testable in UI.
6. Ensure all legal contact emails are staffed and monitored.

---

## Counsel question list (to accelerate review)

1. Should the service use arbitration/class-action waiver or court forum selection?
2. What sweepstakes structure is compliant for current user geography?
3. Is current moderation + reporting sufficient for defamation risk posture?
4. What statutory privacy regimes should be explicitly targeted at launch?
5. What retention periods should be mandatory vs discretionary?
6. What incident-response and legal-request commitments should be publicly stated?
7. Any additional Massachusetts-specific landlord/renter publication risks to disclaim?

---

## Implementation sequence (practical)

1. Draft and publish Official Giveaway Rules page.
2. Add complaint/takedown policy page and link from Terms + footer.
3. Upgrade Privacy Policy specificity (rights, retention, cookies, recipients).
4. Add Terms hardening clauses (survival, severability, dispute mechanics per counsel).
5. Run full copy consistency audit across submit/profile/promo/email surfaces.
6. Have counsel finalize and sign off before broad promotion.

---

## Important disclaimer

This document is an operational risk analysis, not legal advice. Final language, jurisdiction strategy, and compliance posture should be approved by licensed counsel.