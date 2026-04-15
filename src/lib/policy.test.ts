import { describe, expect, it } from "vitest";
import {
  bathroomsToBaAbbrev,
  bathroomsToPublicLabel,
  getBostonRentingSinceYearChoices,
  isValidBostonRentingSinceYear,
  reviewYearsAllowedForUser,
  snapBathroomsToAllowedDbValue,
} from "./policy";

describe("policy helpers", () => {
  it("returns the last 10 calendar years from now", () => {
    const now = new Date("2026-04-15T00:00:00.000Z");
    expect(getBostonRentingSinceYearChoices(now)).toEqual([
      2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017,
    ]);
  });

  it("validates boston renting year against generated choices", () => {
    const now = new Date("2026-04-15T00:00:00.000Z");
    expect(isValidBostonRentingSinceYear(2022, now)).toBe(true);
    expect(isValidBostonRentingSinceYear(2015, now)).toBe(false);
  });

  it("restricts review years by profile start year", () => {
    expect(reviewYearsAllowedForUser(2024)).toEqual([2026, 2025, 2024]);
    expect(reviewYearsAllowedForUser(null)).toEqual([]);
  });

  it("snaps bathroom counts to supported storage buckets", () => {
    expect(snapBathroomsToAllowedDbValue(null)).toBeNull();
    expect(snapBathroomsToAllowedDbValue(1.2)).toBe(1);
    expect(snapBathroomsToAllowedDbValue(1.7)).toBe(1.5);
    expect(snapBathroomsToAllowedDbValue(2.1)).toBe(2);
    expect(snapBathroomsToAllowedDbValue(2.6)).toBe(2.5);
    expect(snapBathroomsToAllowedDbValue(3.25)).toBe(4);
  });

  it("formats bathrooms for public and explorer labels", () => {
    expect(bathroomsToPublicLabel(1)).toBe("1 bath");
    expect(bathroomsToPublicLabel(4)).toBe("3+ baths");
    expect(bathroomsToBaAbbrev(4)).toBe("3+ BA");
    expect(bathroomsToBaAbbrev(2.5)).toBe("2.5 BA");
  });
});
