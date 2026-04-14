import { createHmac, timingSafeEqual } from "node:crypto";
import { getSiteOrigin } from "@/lib/site-origin";

function trackingSecret(): string | null {
  const s =
    process.env.RETENTION_TRACKING_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  return s && s.length >= 8 ? s : null;
}

/** Whether follow-up “never clicked” logic is reliable (needs signed links). */
export function retentionClickTrackingEnabled(): boolean {
  return trackingSecret() != null;
}

type Payload = { u: string; c: string; exp: number };

/**
 * Signed link → `/api/email/retention-go` → records click → redirects to `/submit`.
 * Falls back to plain `/submit` if no secret (follow-up audience should be empty in that case).
 */
export function retentionCtaUrl(userId: string, campaign: string): string {
  const secret = trackingSecret();
  const origin = getSiteOrigin();
  if (!secret) {
    return `${origin}/submit`;
  }
  const exp = Math.floor(Date.now() / 1000) + 90 * 24 * 3600;
  const body: Payload = { u: userId, c: campaign, exp };
  const payload = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  const sigBytes = createHmac("sha256", secret).update(payload).digest();
  const sig = sigBytes.toString("base64url");
  return `${origin}/api/email/retention-go?p=${encodeURIComponent(payload)}&s=${encodeURIComponent(sig)}`;
}

export function verifyRetentionPayload(
  payloadB64url: string,
  sigB64url: string,
): { ok: true; userId: string; campaign: string } | { ok: false } {
  const secret = trackingSecret();
  if (!secret) return { ok: false };

  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(sigB64url, "base64url");
  } catch {
    return { ok: false };
  }

  const expectedSig = createHmac("sha256", secret).update(payloadB64url).digest();
  if (sigBuf.length !== expectedSig.length) return { ok: false };
  if (!timingSafeEqual(sigBuf, expectedSig)) return { ok: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payloadB64url, "base64url").toString("utf8"));
  } catch {
    return { ok: false };
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Payload).u !== "string" ||
    typeof (parsed as Payload).c !== "string" ||
    typeof (parsed as Payload).exp !== "number"
  ) {
    return { ok: false };
  }
  const { u, c, exp } = parsed as Payload;
  if (exp < Math.floor(Date.now() / 1000)) return { ok: false };
  if (u.length > 40 || c.length > 80) return { ok: false };

  return { ok: true, userId: u, campaign: c };
}
