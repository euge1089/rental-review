import { prisma } from "@/lib/prisma";
import { sendEmailViaResend } from "@/lib/send-email-resend";

function siteBaseUrl() {
  const raw = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export type DigestStats = {
  helpfulVotesOnYourReviews: number;
  messagesForYou: number;
};

export async function computeDigestSince(
  userId: string,
  since: Date,
): Promise<DigestStats> {
  const [helpfulVotesOnYourReviews, messagesForYou] = await Promise.all([
    prisma.reviewVote.count({
      where: {
        value: 1,
        createdAt: { gt: since },
        review: { userId },
      },
    }),
    prisma.reviewThreadMessage.count({
      where: {
        createdAt: { gt: since },
        senderUserId: { not: userId },
        thread: {
          OR: [{ starterUserId: userId }, { review: { userId } }],
        },
      },
    }),
  ]);

  return { helpfulVotesOnYourReviews, messagesForYou };
}

export async function sendDailyActivityDigestEmail(input: {
  to: string;
  stats: DigestStats;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { helpfulVotesOnYourReviews, messagesForYou } = input.stats;
  if (helpfulVotesOnYourReviews === 0 && messagesForYou === 0) {
    return { ok: true };
  }

  const base = siteBaseUrl();
  const analyticsUrl = `${base}/analytics`;
  const messagesUrl = `${base}/messages`;

  const voteLine =
    helpfulVotesOnYourReviews === 0
      ? ""
      : helpfulVotesOnYourReviews === 1
        ? "Your review received 1 new “helpful” vote from other renters."
        : `Your reviews received ${helpfulVotesOnYourReviews} new “helpful” votes from other renters.`;

  const msgLine =
    messagesForYou === 0
      ? ""
      : messagesForYou === 1
        ? "You have 1 new private message from another renter."
        : `You have ${messagesForYou} new private messages from other renters.`;

  const lines = [voteLine, msgLine].filter(Boolean);
  const text = `${lines.join(" ")}\n\nRental analytics: ${analyticsUrl}\nMessages: ${messagesUrl}\n\nYou can turn off these summary emails in your profile (Email preferences).`;

  const htmlParts: string[] = [];
  if (voteLine) {
    htmlParts.push(`<p>${escapeHtml(voteLine)}</p>`);
  }
  if (msgLine) {
    htmlParts.push(`<p>${escapeHtml(msgLine)}</p>`);
  }
  htmlParts.push(
    `<p><a href="${escapeAttr(analyticsUrl)}">Open rental analytics</a> · <a href="${escapeAttr(messagesUrl)}">Open messages</a></p>`,
  );
  htmlParts.push(
    `<p style="font-size:12px;color:#666;">You can turn off these summary emails in your profile under Email preferences.</p>`,
  );

  return sendEmailViaResend({
    to: input.to,
    subject: "Your Rent Review Boston activity summary",
    text,
    html: htmlParts.join(""),
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
