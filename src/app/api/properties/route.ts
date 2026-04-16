import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { reviews: true } },
      reviews: {
        where: { moderationStatus: "APPROVED" },
        select: { monthlyRent: true },
      },
    },
    take: 200,
  });

  const properties = rows.map((property) => {
    const rents = property.reviews
      .map((r) => r.monthlyRent)
      .filter((v): v is number => typeof v === "number");
    const averageRent =
      rents.length > 0
        ? Math.round(rents.reduce((sum, v) => sum + v, 0) / rents.length)
        : null;

    return {
      id: property.id,
      addressLine1: property.addressLine1,
      city: property.city,
      state: property.state,
      postalCode: property.postalCode,
      reviewCount: property._count.reviews,
      averageRent,
      createdAt: property.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ ok: true, properties });
}

