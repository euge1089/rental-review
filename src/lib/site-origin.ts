/** Public site origin for absolute links in emails (matches sitemap / robots). */
export function getSiteOrigin(): string {
  const raw = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";
  return raw.length > 0 ? raw : "http://localhost:3000";
}
