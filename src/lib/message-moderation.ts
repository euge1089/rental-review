/**
 * Lightweight server-side filter for DM content. Blocks obvious profanity;
 * not a substitute for human moderation or reporting.
 */
const PROFANITY_PATTERN =
  /\b(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|c+u+n+t+|a+s+s+h+o+l+e+|d+i+c+k+h+e+a+d+|b+a+s+t+a+r+d+|p+r+i+c+k+|s+l+u+t+|w+h+o+r+e+)\b/i;

export function messageContainsBlockedLanguage(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return PROFANITY_PATTERN.test(t);
}

export function assertMessageContentAllowed(text: string): { ok: true } | { ok: false; error: string } {
  if (messageContainsBlockedLanguage(text)) {
    return {
      ok: false,
      error:
        "This message contains language that isn’t allowed. Please revise and try again.",
    };
  }
  return { ok: true };
}
