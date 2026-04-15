import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const getClientIpMock = vi.fn();
const rateLimitMock = vi.fn();

const prismaMock = {
  review: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    upsert: vi.fn(),
  },
  reviewReport: {
    findUnique: vi.fn(),
    create: vi.fn(),
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

describe("POST /api/reviews/[id]/report", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { email: "user@example.com", name: "User" } });
    getClientIpMock.mockReturnValue("127.0.0.1");
    rateLimitMock.mockResolvedValue({ ok: true, retryAfterSec: 0 });
    prismaMock.review.findUnique.mockResolvedValue({
      id: "review-1",
      moderationStatus: "APPROVED",
      moderationReasons: [],
    });
    prismaMock.user.upsert.mockResolvedValue({ id: "user-1" });
    prismaMock.reviewReport.findUnique.mockResolvedValue(null);
    prismaMock.review.update.mockResolvedValue({ id: "review-1" });
    prismaMock.reviewReport.create.mockResolvedValue({ id: "report-1" });
  });

  it("returns 401 for unauthenticated users", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/review-1/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Contains private name details" }),
      }),
      { params: Promise.resolve({ id: "review-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("prevents duplicate reports by same user", async () => {
    prismaMock.reviewReport.findUnique.mockResolvedValue({ id: "existing-report" });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/review-1/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Contains private name details" }),
      }),
      { params: Promise.resolve({ id: "review-1" }) },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "You have already reported this review.",
    });
    expect(prismaMock.reviewReport.create).not.toHaveBeenCalled();
  });

  it("creates a report and returns ok", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/reviews/review-1/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Contains private name details" }),
      }),
      { params: Promise.resolve({ id: "review-1" }) },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(prismaMock.review.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.reviewReport.create).toHaveBeenCalledTimes(1);
  });
});
