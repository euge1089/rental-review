import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteOrigin } from "@/lib/site-origin";
import { verifyRetentionPayload } from "@/lib/retention-tracking";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = url.searchParams.get("p");
  const s = url.searchParams.get("s");
  const origin = getSiteOrigin();
  const fallback = NextResponse.redirect(new URL("/submit", origin), 302);

  if (!p || !s) {
    return fallback;
  }

  const verified = verifyRetentionPayload(p, s);
  if (!verified.ok) {
    return fallback;
  }

  try {
    await prisma.retentionEmailClick.upsert({
      where: {
        userId_campaign: {
          userId: verified.userId,
          campaign: verified.campaign,
        },
      },
      create: {
        userId: verified.userId,
        campaign: verified.campaign,
      },
      update: {},
    });
  } catch (err) {
    console.error("[retention-go] click upsert failed", err);
  }

  return NextResponse.redirect(new URL("/submit", origin), 302);
}
