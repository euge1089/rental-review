import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      phoneVerified: true,
      bostonRentingSinceYear: true,
      _count: { select: { reviews: true } },
    },
  });

  return NextResponse.json({ ok: true, users });
}
