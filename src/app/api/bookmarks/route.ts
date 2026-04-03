import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  propertyId: z.string(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to view saved apartments." },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ ok: true, bookmarks: [] });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: {
          id: true,
          addressLine1: true,
          city: true,
          state: true,
          postalCode: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    bookmarks: bookmarks.map((b) => ({
      id: b.property.id,
      addressLine1: b.property.addressLine1,
      city: b.property.city,
      state: b.property.state,
      postalCode: b.property.postalCode,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to save apartments." },
      { status: 401 },
    );
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: session?.user?.name ?? null },
  });

  const body = bodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { propertyId } = body.data;

  await prisma.bookmark.upsert({
    where: {
      userId_propertyId: {
        userId: user.id,
        propertyId,
      },
    },
    update: {},
    create: {
      userId: user.id,
      propertyId,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to manage saved apartments." },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const body = bodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { propertyId } = body.data;

  await prisma.bookmark.deleteMany({
    where: {
      userId: user.id,
      propertyId,
    },
  });

  return NextResponse.json({ ok: true });
}

