import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { normalizePropertyAddress } from "@/lib/normalize-address";
import { prisma } from "@/lib/prisma";
import { PRODUCT_POLICY } from "@/lib/policy";
import { assertReviewYearMeetsBostonFloor } from "@/lib/review-boston-floor";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z
  .object({
    address: z.string().min(5),
    city: z.string().default("Boston"),
    state: z.string().default("MA"),
    reviewYear: z.number().int().min(2017).optional(),
    reviewYears: z.array(z.number().int().min(2017)).min(1).max(20).optional(),
  })
  .refine(
    (d) =>
      d.reviewYear != null ||
      (Array.isArray(d.reviewYears) && d.reviewYears.length > 0),
    { message: "Provide reviewYear or a non-empty reviewYears array." },
  );

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
      if (body.reviewYears && body.reviewYears.length > 0) {
        return NextResponse.json({ ok: true, duplicates: [] });
      }
      return NextResponse.json({
        ok: true,
        exists: false,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      if (body.reviewYears && body.reviewYears.length > 0) {
        return NextResponse.json({ ok: true, duplicates: [] });
      }
      return NextResponse.json({ ok: true, exists: false });
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
      if (body.reviewYears && body.reviewYears.length > 0) {
        return NextResponse.json({ ok: true, duplicates: [] });
      }
      return NextResponse.json({ ok: true, exists: false });
    }

    if (body.reviewYears && body.reviewYears.length > 0) {
      const uniqueYears = [...new Set(body.reviewYears)];
      for (const y of uniqueYears) {
        const floorCheck = assertReviewYearMeetsBostonFloor(
          y,
          user.bostonRentingSinceYear,
        );
        if (!floorCheck.ok) {
          return NextResponse.json(
            { ok: false, error: floorCheck.error },
            { status: 400 },
          );
        }
      }

      const reviews = await prisma.review.findMany({
        where: {
          propertyId: property.id,
          userId: user.id,
          reviewYear: { in: uniqueYears },
        },
        select: { id: true, reviewYear: true },
      });

      const duplicates = reviews.map((r) => ({
        reviewYear: r.reviewYear,
        reviewId: r.id,
      }));

      return NextResponse.json({
        ok: true,
        duplicates,
      });
    }

    const singleYear = body.reviewYear;
    if (singleYear == null) {
      return NextResponse.json(
        { ok: false, error: "Provide reviewYear or reviewYears." },
        { status: 400 },
      );
    }
    const floorCheck = assertReviewYearMeetsBostonFloor(
      singleYear,
      user.bostonRentingSinceYear,
    );
    if (!floorCheck.ok) {
      return NextResponse.json(
        { ok: false, error: floorCheck.error },
        { status: 400 },
      );
    }

    const review = await prisma.review.findUnique({
      where: {
        propertyId_userId_reviewYear: {
          propertyId: property.id,
          userId: user.id,
          reviewYear: singleYear,
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
