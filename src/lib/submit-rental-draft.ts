import { snapBathroomsToAllowedDbValue } from "@/lib/policy";
import type { SubmitStepOnePrefill } from "@/lib/submit-prefill";

export const SUBMIT_DRAFT_VERSION = 2;

export type RentalCardState = {
  id: string;
  address: string;
  unit: string;
  postalCode: string;
  bedroomCount: number | null;
  bathrooms: number | null;
  hasParking: boolean;
  hasCentralHeatCooling: boolean;
  hasInUnitLaundry: boolean;
  hasStorageSpace: boolean;
  hasOutdoorSpace: boolean;
  petFriendly: boolean;
  selectedYears: number[];
  rentByYear: Record<number, string>;
  overallScore: number | null;
  landlordScore: number | null;
  reviewText: string;
  collapsed: boolean;
};

export function createRentalCardId(): string {
  return `rc_${Math.random().toString(36).slice(2, 12)}`;
}

export function emptyRentalCard(): RentalCardState {
  return {
    id: createRentalCardId(),
    address: "",
    unit: "",
    postalCode: "",
    bedroomCount: null,
    bathrooms: null,
    hasParking: false,
    hasCentralHeatCooling: false,
    hasInUnitLaundry: false,
    hasStorageSpace: false,
    hasOutdoorSpace: false,
    petFriendly: false,
    selectedYears: [],
    rentByYear: {},
    overallScore: null,
    landlordScore: null,
    reviewText: "",
    collapsed: false,
  };
}

export function prefillToRentalCard(prefill: SubmitStepOnePrefill): RentalCardState {
  const c = emptyRentalCard();
  c.address = prefill.address;
  c.unit = prefill.unit;
  c.postalCode = prefill.postalCode;
  c.bedroomCount = prefill.bedroomCount;
  c.bathrooms = snapBathroomsToAllowedDbValue(prefill.bathrooms) ?? prefill.bathrooms;
  c.hasParking = prefill.hasParking;
  c.hasCentralHeatCooling = prefill.hasCentralHeatCooling;
  c.hasInUnitLaundry = prefill.hasInUnitLaundry;
  c.hasStorageSpace = prefill.hasStorageSpace;
  c.hasOutdoorSpace = prefill.hasOutdoorSpace;
  c.petFriendly = prefill.petFriendly;
  return c;
}

/** Legacy v1 draft: normalize reviewYear + monthlyRent into leaseYears. */
function migrateLegacyLeaseYears(
  d: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...d };
  if (!Array.isArray(out.leaseYears)) {
    const yRaw = out.reviewYear;
    if (yRaw != null && String(yRaw).trim() !== "") {
      const y = Number(yRaw);
      out.leaseYears = Number.isNaN(y)
        ? []
        : [{ year: y, rent: String(out.monthlyRent ?? "") }];
    } else {
      out.leaseYears = [];
    }
  }
  delete out.reviewYear;
  delete out.monthlyRent;
  return out;
}

function parseLeaseYears(
  leaseYears: unknown,
): { years: number[]; rentByYear: Record<number, string> } {
  const years: number[] = [];
  const rentByYear: Record<number, string> = {};
  if (!Array.isArray(leaseYears)) return { years, rentByYear };
  for (const row of leaseYears as { year?: unknown; rent?: unknown }[]) {
    if (row && typeof row.year === "number") {
      years.push(row.year);
      if (row.rent != null && String(row.rent).trim() !== "") {
        rentByYear[row.year] = String(row.rent);
      }
    }
  }
  return { years: years.sort((a, b) => b - a), rentByYear };
}

function hydrateCardFromUnknown(raw: unknown): RentalCardState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const c = emptyRentalCard();
  if (typeof o.id === "string" && o.id.length > 0) c.id = o.id;
  c.address = typeof o.address === "string" ? o.address : "";
  c.unit = typeof o.unit === "string" ? o.unit : "";
  c.postalCode = typeof o.postalCode === "string" ? o.postalCode : "";
  if (typeof o.bedroomCount === "number" && Number.isFinite(o.bedroomCount)) {
    c.bedroomCount = o.bedroomCount;
  }
  if (typeof o.bathrooms === "number" && Number.isFinite(o.bathrooms)) {
    c.bathrooms = o.bathrooms;
  } else if (typeof o.bathrooms === "string" && o.bathrooms.trim() !== "") {
    const n = Number(o.bathrooms);
    if (!Number.isNaN(n)) c.bathrooms = n;
  }
  c.hasParking = Boolean(o.hasParking);
  c.hasCentralHeatCooling = Boolean(o.hasCentralHeatCooling);
  c.hasInUnitLaundry = Boolean(o.hasInUnitLaundry);
  c.hasStorageSpace = Boolean(o.hasStorageSpace);
  c.hasOutdoorSpace = Boolean(o.hasOutdoorSpace);
  c.petFriendly = Boolean(o.petFriendly);
  const { years, rentByYear } = parseLeaseYears(o.leaseYears);
  c.selectedYears = years;
  c.rentByYear = rentByYear;
  if (typeof o.overallScore === "number") c.overallScore = o.overallScore;
  else if (typeof o.overallScore === "string" && o.overallScore !== "") {
    const n = Number(o.overallScore);
    if (!Number.isNaN(n)) c.overallScore = n;
  }
  if (typeof o.landlordScore === "number") c.landlordScore = o.landlordScore;
  else if (typeof o.landlordScore === "string" && o.landlordScore !== "") {
    const n = Number(o.landlordScore);
    if (!Number.isNaN(n)) c.landlordScore = n;
  }
  c.reviewText = typeof o.reviewText === "string" ? o.reviewText : "";
  c.collapsed = Boolean(o.collapsed);
  return c;
}

export type HydratedSubmitDraft = {
  rentalCards: RentalCardState[];
  step: 1 | 2;
  majorityYearAttestation: boolean;
};

export function hydrateSubmitDraft(raw: unknown): HydratedSubmitDraft {
  const base: HydratedSubmitDraft = {
    rentalCards: [emptyRentalCard()],
    step: 1,
    majorityYearAttestation: false,
  };
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Record<string, unknown>;

  if (d.draftVersion === SUBMIT_DRAFT_VERSION && Array.isArray(d.rentalCards)) {
    const cards = d.rentalCards
      .map((x) => hydrateCardFromUnknown(x))
      .filter((c): c is RentalCardState => c != null);
    if (cards.length > 0) {
      base.rentalCards = cards;
    }
    if (d.step === 2) base.step = 2;
    base.majorityYearAttestation = Boolean(d.majorityYearAttestation);
    return base;
  }

  const legacy = migrateLegacyLeaseYears(d);
  const card = emptyRentalCard();
  card.address = String(legacy.address ?? "");
  card.unit = String(legacy.unit ?? "");
  card.postalCode = String(legacy.postalCode ?? "");
  const br = legacy.bedroomCount;
  if (br != null && br !== "" && !Number.isNaN(Number(br))) {
    card.bedroomCount = Number(br);
  }
  const bathRaw = legacy.bathrooms;
  if (bathRaw != null && String(bathRaw).trim() !== "") {
    const snapped = snapBathroomsToAllowedDbValue(Number(bathRaw));
    if (snapped != null) card.bathrooms = snapped;
  }
  card.hasParking = Boolean(legacy.hasParking);
  card.hasCentralHeatCooling = Boolean(legacy.hasCentralHeatCooling);
  card.hasInUnitLaundry = Boolean(legacy.hasInUnitLaundry);
  card.hasStorageSpace = Boolean(legacy.hasStorageSpace);
  card.hasOutdoorSpace = Boolean(legacy.hasOutdoorSpace);
  card.petFriendly = Boolean(legacy.petFriendly);
  const { years, rentByYear } = parseLeaseYears(legacy.leaseYears);
  card.selectedYears = years;
  card.rentByYear = rentByYear;
  const os = legacy.overallScore;
  const ls = legacy.landlordScore;
  if (typeof os === "number" || (typeof os === "string" && os !== "")) {
    const n = Number(os);
    if (!Number.isNaN(n)) card.overallScore = n;
  }
  if (typeof ls === "number" || (typeof ls === "string" && ls !== "")) {
    const n = Number(ls);
    if (!Number.isNaN(n)) card.landlordScore = n;
  }
  card.reviewText = String(legacy.reviewText ?? "");
  base.majorityYearAttestation = Boolean(legacy.majorityYearAttestation);
  if (d.step === 2) base.step = 2;
  base.rentalCards = [card];
  return base;
}

export function serializeSubmitDraft(input: {
  rentalCards: RentalCardState[];
  step: 1 | 2;
  majorityYearAttestation: boolean;
}): string {
  return JSON.stringify({
    draftVersion: SUBMIT_DRAFT_VERSION,
    step: input.step,
    majorityYearAttestation: input.majorityYearAttestation,
    rentalCards: input.rentalCards.map((c) => ({
      id: c.id,
      address: c.address,
      unit: c.unit,
      postalCode: c.postalCode,
      bedroomCount: c.bedroomCount,
      bathrooms: c.bathrooms,
      hasParking: c.hasParking,
      hasCentralHeatCooling: c.hasCentralHeatCooling,
      hasInUnitLaundry: c.hasInUnitLaundry,
      hasStorageSpace: c.hasStorageSpace,
      hasOutdoorSpace: c.hasOutdoorSpace,
      petFriendly: c.petFriendly,
      leaseYears: c.selectedYears.map((y) => ({
        year: y,
        rent: c.rentByYear[y] ?? "",
      })),
      overallScore: c.overallScore ?? "",
      landlordScore: c.landlordScore ?? "",
      reviewText: c.reviewText,
      collapsed: c.collapsed,
    })),
  });
}
