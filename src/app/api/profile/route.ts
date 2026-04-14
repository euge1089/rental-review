import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import { isValidBostonRentingSinceYear } from "@/lib/policy";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const patchSchema = z
  .object({
    displayName: z.string().max(120).optional(),
    bostonRentingSinceYear: z.number().int().optional(),
    retentionEmailsOptOut: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.displayName !== undefined ||
      d.bostonRentingSinceYear !== undefined ||
      d.retentionEmailsOptOut !== undefined,
    { message: "No updates." },
  );

export async function GET() {
  const session = await getServerSession(authOptions);
  const emailRaw = session?.user?.email;
  if (!emailRaw) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const email = normalizeEmail(emailRaw);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      displayName: true,
      bostonRentingSinceYear: true,
      phoneVerified: true,
      retentionEmailsOptOut: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...user });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const emailRaw = session?.user?.email;
  if (!emailRaw) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const email = normalizeEmail(emailRaw);

  const ip = getClientIp(request);
  const rl = await rateLimit(`profile:patch:${email}`, 30, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many updates. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  let parsed: z.infer<typeof patchSchema>;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { bostonRentingSinceYear: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  const data: {
    displayName?: string | null;
    bostonRentingSinceYear?: number;
    retentionEmailsOptOut?: boolean;
  } = {};

  if (parsed.displayName !== undefined) {
    const trimmed = parsed.displayName.trim();
    data.displayName = trimmed.length === 0 ? null : trimmed;
  }

  if (parsed.bostonRentingSinceYear !== undefined) {
    if (existing.bostonRentingSinceYear != null) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Your first Boston renting year is already set. Contact us if it needs to be corrected.",
        },
        { status: 400 },
      );
    }
    if (!isValidBostonRentingSinceYear(parsed.bostonRentingSinceYear)) {
      return NextResponse.json(
        { ok: false, error: "Pick one of the listed years." },
        { status: 400 },
      );
    }
    data.bostonRentingSinceYear = parsed.bostonRentingSinceYear;
  }

  if (parsed.retentionEmailsOptOut !== undefined) {
    data.retentionEmailsOptOut = parsed.retentionEmailsOptOut;
  }

  const updated = await prisma.user.update({
    where: { email },
    data,
    select: {
      displayName: true,
      bostonRentingSinceYear: true,
      retentionEmailsOptOut: true,
    },
  });

  return NextResponse.json({
    ok: true,
    displayName: updated.displayName,
    bostonRentingSinceYear: updated.bostonRentingSinceYear,
    retentionEmailsOptOut: updated.retentionEmailsOptOut,
  });
}
