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

/** Sign-off line. Override with RETENTION_EMAIL_SIGNER_NAME; defaults to Eugene. */
function emailSignOff(): string {
  const name = process.env.RETENTION_EMAIL_SIGNER_NAME?.trim() || "Eugene";
  return `- ${name}\nRent Review Boston`;
}

/**
 * Optional override for the “why I built this” bit (first no-review email only).
 * Default mentions timing - change via RETENTION_EMAIL_LAUNCH_LINE or edit when it’s no longer accurate.
 */
function founderHook(): string {
  const custom = process.env.RETENTION_EMAIL_LAUNCH_LINE?.trim();
  if (custom) return custom;
  return `My name is Eugene and I just launched Rent Review Boston ${RETENTION_LAUNCH_TIMING} to let people share real rent and honest apartment reviews (all the stuff you don't find out until moving in).`;
}

function privacyOneLiner(): string {
  return "Your name isn’t on the public review, and lease timing is broad (not your exact year), so it’s not obvious who wrote what.";
}

function giveawayPs(): string {
  return "P.S. We give away a couple hundred dollars worth of Boston gift cards on the last day of every month. We don’t have too many users yet, so odds are pretty good. Official rules are on the submit page.";
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraphHtml(text: string): string {
  return `<p style="margin:0 0 14px 0;line-height:1.5;">${escapeHtml(text)}</p>`;
}

function retentionEmailHtml(args: {
  lead: string;
  paragraphs: string[];
  ctaUrl: string;
  ctaLabel: string;
  footerLabel: string;
  footerUrl: string;
  signOffLines: string[];
}): string {
  const body = args.paragraphs.map(paragraphHtml).join("");
  const signOff = args.signOffLines.map((line) => escapeHtml(line)).join("<br />");
  return [
    '<div style="font-family:Arial,sans-serif;font-size:16px;color:#111827;">',
    paragraphHtml(args.lead),
    body,
    `<p style="margin:0 0 18px 0;"><a href="${escapeHtml(args.ctaUrl)}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600;">${escapeHtml(args.ctaLabel)}</a></p>`,
    `<p style="margin:0 0 14px 0;line-height:1.5;">${escapeHtml(args.footerLabel)} <a href="${escapeHtml(args.footerUrl)}">${escapeHtml(args.footerUrl)}</a></p>`,
    `<p style="margin:0;line-height:1.5;">${signOff}</p>`,
    "</div>",
  ].join("");
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

export async function sendNoReviewReminderEmail(
  to: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const submit = retentionCtaUrl(userId, RETENTION_CAMPAIGN_NO_REVIEW);
  const prefs = profilePrefsUrl();
  const subject = "Quick one-minute favor? (Rent Review Boston)";
  const text = [
    "Hey -",
    "",
    "Thanks for signing up!",
    "",
    founderHook(),
    "",
    "If you can spare a minute, would you mind leaving a review? Your name is always anonymous and we never show the year you lived there.",
    "",
    submit,
    "",
    "ALSO - I started a monthly giveaway with a couple hundred dollars worth of Boston gift cards on the last day of every month. We don’t have too many users yet, so odds are pretty good. Official rules are on the website.",
    "",
    `Reminders off anytime: ${prefs}`,
    "",
    emailSignOff(),
  ].join("\n");
  const html = retentionEmailHtml({
    lead: "Hey -",
    paragraphs: [
      "Thanks for signing up!",
      founderHook(),
      "If you can spare a minute, would you mind leaving a review? Your name is always anonymous and we never show the year you lived there.",
      "ALSO - I started a monthly giveaway with a couple hundred dollars worth of Boston gift cards on the last day of every month. We don’t have too many users yet, so odds are pretty good. Official rules are on the website.",
    ],
    ctaUrl: submit,
    ctaLabel: "Submit your review",
    footerLabel: "Reminders off anytime:",
    footerUrl: prefs,
    signOffLines: emailSignOff().split("\n"),
  });

  return sendEmailViaResend({ to, subject, text, html });
}

export async function sendNoReviewFollowupReminderEmail(
  to: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const submit = retentionCtaUrl(userId, RETENTION_CAMPAIGN_NO_REVIEW_FOLLOWUP);
  const prefs = profilePrefsUrl();
  const subject = "Bump: one-minute review?";
  const text = [
    "Hey -",
    "",
    `I sent you a quick email ${noReviewFollowupHumanTimePhrase()} - sending a quick follow up in case it got buried.`,
    "",
    "Hoping you could spare a minute to leave a quick rental review! Your name is always anonymous and we never show the year you lived there.",
    "",
    submit,
    "",
    "ALSO - I started a monthly giveaway with a couple hundred dollars worth of Boston gift cards on the last day of every month. We don’t have too many users yet, so odds are pretty good. Official rules are on the website.",
    "",
    `Reminders off: ${prefs}`,
    "",
    emailSignOff(),
  ].join("\n");
  const html = retentionEmailHtml({
    lead: "Hey -",
    paragraphs: [
      `I sent you a quick email ${noReviewFollowupHumanTimePhrase()} - sending a quick follow up in case it got buried.`,
      "Hoping you could spare a minute to leave a quick rental review! Your name is always anonymous and we never show the year you lived there.",
      "ALSO - I started a monthly giveaway with a couple hundred dollars worth of Boston gift cards on the last day of every month. We don’t have too many users yet, so odds are pretty good. Official rules are on the website.",
    ],
    ctaUrl: submit,
    ctaLabel: "Submit your review",
    footerLabel: "Reminders off:",
    footerUrl: prefs,
    signOffLines: emailSignOff().split("\n"),
  });

  return sendEmailViaResend({ to, subject, text, html });
}

export async function sendLeaseYearGapReminderEmail(
  to: string,
  args: { bostonRentingSinceYear: number; missingLeaseStartYears: number[] },
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const submit = retentionCtaUrl(userId, RETENTION_CAMPAIGN_LEASE_YEAR_GAP);
  const prefs = profilePrefsUrl();
  const subject = "You could add another lease year?";
  const text = [
    "Hey -",
    "",
    "Thanks for leaving a review for Rent Review Boston! You're officially entered in our monthly giveaway for a couple hundred dollars worth of Boston gift cards on the last day of every month.",
    "",
    `You get one entry for each review you leave (and each review really helps other renters). You’re set as renting in Boston since ${args.bostonRentingSinceYear}, so you can still add reviews for other years that you've lived in Boston! We'd really appreciate it if you can spare a minute to add some more.`,
    "",
    "Same anonymity as before. Your name and lease year are never published and always kept secure.",
    "",
    submit,
    "",
    `Fewer emails: ${prefs}`,
    "",
    emailSignOff(),
  ].join("\n");
  const html = retentionEmailHtml({
    lead: "Hey -",
    paragraphs: [
      "Thanks for leaving a review for Rent Review Boston! You're officially entered in our monthly giveaway for a couple hundred dollars worth of Boston gift cards on the last day of every month.",
      `You get one entry for each review you leave (and each review really helps other renters). You’re set as renting in Boston since ${args.bostonRentingSinceYear}, so you can still add reviews for other years that you've lived in Boston! We'd really appreciate it if you can spare a minute to add some more.`,
      "Same anonymity as before. Your name and lease year are never published and always kept secure.",
    ],
    ctaUrl: submit,
    ctaLabel: "Add another lease year",
    footerLabel: "Fewer emails:",
    footerUrl: prefs,
    signOffLines: emailSignOff().split("\n"),
  });

  return sendEmailViaResend({ to, subject, text, html });
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
