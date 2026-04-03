import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const now = new Date();

  const paths = [
    "",
    "/how-it-works",
    "/properties",
    "/submit",
    "/tour-checklist",
    "/signin",
    "/neighborhoods/south-boston",
    "/legal/terms",
    "/legal/privacy",
  ] as const;

  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : ("monthly" as const),
    priority: path === "" ? 1 : 0.7,
  }));
}
