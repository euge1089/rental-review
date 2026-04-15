import { beforeEach, describe, expect, it, vi } from "vitest";

const getClientIpMock = vi.fn();
const rateLimitMock = vi.fn();
const verifyVerificationCodeMock = vi.fn();

const prismaMock = {
  emailVerification: {
    findFirst: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: getClientIpMock,
  rateLimit: rateLimitMock,
}));

vi.mock("@/lib/verification-code", () => ({
  verifyVerificationCode: verifyVerificationCodeMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getClientIpMock.mockReturnValue("127.0.0.1");
    rateLimitMock.mockResolvedValue({ ok: true, retryAfterSec: 0 });
    prismaMock.emailVerification.findFirst.mockResolvedValue({
      id: "ev-1",
      email: "person@example.com",
      codeHash: "hashed-code",
      attempts: 0,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });
    prismaMock.emailVerification.update.mockResolvedValue({ id: "ev-1" });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u-1",
      email: "person@example.com",
      passwordHash: "password-hash",
    });
    prismaMock.user.update.mockResolvedValue({ id: "u-1" });
    prismaMock.emailVerification.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.$transaction.mockResolvedValue([]);
    verifyVerificationCodeMock.mockReturnValue(true);
  });

  it("returns 401 and increments attempts when code is incorrect", async () => {
    verifyVerificationCodeMock.mockReturnValue(false);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "person@example.com", code: "123456" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Incorrect code.",
    });
    expect(prismaMock.emailVerification.update).toHaveBeenCalledTimes(1);
  });

  it("returns 200 and verifies account on valid code", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "person@example.com", code: "123456" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });
});
