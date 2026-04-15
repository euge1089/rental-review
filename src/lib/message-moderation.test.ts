import { describe, expect, it } from "vitest";
import {
  assertMessageContentAllowed,
  messageContainsBlockedLanguage,
} from "@/lib/message-moderation";

describe("message-moderation", () => {
  it("allows plain text", () => {
    expect(messageContainsBlockedLanguage("Hello, is parking included?")).toBe(
      false,
    );
    expect(assertMessageContentAllowed("Thanks for the tip.").ok).toBe(true);
  });

  it("flags obvious profanity", () => {
    expect(messageContainsBlockedLanguage("this is shit")).toBe(true);
    expect(assertMessageContentAllowed("this is shit").ok).toBe(false);
  });
});
