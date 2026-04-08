/** End of April 30 Eastern (May 1, 2026 00:00:00 America/New_York, EDT). */
export const GIVEAWAY_PROMO_END_MS = Date.parse("2026-05-01T04:00:00.000Z");

export function isGiveawayPromoActive(now = Date.now()): boolean {
  return now < GIVEAWAY_PROMO_END_MS;
}
