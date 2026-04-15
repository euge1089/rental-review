import { describe, expect, it, vi } from "vitest";

const detectLikelyPersonNamesMock = vi.fn();
const requiresModerationQueueMock = vi.fn();

vi.mock("@/lib/moderation", () => ({
  detectLikelyPersonNames: detectLikelyPersonNamesMock,
  requiresModerationQueue: requiresModerationQueueMock,
}));

describe("POST /api/moderation/check", () => {
  it("returns moderation decision and detected names", async () => {
    detectLikelyPersonNamesMock.mockReturnValue(["John"]);
    requiresModerationQueueMock.mockReturnValue(true);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/moderation/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewText: "John was our landlord." }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      requiresModeration: true,
      detectedNames: ["John"],
    });
  });
});
