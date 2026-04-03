import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { startSmsVerification } from "@/lib/sms";
import { authOptions } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  phoneNumber: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Please sign in before starting SMS verification." },
        { status: 401 },
      );
    }

    const ip = getClientIp(request);
    const rlIp = await rateLimit(`sms:start:ip:${ip}`, 20, 3_600_000);
    const rlUser = await rateLimit(`sms:start:user:${email}`, 10, 86_400_000);
    if (!rlIp.ok || !rlUser.ok) {
      const retryAfterSec = Math.max(
        rlIp.ok ? 0 : rlIp.retryAfterSec,
        rlUser.ok ? 0 : rlUser.retryAfterSec,
      );
      return NextResponse.json(
        { ok: false, error: "Too many SMS verification starts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        },
      );
    }

    const body = schema.parse(await request.json());
    await startSmsVerification(body.phoneNumber);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start SMS verification.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
