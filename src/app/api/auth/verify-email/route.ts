import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import { verifyVerificationCode } from "@/lib/verification-code";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`auth:verify:${ip}`, 40, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many verification attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.email);

  const row = await prisma.emailVerification.findFirst({
    where: {
      email,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    return NextResponse.json(
      { ok: false, error: "Code expired or not found. Request a new one." },
      { status: 400 },
    );
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Request a new code." },
      { status: 429 },
    );
  }

  const valid = verifyVerificationCode(parsed.code, row.codeHash);
  if (!valid) {
    await prisma.emailVerification.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ ok: false, error: "Incorrect code." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return NextResponse.json(
      { ok: false, error: "No password account for this email." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerification.deleteMany({ where: { email } }),
  ]);

  return NextResponse.json({ ok: true });
}
