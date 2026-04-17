# Legal Ops Runbook

Status: Draft  
Owner: Ops (assign primary + backup)  
Purpose: Operationalize complaint, takedown, and legal request handling.

---

## Roles and Ownership

- Primary legal inbox owner:
- Backup owner:
- Escalation lead:
- Engineering on-call for legal/abuse incidents:

---

## Intake Channels

- Content complaints: support/legal email + in-product report pipeline.
- Copyright notices: legal email.
- Legal process requests: legal email with request metadata.
- Emergency safety requests: legal email with URGENT tag.

---

## Severity Levels

- **SEV-1:** imminent safety risk, emergency legal process, active doxxing/harassment.
- **SEV-2:** credible defamation/privacy complaint with high-impact claim.
- **SEV-3:** routine report or policy-violation complaint.

---

## Target Response SLAs

- Acknowledge intake:
  - SEV-1: within 4 hours
  - SEV-2: within 1 business day
  - SEV-3: within 2 business days
- Initial action decision:
  - SEV-1: same day
  - SEV-2: within 2 business days
  - SEV-3: within 5 business days

---

## Content Complaint Workflow

1. Confirm report completeness (URL/content ID, basis, evidence, contact).
2. Create internal case ID and timestamp.
3. Triage severity and route to owner.
4. Snapshot relevant content and moderation metadata.
5. Decide temporary action:
   - keep live
   - temporarily limit
   - remove pending review
6. Request additional evidence if required.
7. Final disposition and user response.
8. Log decision, rationale, and follow-up actions.

---

## Counter-Notice Workflow

1. Verify sender identity and relationship to removed content.
2. Confirm required fields are complete.
3. Re-open case and attach counter-notice.
4. Review against original complaint and policy.
5. Decide restore/maintain removal/escalate to counsel.
6. Send final response and preserve case artifact trail.

---

## Copyright/DMCA Workflow

1. Validate notice includes all required elements.
2. Preserve evidence snapshot before action.
3. Apply temporary or final action per policy.
4. Notify affected user if permitted.
5. Accept and review counter-notice if submitted.
6. Track repeat infringer status and account action history.

---

## Legal Request Workflow

1. Validate authenticity and authority.
2. Confirm legal sufficiency and scope.
3. Narrow overbroad requests where possible.
4. Export only in-scope data.
5. Apply legal hold when required.
6. Notify affected user when legally allowed.
7. Record completion with audit log details.

---

## Audit and Retention

- Store all legal operations cases with:
  - request source
  - timestamps
  - evidence references
  - actions taken
  - decision rationale
  - final disposition
- Retain case records according to approved retention schedule and legal hold policy.

---

## Escalation Matrix

- Immediate counsel escalation:
  - threat of litigation
  - court order ambiguity
  - conflicting jurisdiction requirements
  - high-profile reputational risk
- Engineering escalation:
  - urgent content suppression tooling issues
  - data export/access failures
  - logging/audit integrity issues

---

## Quarterly Review Checklist

- Validate all legal policy links are still live.
- Confirm support/legal inbox ownership is current.
- Review SLA performance and backlog.
- Reconfirm retention schedule implementation.
- Review templates against new legal requirements.

