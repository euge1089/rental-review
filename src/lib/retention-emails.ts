import { prisma } from "@/lib/prisma";
import { reviewYearsAllowedForUser } from "@/lib/policy";
import { getSiteOrigin } from "@/lib/site-origin";
import { retentionCtaUrl, retentionClickTrackingEnabled } from "@/lib/retention-tracking";
import { sendEmailViaResend } from "@/lib/send-email-resend";

export const RETENTION_CAMPAIGN_NO_REVIEW = "NO_REVIEW_REMINDER" as const;
/** Second nudge only if they never clicked the tracked link from {@link RETENTION_CAMPAIGN_NO_REVIEW}. */
export const RETENTION_CAMPAIGN_NO_REVIEW_FOLLOWUP =
  "NO_REVIEW_REMINDER_FOLLOWUP" as const;
export const RETENTION_CAMPAIGN_LEASE_YEAR_GAP = "LEASE_YEAR_GAP_REMINDER" as const;

/** Edit here (or use RETENTION_EMAIL_LAUNCH_LINE) when “this month” is no longer accurate. */
const RETENTION_LAUNCH_TIMING = "this month";

function noReviewMinAgeMs(): number {
  const days = Number(process.env.RETENTION_NO_REVIEW_MIN_DAYS ?? "3");
  const d = Number.isFinite(days) && days >= 0 ? days : 3;
  return d * 86_400_000;
}

function batchLimit(): number {
  const n = Number(process.env.RETENTION_EMAIL_BATCH ?? "30");
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 30;
}

function noReviewFollowupAfterFirstMs(): number {
  const days = Number(
    process.env.RETENTION_NO_REVIEW_FOLLOWUP_DAYS_AFTER_FIRST ?? "7",
  );
  const d = Number.isFinite(days) && days >= 1 ? days : 7;
  return d * 86_400_000;
}

function noReviewFollowupHumanTimePhrase(): string {
  const days = Number(
    process.env.RETENTION_NO_REVIEW_FOLLOWUP_DAYS_AFTER_FIRST ?? "7",
  );
  const d = Number.isFinite(days) && days >= 1 ? days : 7;
  if (d === 1) return "yesterday";
  if (d === 7) return "about a week ago";
  if (d < 7) return `${d} days ago`;
  return `${d} days ago`;
}

function profilePrefsUrl(): string {
  return `${getSiteOrigin()}/profile#email-preferences`;
}

/** Sign-off line. Override with RETENTION_EMAIL_SIGNER_NAME; defaults to Ben. */
function emailSignOff(): string {
  const name = process.env.RETENTION_EMAIL_SIGNER_NAME?.trim() || "Ben";
  return `— ${name}\nRent Review Boston`;
}

/**
 * Optional override for the opening “why I built this” line.
 * Default mentions “this month” — change via RETENTION_EMAIL_LAUNCH_LINE or edit when it’s no longer accurate.
 */
function founderLaunchLine(): string {
  const custom = process.env.RETENTION_EMAIL_LAUNCH_LINE?.trim();
  if (custom) return custom;
  return `I launched Rent Review Boston ${RETENTION_LAUNCH_TIMING} to help build a community-run renter information database here — the kind of detail you wish you had before signing a lease.`;
}

function privacyReassuranceShort(): string {
  return "On the public site, your name doesn’t appear on the review, and lease timing is shown in broad buckets (not your exact lease-start year), so a landlord or management company can’t realistically tell who wrote what.";
}

export async function findUsersForNoReviewReminder(): Promise<
  { id: string; email: string }[]
> {
  const cutoff = new Date(Date.now() - noReviewMinAgeMs());
  return prisma.user.findMany({
    where: {
      emailVerifiedAt: { not: null },
      retentionEmailsOptOut: false,
      createdAt: { lte: cutoff },
      reviews: { none: {} },
      retentionEmailLogs: { none: { campaign: RETENTION_CAMPAIGN_NO_REVIEW } },
    },
    select: { id: true, email: true },
    take: batchLimit(),
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Second no-review email: first reminder was sent ≥N days ago, no click on that
 * campaign’s tracked link, still zero reviews. Requires click tracking (secret).
 */
export async function findUsersForNoReviewFollowup(): Promise<
  { id: string; email: string }[]
> {
  if (!retentionClickTrackingEnabled()) {
    return [];
  }
  const afterFirst = new Date(Date.now() - noReviewFollowupAfterFirstMs());
  return prisma.user.findMany({
    where: {
      emailVerifiedAt: { not: null },
      retentionEmailsOptOut: false,
      reviews: { none: {} },
      retentionEmailClicks: {
        none: { campaign: RETENTION_CAMPAIGN_NO_REVIEW },
      },
      AND: [
        {
          retentionEmailLogs: {
            some: {
              campaign: RETENTION_CAMPAIGN_NO_REVIEW,
              sentAt: { lte: afterFirst },
            },
          },
        },
        {
          retentionEmailLogs: {
            none: { campaign: RETENTION_CAMPAIGN_NO_REVIEW_FOLLOWUP },
          },
        },
      ],
    },
    select: { id: true, email: true },
    take: batchLimit(),
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Users who already have ≥1 review but, given their Boston start year, still have
 * eligible lease-start years with no review row yet (same rule as the profile banner).
 */
export async function findUsersForLeaseYearGapReminder(): Promise<
  { id: string; email: string }[]
> {
  const users = await prisma.user.findMany({
    where: {
      emailVerifiedAt: { not: null },
      retentionEmailsOptOut: false,
      bostonRentingSinceYear: { not: null },
      reviews: { some: {} },
      retentionEmailLogs: {
        none: { campaign: RETENTION_CAMPAIGN_LEASE_YEAR_GAP },
      },
    },
    select: {
      id: true,
      email: true,
      bostonRentingSinceYear: true,
      reviews: { select: { reviewYear: true } },
    },
    take: batchLimit() * 3,
    orderBy: { updatedAt: "desc" },
  });

  const out: { id: string; email: string }[] = [];
  for (const u of users) {
    const floor = u.bostonRentingSinceYear;
    if (floor == null) continue;
    const covered = new Set(u.reviews.map((r) => r.reviewYear));
    const allowed = reviewYearsAllowedForUser(floor);
    const missing = allowed.filter((y) => !covered.has(y));
    if (missing.length > 0) {
      out.push({ id: u.id, email: u.email });
    }
    if (out.length >= batchLimit()) break;
  }
  return out;
}

function formatYearExamples(years: number[]): string {
  const desc = [...years].sort((a, b) => b - a);
  if (desc.length <= 4) return desc.join(", ");
  return `${desc.slice(0, 3).join(", ")}, +${desc.length - 3} more`;
}

export async function sendNoReviewReminderEmail(
  to: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const submit = retentionCtaUrl(userId, RETENTION_CAMPAIGN_NO_REVIEW);
  const prefs = profilePrefsUrl();
  const subject = "Saw you joined Rent Review Boston — quick ask?";
  const text = [
    "Hey —",
    "",
    `${founderLaunchLine()} I saw you made an account — thank you for that.`,
    "",
    "No pressure at all, but it would mean a lot if you’d leave a review when you have a minute. It’s quick (about a minute or two).",
    "",
    privacyReassuranceShort(),
    "",
    `Submit a review: ${submit}`,
    "",
    "P.S. We sometimes run a small giveaway for people who submit — if it’s active, you’ll see it on the submit page. Official rules always win over anything in an email.",
    "",
    `Don’t want these reminders? You can turn them off here: ${prefs}`,
    "",
    emailSignOff(),
  ].join("\n");

  return sendEmailViaResend({ to, subject, text });
}

export async function sendNoReviewFollowupReminderEmail(
  to: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const submit = retentionCtaUrl(userId, RETENTION_CAMPAIGN_NO_REVIEW_FOLLOWUP);
  const prefs = profilePrefsUrl();
  const subject = "Following up — quick Boston review?";
  const text = [
    "Hey —",
    "",
    `I emailed you ${noReviewFollowupHumanTimePhrase()} about Rent Review Boston. Not sure you saw it, so I’ll keep this short.`,
    "",
    "If you can spare a couple of minutes, a quick anonymous review really helps the next renter. Same privacy as before: your name doesn’t show on the public review, and lease timing is only shown in broad buckets.",
    "",
    `Submit a review: ${submit}`,
    "",
    "P.S. We sometimes run a small giveaway for people who submit — if it’s active, you’ll see it on the submit page. Official rules always win over anything in an email.",
    "",
    `Don’t want these reminders? ${prefs}`,
    "",
    emailSignOff(),
  ].join("\n");

  return sendEmailViaResend({ to, subject, text });
}

export async function sendLeaseYearGapReminderEmail(
  to: string,
  args: { bostonRentingSinceYear: number; missingLeaseStartYears: number[] },
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const submit = retentionCtaUrl(userId, RETENTION_CAMPAIGN_LEASE_YEAR_GAP);
  const prefs = profilePrefsUrl();
  const examples = formatYearExamples(args.missingLeaseStartYears);
  const subject = "Thanks for reviewing — maybe one more lease year?";
  const text = [
    "Hey —",
    "",
    `I’m the one behind Rent Review Boston — I launched it ${RETENTION_LAUNCH_TIMING}. Thanks again for already leaving a review; personally, that means a lot, and it’s what makes the database useful for the next person hunting in Boston.`,
    "",
    `Your profile says you started renting here in ${args.bostonRentingSinceYear}. From what I can see on our side, there are still lease-start years you’re allowed to write about that don’t have a review on your account yet — for example: ${examples}.`,
    "",
    "If that matches your situation (another lease year at the same place, a different address, etc.), you can add those as separate reviews. Same deal as before:",
    "",
    privacyReassuranceShort(),
    "",
    `Add a review: ${submit}`,
    "",
    "P.S. If a giveaway is running, you’ll see it on the submit page — official rules always apply.",
    "",
    `Rather not get emails like this? ${prefs}`,
    "",
    emailSignOff(),
  ].join("\n");

  return sendEmailViaResend({ to, subject, text });
}

export async function loadLeaseYearGapPayload(userId: string): Promise<{
  bostonRentingSinceYear: number;
  missingLeaseStartYears: number[];
} | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bostonRentingSinceYear: true,
      reviews: { select: { reviewYear: true } },
    },
  });
  if (u?.bostonRentingSinceYear == null) return null;
  const covered = new Set(u.reviews.map((r) => r.reviewYear));
  const allowed = reviewYearsAllowedForUser(u.bostonRentingSinceYear);
  const missing = allowed.filter((y) => !covered.has(y));
  if (missing.length === 0) return null;
  return {
    bostonRentingSinceYear: u.bostonRentingSinceYear,
    missingLeaseStartYears: missing,
  };
}
