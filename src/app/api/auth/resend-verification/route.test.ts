import { beforeEach, describe, expect, it, vi } from "vitest";

const getClientIpMock = vi.fn();
const rateLimitMock = vi.fn();
const verifyPasswordMock = vi.fn();
const sendVerificationEmailMock = vi.fn();
const generateSixDigitCodeMock = vi.fn();
const hashVerificationCodeMock = vi.fn();

const prismaMock = {
  user: { findUnique: vi.fn() },
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

vi.mock("@/lib/password", () => ({
  verifyPassword: verifyPasswordMock,
}));

vi.mock("@/lib/send-verification-email", () => ({
  sendVerificationEmail: sendVerificationEmailMock,
}));

vi.mock("@/lib/verification-code", () => ({
  generateSixDigitCode: generateSixDigitCodeMock,
  hashVerificationCode: hashVerificationCodeMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getClientIpMock.mockReturnValue("127.0.0.1");
    rateLimitMock.mockResolvedValue({ ok: true, retryAfterSec: 0 });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u-1",
      email: "person@example.com",
      passwordHash: "stored-hash",
      emailVerifiedAt: null,
    });
    prismaMock.emailVerification.findFirst.mockResolvedValue({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    prismaMock.emailVerification.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.emailVerification.create.mockResolvedValue({ id: "ev-1" });
    verifyPasswordMock.mockReturnValue(true);
    sendVerificationEmailMock.mockResolvedValue({ ok: true });
    generateSixDigitCodeMock.mockReturnValue("123456");
    hashVerificationCodeMock.mockReturnValue("hashed-code");
  });

  it("returns 401 when password is wrong", async () => {
    verifyPasswordMock.mockReturnValue(false);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "person@example.com", password: "wrong-password" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Wrong password.",
    });
  });

  it("returns 200 and sends a new code", async () => {
    prismaMock.emailVerification.findFirst.mockResolvedValue({
      createdAt: new Date("2000-01-01T00:00:00.000Z"),
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "person@example.com", password: "correct-password" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(prismaMock.emailVerification.create).toHaveBeenCalledTimes(1);
    expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1);
  });
});
