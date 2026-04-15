import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const assertReviewYearMeetsBostonFloorMock = vi.fn();
const detectLikelyPersonNamesMock = vi.fn();
const resolveReviewModerationMock = vi.fn();

const prismaMock = {
  review: {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/review-boston-floor", () => ({
  assertReviewYearMeetsBostonFloor: assertReviewYearMeetsBostonFloorMock,
}));

vi.mock("@/lib/moderation", () => ({
  detectLikelyPersonNames: detectLikelyPersonNamesMock,
}));

vi.mock("@/lib/review-moderation", () => ({
  resolveReviewModeration: resolveReviewModerationMock,
}));

describe("PATCH/DELETE /api/reviews/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { email: "owner@example.com" } });
    assertReviewYearMeetsBostonFloorMock.mockReturnValue({ ok: true });
    detectLikelyPersonNamesMock.mockReturnValue([]);
    resolveReviewModerationMock.mockReturnValue({
      moderationStatus: "APPROVED",
      moderationReasons: [],
      userMessage: "Saved.",
    });
    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      user: {
        email: "owner@example.com",
        phoneVerified: true,
        bostonRentingSinceYear: 2020,
      },
      bedroomCount: 1,
      hasParking: false,
      hasCentralHeatCooling: false,
      hasInUnitLaundry: false,
      hasStorageSpace: false,
      hasOutdoorSpace: false,
      petFriendly: false,
    });
    prismaMock.review.update.mockResolvedValue({ id: "review-1" });
    prismaMock.review.delete.mockResolvedValue({ id: "review-1" });
  });

  it("PATCH returns 404 when signed-in user does not own review", async () => {
    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      user: { email: "someoneelse@example.com", phoneVerified: true, bostonRentingSinceYear: 2020 },
    });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/reviews/review-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reviewYear: 2025,
          bathrooms: 1,
          majorityYearAttestation: true,
        }),
      }),
      { params: Promise.resolve({ id: "review-1" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Review not found.",
    });
    expect(prismaMock.review.update).not.toHaveBeenCalled();
  });

  it("PATCH allows owner to edit review", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/reviews/review-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reviewYear: 2025,
          bathrooms: 1.5,
          monthlyRent: 3200,
          majorityYearAttestation: true,
        }),
      }),
      { params: Promise.resolve({ id: "review-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      reviewId: "review-1",
    });
    expect(prismaMock.review.update).toHaveBeenCalledTimes(1);
  });

  it("DELETE returns 404 when signed-in user does not own review", async () => {
    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      user: { email: "someoneelse@example.com" },
    });

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/reviews/review-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "review-1" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Review not found.",
    });
    expect(prismaMock.review.delete).not.toHaveBeenCalled();
  });

  it("DELETE allows owner to remove review", async () => {
    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/reviews/review-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "review-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(prismaMock.review.delete).toHaveBeenCalledWith({ where: { id: "review-1" } });
  });
});
