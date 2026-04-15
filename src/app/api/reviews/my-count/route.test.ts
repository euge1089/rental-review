import { beforeEach, describe, expect, it, vi } from "vitest";
import { PRODUCT_POLICY } from "@/lib/policy";

const getServerSessionMock = vi.fn();
const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("GET /api/reviews/my-count", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { email: "user@example.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ _count: { reviews: 2 } });
  });

  it("returns 401 when signed out", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Not signed in.",
    });
  });

  it("returns count and atCap=false when below limit", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ _count: { reviews: 3 } });
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      count: 3,
      max: PRODUCT_POLICY.reviews.maxReviewsPerUser,
      atCap: false,
    });
  });

  it("returns atCap=true when count reaches max", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      _count: { reviews: PRODUCT_POLICY.reviews.maxReviewsPerUser },
    });
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      atCap: true,
    });
  });
});
