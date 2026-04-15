import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  bookmark: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("GET/POST/DELETE /api/bookmarks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { email: "user@example.com", name: "User" } });
    prismaMock.user.findUnique.mockResolvedValue({ id: "user-1" });
    prismaMock.user.upsert.mockResolvedValue({ id: "user-1" });
    prismaMock.bookmark.findMany.mockResolvedValue([]);
    prismaMock.bookmark.upsert.mockResolvedValue({ id: "bookmark-1" });
    prismaMock.bookmark.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("GET returns 401 when signed out", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("POST returns 400 on invalid body", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/bookmarks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ badKey: "value" }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Invalid request body.",
    });
  });

  it("POST saves bookmark for signed-in user", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/bookmarks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId: "property-1" }),
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(prismaMock.bookmark.upsert).toHaveBeenCalledTimes(1);
  });

  it("DELETE removes bookmark for signed-in user", async () => {
    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/bookmarks", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId: "property-1" }),
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(prismaMock.bookmark.deleteMany).toHaveBeenCalledTimes(1);
  });
});
