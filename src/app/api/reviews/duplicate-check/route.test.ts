import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const getClientIpMock = vi.fn();
const rateLimitMock = vi.fn();

const prismaMock = {
  user: { findUnique: vi.fn() },
  property: { findUnique: vi.fn() },
  review: { findUnique: vi.fn(), findMany: vi.fn() },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: getClientIpMock,
  rateLimit: rateLimitMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("POST /api/reviews/duplicate-check", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { email: "renter@example.com" } });
    getClientIpMock.mockReturnValue("127.0.0.1");
    rateLimitMock.mockResolvedValue({ ok: true, retryAfterSec: 0 });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      bostonRentingSinceYear: 2020,
    });
    prismaMock.property.findUnique.mockResolvedValue({ id: "property-1" });
    prismaMock.review.findUnique.mockResolvedValue({ id: "review-1" });
    prismaMock.review.findMany.mockResolvedValue([]);
  });

  it("returns 401 when not signed in", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/duplicate-check", {
        method: "POST",
        body: JSON.stringify({ address: "123 Main St", city: "Boston", state: "MA" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Please sign in.",
    });
  });

  it("returns exists=false for non-Boston checks", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/duplicate-check", {
        method: "POST",
        body: JSON.stringify({
          address: "99 Broadway",
          city: "Cambridge",
          state: "MA",
          reviewYear: 2025,
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, exists: false });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns duplicate review IDs for multi-year checks", async () => {
    prismaMock.review.findMany.mockResolvedValue([
      { id: "r-2024", reviewYear: 2024 },
      { id: "r-2022", reviewYear: 2022 },
    ]);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/duplicate-check", {
        method: "POST",
        body: JSON.stringify({
          address: "123 E 4th St",
          city: "Boston",
          state: "MA",
          reviewYears: [2024, 2023, 2022],
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      duplicates: [
        { reviewYear: 2024, reviewId: "r-2024" },
        { reviewYear: 2022, reviewId: "r-2022" },
      ],
    });
  });

  it("returns 429 when rate limited", async () => {
    rateLimitMock.mockResolvedValue({ ok: false, retryAfterSec: 120 });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/duplicate-check", {
        method: "POST",
        body: JSON.stringify({
          address: "123 E 4th St",
          city: "Boston",
          state: "MA",
          reviewYear: 2025,
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Too many checks. Try again later.",
    });
  });

  it("returns 400 for invalid payload missing year fields", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/duplicate-check", {
        method: "POST",
        body: JSON.stringify({
          address: "123 E 4th St",
          city: "Boston",
          state: "MA",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toContain("Provide reviewYear");
  });
});
