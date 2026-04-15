import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminSessionMock = vi.fn();
const prismaMock = {
  user: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/admin-auth", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAdminSessionMock.mockResolvedValue({ ok: true });
    prismaMock.user.findMany.mockResolvedValue([]);
  });

  it("returns 403 and skips DB reads for non-admin requests", async () => {
    requireAdminSessionMock.mockResolvedValue({
      ok: false,
      response: Response.json({ ok: false, error: "Not authorized." }, { status: 403 }),
    });

    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Not authorized.",
    });
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("returns admin user list for authorized requests", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: "u-1",
        email: "user@example.com",
        displayName: "User",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        phoneVerified: false,
        bostonRentingSinceYear: 2022,
        _count: { reviews: 2 },
      },
    ]);

    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      users: [{ email: "user@example.com" }],
    });
    expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
  });
});
