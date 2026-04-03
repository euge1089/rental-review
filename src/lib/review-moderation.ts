import { PRODUCT_POLICY } from "@/lib/policy";

export type ModerationOutcome = {
  moderationStatus: "APPROVED" | "PENDING_REVIEW";
  moderationReasons: string[];
  userMessage: string;
};

export function resolveReviewModeration(
  detectedNames: string[],
  phoneVerified: boolean,
): ModerationOutcome {
  if (detectedNames.length > 0) {
    return {
      moderationStatus: "PENDING_REVIEW",
      moderationReasons: [`Detected names: ${detectedNames.join(", ")}`],
      userMessage: PRODUCT_POLICY.reviews.pendingNamesUserMessage,
    };
  }
  if (phoneVerified) {
    return {
      moderationStatus: "APPROVED",
      moderationReasons: [],
      userMessage: PRODUCT_POLICY.reviews.liveNowUserMessage,
    };
  }
  return {
    moderationStatus: "PENDING_REVIEW",
    moderationReasons: [PRODUCT_POLICY.moderation.manualReviewReasonUnverified],
    userMessage: PRODUCT_POLICY.reviews.pendingManualReviewMessage,
  };
}
