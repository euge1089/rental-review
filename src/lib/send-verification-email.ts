import { sendEmailViaResend } from "@/lib/send-email-resend";

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const subject = "Your verification code";
  const text = `Your Rent Review Boston verification code is: ${code}\n\nIt expires in 15 minutes. If you didn't request this, you can ignore this email.`;
  const result = await sendEmailViaResend({ to, subject, text });
  if (
    result.ok &&
    process.env.NODE_ENV === "development" &&
    !process.env.RESEND_API_KEY
  ) {
    console.info(`[email] Verification code for ${to}: ${code}`);
  }
  return result;
}
