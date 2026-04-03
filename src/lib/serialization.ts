/** Logged-out / public API: no rent, scores, unit, or full body — aligns with teaser-only positioning. */
export type PublicReviewPayload = {
  id: string;
  reviewYear: number;
  majorityYearAttested: boolean;
  teaser: string | null;
};

export type AdminReviewPayload = {
  id: string;
  propertyId: string;
  userId: string;
  reviewYear: number;
  monthlyRent: number | null;
  bathrooms: number | null;
  unit: string | null;
  overallScore: number | null;
  landlordScore: number | null;
  majorityYearAttested: boolean;
  moderationStatus: string;
  moderationReasons: string[];
  body: string | null;
  property: {
    addressLine1: string;
    city: string;
    state: string;
  };
  user: {
    email: string;
    displayName: string | null;
  };
};

function buildTeaser(body: string | null | undefined, maxLength = 140): string | null {
  if (!body) return null;
  if (body.length <= maxLength) return body;
  return `${body.slice(0, maxLength)}…`;
}

/**
 * Default-safe serializer for exposing reviews in public or member APIs.
 * Never includes reviewer email or full body text.
 */
export function serializeReviewForPublic(input: {
  id: string;
  reviewYear: number;
  majorityYearAttested: boolean;
  body: string | null;
}): PublicReviewPayload {
  return {
    id: input.id,
    reviewYear: input.reviewYear,
    majorityYearAttested: input.majorityYearAttested,
    teaser: buildTeaser(input.body),
  };
}

/**
 * Serializer for admin-only contexts. Includes full body and reviewer email.
 */
export function serializeReviewForAdmin(input: {
  id: string;
  propertyId: string;
  userId: string;
  reviewYear: number;
  monthlyRent: number | null;
  bathrooms: number | null;
  unit: string | null;
  overallScore: number | null;
  landlordScore: number | null;
  majorityYearAttested: boolean;
  moderationStatus: string;
  moderationReasons: string[];
  body: string | null;
  property: {
    addressLine1: string;
    city: string;
    state: string;
  };
  user: {
    email: string;
    displayName: string | null;
  };
}): AdminReviewPayload {
  return {
    id: input.id,
    propertyId: input.propertyId,
    userId: input.userId,
    reviewYear: input.reviewYear,
    monthlyRent: input.monthlyRent,
    bathrooms: input.bathrooms,
    unit: input.unit,
    overallScore: input.overallScore,
    landlordScore: input.landlordScore,
    majorityYearAttested: input.majorityYearAttested,
    moderationStatus: input.moderationStatus,
    moderationReasons: input.moderationReasons,
    body: input.body,
    property: {
      addressLine1: input.property.addressLine1,
      city: input.property.city,
      state: input.property.state,
    },
    user: {
      email: input.user.email,
      displayName: input.user.displayName,
    },
  };
}

