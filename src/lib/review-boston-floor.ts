/** User must set `bostonRentingSinceYear` before writing reviews. */
export const PROFILE_BOSTON_YEAR_REQUIRED_MESSAGE =
  "Before you submit a review, open your profile and tell us the first year you started renting in Boston.";

export function reviewYearBelowBostonFloorMessage(floor: number): string {
  return `Based on your profile, you started renting in Boston in ${floor}. Lease-start years before ${floor} aren’t available for your account. If that’s a mistake, contact us — an admin can update it.`;
}

export function assertReviewYearMeetsBostonFloor(
  reviewYear: number,
  floor: number | null,
): { ok: true } | { ok: false; error: string } {
  if (floor == null) {
    return { ok: false, error: PROFILE_BOSTON_YEAR_REQUIRED_MESSAGE };
  }
  if (reviewYear < floor) {
    return { ok: false, error: reviewYearBelowBostonFloorMessage(floor) };
  }
  return { ok: true };
}
