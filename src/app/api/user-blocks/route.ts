import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const postSchema = z.object({
  blockedUserId: z.string().min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 401 });
  }

  const rows = await prisma.userBlock.findMany({
    where: { blockerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      blockedUserId: true,
      createdAt: true,
      blocked: {
        select: { id: true, email: true, displayName: true },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    blocks: rows.map((r) => ({
      blockedUserId: r.blockedUserId,
      createdAt: r.createdAt.toISOString(),
      displayName: r.blocked.displayName,
      email: r.blocked.email,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`user-block:${email}`, 40, 86_400_000);
  const rlIp = await rateLimit(`user-block:ip:${ip}`, 120, 86_400_000);
  if (!rl.ok || !rlIp.ok) {
    const retryAfterSec = Math.max(
      rl.ok ? 0 : rl.retryAfterSec,
      rlIp.ok ? 0 : rlIp.retryAfterSec,
    );
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const blocker = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: session?.user?.name ?? null },
    select: { id: true },
  });

  const { blockedUserId } = parsed.data;
  if (blockedUserId === blocker.id) {
    return NextResponse.json({ ok: false, error: "You can’t block yourself." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: blockedUserId },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  await prisma.userBlock.upsert({
    where: {
      blockerId_blockedUserId: {
        blockerId: blocker.id,
        blockedUserId,
      },
    },
    create: { blockerId: blocker.id, blockedUserId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  const blockedUserId = new URL(request.url).searchParams.get("blockedUserId")?.trim();
  if (!blockedUserId) {
    return NextResponse.json({ ok: false, error: "blockedUserId required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 401 });
  }

  await prisma.userBlock.deleteMany({
    where: { blockerId: user.id, blockedUserId },
  });

  return NextResponse.json({ ok: true });
}
