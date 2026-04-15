import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeDigestSince,
  sendDailyActivityDigestEmail,
} from "@/lib/daily-activity-digest";

export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 8) return false;
  const auth = request.headers.get("authorization")?.trim();
  if (auth === `Bearer ${secret}`) return true;
  return (request.headers.get("x-cron-secret")?.trim() ?? "") === secret;
}

/** 6pm America/New_York — cron should run hourly; we no-op outside that window. */
function isDigestHourInEastern(): boolean {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  return hourStr === "18";
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

  if (!isDigestHourInEastern()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Outside6pm Eastern window for this run.",
    });
  }

  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "RESEND_API_KEY is not set; refusing to send digest emails in production.",
      },
      { status: 503 },
    );
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const users = await prisma.user.findMany({
    where: {
      messageEmailsOptOut: false,
    },
    select: {
      id: true,
      email: true,
      lastDailyDigestSentAt: true,
    },
  });

  let sent = 0;
  let failed = 0;
  let skippedEmpty = 0;

  for (const u of users) {
    if (!u.email) continue;
    const since = u.lastDailyDigestSentAt ?? weekAgo;
    const stats = await computeDigestSince(u.id, since);
    const empty =
      stats.helpfulVotesOnYourReviews === 0 && stats.messagesForYou === 0;
    let advanceCursor = empty;
    if (empty) {
      skippedEmpty += 1;
    } else {
      const result = await sendDailyActivityDigestEmail({ to: u.email, stats });
      if (result.ok) {
        sent += 1;
        advanceCursor = true;
      } else {
        failed += 1;
        console.error("[digest] send failed", u.id, result.error);
      }
    }

    if (advanceCursor) {
      await prisma.user.update({
        where: { id: u.id },
        data: { lastDailyDigestSentAt: now },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: users.length,
    sent,
    failed,
    skippedEmpty,
  });
}
