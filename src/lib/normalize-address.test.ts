import { describe, expect, it } from "vitest";
import {
  formatAddressLine1ForDisplay,
  geocodeQueryAddress,
  normalizePropertyAddress,
  stripUnitFromAddressLine1,
} from "./normalize-address";

describe("normalize-address helpers", () => {
  it("expands street suffixes in display format", () => {
    expect(formatAddressLine1ForDisplay("123 e 4th st")).toBe(
      "123 E 4th Street",
    );
    expect(formatAddressLine1ForDisplay("55 broadway apt 2")).toBe(
      "55 Broadway Apt 2",
    );
  });

  it("normalizes property keys for duplicate checks", () => {
    expect(normalizePropertyAddress("123 E 4th St.", " Boston ", " MA ")).toBe(
      "123 e 4th street, boston, ma",
    );
  });

  it("strips unit fragments before geocoding", () => {
    expect(stripUnitFromAddressLine1("55 Broadway Apt 2")).toBe("55 Broadway");
    expect(stripUnitFromAddressLine1("10 Main St #3")).toBe("10 Main St");
    expect(stripUnitFromAddressLine1("100 A St Suite 400")).toBe("100 A St");
    expect(stripUnitFromAddressLine1("25 W 3rd St Floor 2")).toBe("25 W 3rd St");
    expect(stripUnitFromAddressLine1("75 Dorchester Ave")).toBe("75 Dorchester Ave");
  });

  it("builds canonical geocode query with postal code", () => {
    expect(geocodeQueryAddress("55 Broadway Apt 2", "Boston", "MA", "02127")).toBe(
      "55 Broadway, Boston, MA, 02127",
    );
  });
});
