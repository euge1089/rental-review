import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const getClientIpMock = vi.fn();
const rateLimitMock = vi.fn();

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
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

describe("GET/PATCH /api/profile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { email: "user@example.com" } });
    getClientIpMock.mockReturnValue("127.0.0.1");
    rateLimitMock.mockResolvedValue({ ok: true, retryAfterSec: 0 });
    prismaMock.user.findUnique.mockResolvedValue({
      displayName: "Test User",
      bostonRentingSinceYear: null,
      phoneVerified: false,
      retentionEmailsOptOut: false,
    });
    prismaMock.user.update.mockResolvedValue({
      displayName: "Updated User",
      bostonRentingSinceYear: null,
      retentionEmailsOptOut: true,
    });
  });

  it("GET returns 401 when user is signed out", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Not signed in.",
    });
  });

  it("PATCH rejects changing boston year once already set", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ bostonRentingSinceYear: 2022 });
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bostonRentingSinceYear: 2024 }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error:
        "Your first Boston renting year is already set. Contact us if it needs to be corrected.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("PATCH updates display name and retention setting", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ bostonRentingSinceYear: null });
    prismaMock.user.update.mockResolvedValue({
      displayName: "Updated User",
      bostonRentingSinceYear: null,
      retentionEmailsOptOut: true,
    });
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: "  Updated User  ",
          retentionEmailsOptOut: true,
        }),
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      displayName: "Updated User",
      retentionEmailsOptOut: true,
    });
    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
  });
});
