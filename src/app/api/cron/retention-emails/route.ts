import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  RETENTION_CAMPAIGN_LEASE_YEAR_GAP,
  RETENTION_CAMPAIGN_NO_REVIEW,
  RETENTION_CAMPAIGN_NO_REVIEW_FOLLOWUP,
  findUsersForLeaseYearGapReminder,
  findUsersForNoReviewFollowup,
  findUsersForNoReviewReminder,
  loadLeaseYearGapPayload,
  sendLeaseYearGapReminderEmail,
  sendNoReviewFollowupReminderEmail,
  sendNoReviewReminderEmail,
} from "@/lib/retention-emails";

export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 8) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "RESEND_API_KEY is not set; refusing to run retention emails in production.",
      },
      { status: 503 },
    );
  }

  const noReviewUsers = await findUsersForNoReviewReminder();
  let noReviewSent = 0;
  let noReviewFailed = 0;

  for (const u of noReviewUsers) {
    const result = await sendNoReviewReminderEmail(u.email, u.id);
    if (result.ok) {
      await prisma.retentionEmailLog.create({
        data: { userId: u.id, campaign: RETENTION_CAMPAIGN_NO_REVIEW },
      });
      noReviewSent += 1;
    } else {
      console.error("[retention] NO_REVIEW send failed", u.id, result.error);
      noReviewFailed += 1;
    }
  }

  const noReviewFollowupUsers = await findUsersForNoReviewFollowup();
  let noReviewFollowupSent = 0;
  let noReviewFollowupFailed = 0;

  for (const u of noReviewFollowupUsers) {
    const result = await sendNoReviewFollowupReminderEmail(u.email, u.id);
    if (result.ok) {
      await prisma.retentionEmailLog.create({
        data: { userId: u.id, campaign: RETENTION_CAMPAIGN_NO_REVIEW_FOLLOWUP },
      });
      noReviewFollowupSent += 1;
    } else {
      console.error(
        "[retention] NO_REVIEW_FOLLOWUP send failed",
        u.id,
        result.error,
      );
      noReviewFollowupFailed += 1;
    }
  }

  const gapUsers = await findUsersForLeaseYearGapReminder();
  let gapSent = 0;
  let gapFailed = 0;
  let gapSkipped = 0;

  for (const u of gapUsers) {
    const payload = await loadLeaseYearGapPayload(u.id);
    if (payload == null) {
      gapSkipped += 1;
      continue;
    }
    const result = await sendLeaseYearGapReminderEmail(u.email, payload, u.id);
    if (result.ok) {
      await prisma.retentionEmailLog.create({
        data: { userId: u.id, campaign: RETENTION_CAMPAIGN_LEASE_YEAR_GAP },
      });
      gapSent += 1;
    } else {
      console.error("[retention] LEASE_YEAR_GAP send failed", u.id, result.error);
      gapFailed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    noReview: {
      candidates: noReviewUsers.length,
      sent: noReviewSent,
      failed: noReviewFailed,
    },
    noReviewFollowup: {
      candidates: noReviewFollowupUsers.length,
      sent: noReviewFollowupSent,
      failed: noReviewFollowupFailed,
    },
    leaseYearGap: {
      candidates: gapUsers.length,
      sent: gapSent,
      failed: gapFailed,
      skippedStale: gapSkipped,
    },
  });
}
