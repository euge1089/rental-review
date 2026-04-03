import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { checkSmsVerification } from "@/lib/sms";
import { authOptions } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  phoneNumber: z.string().min(10),
  code: z.string().min(4).max(10),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Please sign in before verifying your phone." },
        { status: 401 },
      );
    }

    const ip = getClientIp(request);
    const rl = await rateLimit(`sms:check:${ip}`, 60, 3_600_000);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many code checks. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        },
      );
    }

    const body = schema.parse(await request.json());
    const result = await checkSmsVerification(body.phoneNumber, body.code);

    if (result.status === "approved") {
      await prisma.user.upsert({
        where: { email },
        update: { phoneVerified: true },
        create: {
          email,
          displayName: session?.user?.name ?? null,
          phoneVerified: true,
        },
      });
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check SMS verification.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
