import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import { verifyPassword } from "@/lib/password";
import {
  generateSixDigitCode,
  hashVerificationCode,
} from "@/lib/verification-code";
import { sendVerificationEmail } from "@/lib/send-verification-email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const VERIFY_COOLDOWN_MS = 60_000;
const CODE_TTL_MS = 15 * 60_000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`auth:resend:${ip}`, 12, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many resend requests. Try again later." },
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
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { ok: false, error: "No pending email account for this address." },
      { status: 404 },
    );
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json(
      { ok: false, error: "This email is already verified. Sign in." },
      { status: 409 },
    );
  }

  if (!verifyPassword(parsed.password, user.passwordHash)) {
    return NextResponse.json(
      { ok: false, error: "Wrong password." },
      { status: 401 },
    );
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
    return NextResponse.json(
      { ok: false, error: sent.error },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
