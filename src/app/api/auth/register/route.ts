import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  generateSixDigitCode,
  hashVerificationCode,
} from "@/lib/verification-code";
import { sendVerificationEmail } from "@/lib/send-verification-email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const VERIFY_COOLDOWN_MS = 60_000;
const CODE_TTL_MS = 15 * 60_000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`auth:register:${ip}`, 8, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many sign-up attempts. Try again later." },
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
  const passwordHashNew = hashPassword(parsed.password);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.emailVerifiedAt && existing.passwordHash) {
    return NextResponse.json(
      {
        ok: false,
        error: "An account with this email already exists. Sign in instead.",
      },
      { status: 409 },
    );
  }

  if (existing && !existing.passwordHash) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "This email is linked to Google sign-in. Please continue with Google.",
      },
      { status: 409 },
    );
  }

  if (existing?.passwordHash && !existing.emailVerifiedAt) {
    const match = verifyPassword(parsed.password, existing.passwordHash);
    if (!match) {
      return NextResponse.json(
        { ok: false, error: "Wrong password for this email." },
        { status: 401 },
      );
    }
  }

  if (!existing) {
    await prisma.user.create({
      data: { email, passwordHash: passwordHashNew },
    });
  } else {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: passwordHashNew },
    });
  }

  const latest = await prisma.emailVerification.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < VERIFY_COOLDOWN_MS) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please wait a minute before requesting another code.",
      },
      { status: 429 },
    );
  }

  await prisma.emailVerification.deleteMany({ where: { email } });

  const code = generateSixDigitCode();
  const codeHash = hashVerificationCode(code);

  await prisma.emailVerification.create({
    data: {
      email,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  const sent = await sendVerificationEmail(email, code);
  if (!sent.ok) {
    await prisma.emailVerification.deleteMany({ where: { email } });
    if (!existing) {
      await prisma.user.delete({ where: { email } }).catch(() => {});
    }
    return NextResponse.json(
      { ok: false, error: sent.error },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, email });
}
