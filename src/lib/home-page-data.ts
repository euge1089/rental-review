import { PRODUCT_POLICY, SOUTH_BOSTON_ZIP_CODES } from "@/lib/policy";
import { prisma } from "@/lib/prisma";

export async function getHomePageData() {
  const [southBostonTop, approvedReviewCount, bostonPropertyCount] =
    await Promise.all([
      prisma.property.findMany({
        where: {
          city: PRODUCT_POLICY.geography.city,
          postalCode: { in: SOUTH_BOSTON_ZIP_CODES },
          reviews: {
            some: {
              moderationStatus: "APPROVED",
            },
          },
        },
        include: {
          _count: {
            select: { reviews: true },
          },
          reviews: {
            where: { moderationStatus: "APPROVED" },
            select: {
              monthlyRent: true,
              bedroomCount: true,
              bathrooms: true,
              reviewYear: true,
            },
            orderBy: { reviewYear: "desc" },
          },
        },
        orderBy: [
          {
            reviews: {
              _count: "desc",
            },
          },
        ],
        take: 4,
      }),
      prisma.review.count({
        where: { moderationStatus: "APPROVED" },
      }),
      prisma.property.count({
        where: { city: PRODUCT_POLICY.geography.city },
      }),
    ]);

  return { southBostonTop, approvedReviewCount, bostonPropertyCount };
}
