import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  review: { findMany: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("GET /api/reviews/public", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.review.findMany.mockResolvedValue([
      {
        id: "review-1",
        reviewYear: 2025,
        majorityYearAttested: true,
        body: "This is a long review body that should not be exposed in full to public API clients.",
      },
    ]);
  });

  it("returns teaser-safe review payloads without full body text", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/reviews/public"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      ok: boolean;
      reviews: Array<Record<string, unknown>>;
    };

    expect(body.ok).toBe(true);
    expect(body.reviews).toHaveLength(1);
    expect(body.reviews[0]).toHaveProperty("teaser");
    expect(body.reviews[0]).not.toHaveProperty("body");
    expect(body.reviews[0]).not.toHaveProperty("monthlyRent");
  });

  it("forwards propertyId filter to prisma query", async () => {
    const { GET } = await import("./route");
    await GET(new Request("http://localhost/api/reviews/public?propertyId=prop-123"));

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          moderationStatus: "APPROVED",
          propertyId: "prop-123",
        }),
      }),
    );
  });
});
