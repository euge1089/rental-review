import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminSessionMock = vi.fn();
const prismaMock = {
  review: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/admin-auth", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("GET /api/admin/reviews", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAdminSessionMock.mockResolvedValue({ ok: true });
    prismaMock.review.findMany.mockResolvedValue([]);
  });

  it("returns 403 and does not query prisma when unauthorized", async () => {
    requireAdminSessionMock.mockResolvedValue({
      ok: false,
      response: Response.json({ ok: false, error: "Not authorized." }, { status: 403 }),
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/reviews"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Not authorized.",
    });
    expect(prismaMock.review.findMany).not.toHaveBeenCalled();
  });

  it("returns ok payload for authorized admin", async () => {
    prismaMock.review.findMany.mockResolvedValue([
      {
        id: "r-1",
        propertyId: "p-1",
        userId: "u-1",
        reviewYear: 2025,
        monthlyRent: 3000,
        bedroomCount: 1,
        bathrooms: 1,
        unit: "2A",
        overallScore: 8,
        landlordScore: 7,
        majorityYearAttested: true,
        moderationStatus: "APPROVED",
        moderationReasons: [],
        body: "Helpful review",
        property: { addressLine1: "123 Main St", city: "Boston", state: "MA" },
        user: { email: "user@example.com", displayName: "User" },
      },
    ]);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/reviews"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      total: 1,
    });
    expect(prismaMock.review.findMany).toHaveBeenCalledTimes(1);
  });
});
