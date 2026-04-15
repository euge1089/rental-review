/**
 * Messaging / DMs UI (nav, property CTAs, inbox routes). APIs remain available.
 * Set `NEXT_PUBLIC_MESSAGES_UI=true` in `.env.local` / Vercel when ready to ship.
 */
export const messagesUiEnabled =
  process.env.NEXT_PUBLIC_MESSAGES_UI === "true";
