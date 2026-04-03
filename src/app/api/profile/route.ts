import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const patchSchema = z.object({
  displayName: z.string().max(120),
});

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

  const trimmed = parsed.displayName.trim();
  const displayName = trimmed.length === 0 ? null : trimmed;

  await prisma.user.update({
    where: { email },
    data: { displayName },
  });

  return NextResponse.json({ ok: true, displayName });
}
