import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const getClientIpMock = vi.fn();
const rateLimitMock = vi.fn();

const prismaMock = {
  user: { upsert: vi.fn() },
  property: { upsert: vi.fn() },
  review: { findMany: vi.fn(), count: vi.fn() },
  $transaction: vi.fn(),
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

describe("POST /api/reviews/batch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { email: "renter@example.com", name: "Renter" } });
    getClientIpMock.mockReturnValue("127.0.0.1");
    rateLimitMock.mockResolvedValue({ ok: true, retryAfterSec: 0 });
  });

  it("returns 401 when unauthenticated", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: "123 E 4th St",
          city: "Boston",
          state: "MA",
          postalCode: "02127",
          bedroomCount: 1,
          bathrooms: 1,
          majorityYearAttestation: true,
          yearEntries: [{ reviewYear: 2025, monthlyRent: 2500 }],
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Please sign in before submitting a review.",
    });
  });

  it("returns 400 for non-Boston city", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: "10 Main St",
          city: "Cambridge",
          state: "MA",
          postalCode: "02139",
          bedroomCount: 1,
          bathrooms: 1,
          majorityYearAttestation: true,
          yearEntries: [{ reviewYear: 2025, monthlyRent: 2500 }],
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Only City of Boston addresses are supported in v1.",
    });
  });

  it("returns 400 when same lease-start year is duplicated in one batch", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: "123 E 4th St",
          city: "Boston",
          state: "MA",
          postalCode: "02127",
          bedroomCount: 2,
          bathrooms: 1.5,
          majorityYearAttestation: true,
          yearEntries: [
            { reviewYear: 2025, monthlyRent: 3200 },
            { reviewYear: 2025, monthlyRent: 3300 },
          ],
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Each lease-start year can only appear once in a batch.",
    });
  });
});
