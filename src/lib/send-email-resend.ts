const RESEND_API = "https://api.resend.com/emails";

export type ResendSendInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Sends via Resend when RESEND_API_KEY is set; in development without a key, logs only.
 */
export async function sendEmailViaResend(
  input: ResendSendInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const from =
    process.env.EMAIL_FROM ?? "Rent Review Boston <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[email] (RESEND_API_KEY not set) to=${input.to} subject=${input.subject}`,
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
      to: [input.to],
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || res.statusText };
  }

  return { ok: true };
}
