import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();

const prismaMock = {
  user: { findUnique: vi.fn() },
  review: { findMany: vi.fn() },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("POST /api/analytics/rent-explorer/map", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/analytics/rent-explorer/map", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns markers for authorized explorer users", async () => {
    getServerSessionMock.mockResolvedValue({ user: { email: "renter@example.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ _count: { reviews: 2 } });
    prismaMock.review.findMany.mockResolvedValue([
      {
        id: "r1",
        unit: "2A",
        bedroomCount: 2,
        monthlyRent: 3000,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        property: {
          id: "p1",
          addressLine1: "55 Broadway",
          city: "Boston",
          state: "MA",
          postalCode: "02127",
          latitude: { toNumber: () => 42.35001 },
          longitude: { toNumber: () => -71.04999 },
        },
      },
    ]);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/analytics/rent-explorer/map", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      ok: boolean;
      markers: Array<{ propertyId: string; reviewCount: number }>;
    };
    expect(data.ok).toBe(true);
    expect(data.markers).toHaveLength(1);
    expect(data.markers[0]).toMatchObject({ propertyId: "p1", reviewCount: 1 });
  });
});
