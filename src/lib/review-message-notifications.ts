import { prisma } from "@/lib/prisma";
import { sendEmailViaResend } from "@/lib/send-email-resend";

function siteBaseUrl() {
  const raw = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export async function notifyNewReviewThreadMessage(input: {
  threadId: string;
  senderUserId: string;
  messagePreview: string;
}): Promise<void> {
  const thread = await prisma.reviewMessageThread.findUnique({
    where: { id: input.threadId },
    select: {
      starterUserId: true,
      review: {
        select: {
          userId: true,
          property: { select: { addressLine1: true } },
        },
      },
    },
  });
  if (!thread) return;

  const recipientId =
    input.senderUserId === thread.starterUserId
      ? thread.review.userId
      : thread.starterUserId;

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { email: true, messageEmailsOptOut: true },
  });
  if (!recipient?.email || recipient.messageEmailsOptOut) return;

  const url = `${siteBaseUrl()}/messages/thread/${input.threadId}`;
  const address = thread.review.property.addressLine1;
  const preview =
    input.messagePreview.length > 200
      ? `${input.messagePreview.slice(0, 197)}…`
      : input.messagePreview;

  await sendEmailViaResend({
    to: recipient.email,
    subject: `New message about ${address}`,
    text: `You have a new private message about a review at ${address}.\n\nPreview: ${preview}\n\nOpen the conversation: ${url}\n\nYou can turn off these emails in your profile under Email preferences.`,
    html: `<p>You have a new private message about a review at <strong>${escapeHtml(address)}</strong>.</p><blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;">${escapeHtml(preview)}</blockquote><p><a href="${escapeAttr(url)}">Open the conversation</a></p><p style="font-size:12px;color:#666;">You can turn off these emails in your profile under Email preferences.</p>`,
  });
}

export async function notifyThreadAccepted(input: {
  threadId: string;
  starterUserId: string;
  propertyAddress: string;
}): Promise<void> {
  const recipient = await prisma.user.findUnique({
    where: { id: input.starterUserId },
    select: { email: true, messageEmailsOptOut: true },
  });
  if (!recipient?.email || recipient.messageEmailsOptOut) return;

  const threadUrl = `${siteBaseUrl()}/messages/thread/${input.threadId}`;

  await sendEmailViaResend({
    to: recipient.email,
    subject: `Your message was accepted · ${input.propertyAddress}`,
    text: `The review author accepted your conversation about ${input.propertyAddress}. You can keep the thread going here: ${threadUrl}`,
    html: `<p>The review author accepted your conversation about <strong>${escapeHtml(input.propertyAddress)}</strong>.</p><p><a href="${escapeAttr(threadUrl)}">Open the conversation</a></p>`,
  });
}

export async function notifyThreadDeclined(input: {
  threadId: string;
  starterUserId: string;
  propertyAddress: string;
}): Promise<void> {
  const recipient = await prisma.user.findUnique({
    where: { id: input.starterUserId },
    select: { email: true, messageEmailsOptOut: true },
  });
  if (!recipient?.email || recipient.messageEmailsOptOut) return;

  await sendEmailViaResend({
    to: recipient.email,
    subject: `Conversation declined · ${input.propertyAddress}`,
    text: `The review author declined a private conversation about ${input.propertyAddress}. No further messages will be delivered in that thread.`,
    html: `<p>The review author declined a private conversation about <strong>${escapeHtml(input.propertyAddress)}</strong>. No further messages will be delivered in that thread.</p>`,
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
