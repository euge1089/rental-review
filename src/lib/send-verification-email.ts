const RESEND_API = "https://api.resend.com/emails";

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const from =
    process.env.EMAIL_FROM ?? "Rent Review Boston <onboarding@resend.dev>";
  const subject = "Your verification code";
  const text = `Your Rent Review Boston verification code is: ${code}\n\nIt expires in 15 minutes. If you didn't request this, you can ignore this email.`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[email] Verification code for ${to} (RESEND_API_KEY not set): ${code}`,
      );
      return { ok: true };
    }
    return {
      ok: false,
      error:
        "Email is not configured. Set RESEND_API_KEY (and EMAIL_FROM with a verified domain in production).",
    };
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || res.statusText };
  }

  return { ok: true };
}
