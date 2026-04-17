import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { reviews: true } },
      reviews: {
        where: { moderationStatus: "APPROVED" },
        select: {
          monthlyRent: true,
          hasParking: true,
          hasCentralHeatCooling: true,
          hasInUnitLaundry: true,
          hasStorageSpace: true,
          hasOutdoorSpace: true,
          petFriendly: true,
        },
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

    const amenityCounts = [
      {
        label: "In-unit laundry",
        count: property.reviews.filter((r) => r.hasInUnitLaundry).length,
      },
      { label: "Parking", count: property.reviews.filter((r) => r.hasParking).length },
      {
        label: "Central HVAC",
        count: property.reviews.filter((r) => r.hasCentralHeatCooling).length,
      },
      { label: "Storage", count: property.reviews.filter((r) => r.hasStorageSpace).length },
      {
        label: "Outdoor space",
        count: property.reviews.filter((r) => r.hasOutdoorSpace).length,
      },
      {
        label: "Pet-friendly",
        count: property.reviews.filter((r) => r.petFriendly).length,
      },
    ]
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((x) => x.label);

    return {
      id: property.id,
      addressLine1: property.addressLine1,
      city: property.city,
      state: property.state,
      postalCode: property.postalCode,
      reviewCount: property._count.reviews,
      averageRent,
      topAmenities: amenityCounts,
      createdAt: property.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ ok: true, properties });
}

