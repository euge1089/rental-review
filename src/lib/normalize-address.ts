/** Stable key for property upsert / duplicate checks (matches review POST). */
export function normalizePropertyAddress(
  address: string,
  city: string,
  state: string,
): string {
  return `${address}, ${city}, ${state}`.trim().toLowerCase().replace(/\s+/g, " ");
}
