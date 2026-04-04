import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { normalizePropertyAddress } from "@/lib/normalize-address";
import { prisma } from "@/lib/prisma";
import { PRODUCT_POLICY } from "@/lib/policy";
import { assertReviewYearMeetsBostonFloor } from "@/lib/review-boston-floor";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  address: z.string().min(5),
  city: z.string().default("Boston"),
  state: z.string().default("MA"),
  reviewYear: z.number().int().min(2017),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Please sign in." },
      { status: 401 },
    );
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`review:dup:${ip}:${email}`, 120, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many checks. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  try {
    const raw = await request.json();
    const body = bodySchema.parse(raw);

    if (body.city.toLowerCase() !== PRODUCT_POLICY.geography.city.toLowerCase()) {
      return NextResponse.json({
        ok: true,
        exists: false,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: true, exists: false });
    }

    const floorCheck = assertReviewYearMeetsBostonFloor(
      body.reviewYear,
      user.bostonRentingSinceYear,
    );
    if (!floorCheck.ok) {
      return NextResponse.json(
        { ok: false, error: floorCheck.error },
        { status: 400 },
      );
    }

    const normalizedAddress = normalizePropertyAddress(
      body.address,
      body.city,
      body.state,
    );

    const property = await prisma.property.findUnique({
      where: { normalizedAddress },
    });

    if (!property) {
      return NextResponse.json({ ok: true, exists: false });
    }

    const review = await prisma.review.findUnique({
      where: {
        propertyId_userId_reviewYear: {
          propertyId: property.id,
          userId: user.id,
          reviewYear: body.reviewYear,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      exists: Boolean(review),
      reviewId: review?.id ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check duplicate.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
