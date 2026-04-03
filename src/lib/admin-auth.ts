import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function requireAdminSession(): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  if (!ADMIN_EMAIL) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "ADMIN_EMAIL is not configured." },
        { status: 500 },
      ),
    };
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 }),
    };
  }

  return { ok: true };
}
