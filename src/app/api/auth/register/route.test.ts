import { beforeEach, describe, expect, it, vi } from "vitest";

const getClientIpMock = vi.fn();
const rateLimitMock = vi.fn();
const sendVerificationEmailMock = vi.fn();

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  emailVerification: {
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: getClientIpMock,
  rateLimit: rateLimitMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/send-verification-email", () => ({
  sendVerificationEmail: sendVerificationEmailMock,
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getClientIpMock.mockReturnValue("127.0.0.1");
    rateLimitMock.mockResolvedValue({ ok: true, retryAfterSec: 0 });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "u-1" });
    prismaMock.user.update.mockResolvedValue({ id: "u-1" });
    prismaMock.user.delete.mockResolvedValue({ id: "u-1" });
    prismaMock.emailVerification.findFirst.mockResolvedValue(null);
    prismaMock.emailVerification.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.emailVerification.create.mockResolvedValue({ id: "ev-1" });
    sendVerificationEmailMock.mockResolvedValue({ ok: true });
  });

  it("returns 409 when a verified password account already exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u-existing",
      emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
      passwordHash: "hash",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "already@exists.com",
          password: "VerySecurePass1",
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "An account with this email already exists. Sign in instead.",
    });
  });

  it("creates user + verification and returns ok for new account", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "new-user@example.com",
          password: "VerySecurePass1",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; email: string };
    expect(body.ok).toBe(true);
    expect(body.email).toBe("new-user@example.com");
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.emailVerification.create).toHaveBeenCalledTimes(1);
    expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1);
  });
});
