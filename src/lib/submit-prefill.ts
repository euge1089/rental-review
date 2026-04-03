/**
 * Step 1 submit prefill stored in localStorage for “another lease year” flows
 * (`/submit?another=1`, profile → submit).
 */
export const SUBMIT_STEP1_PREFILL_KEY = "rental-review-submit-step1-prefill-v1";

export type SubmitStepOnePrefill = {
  address: string;
  unit: string;
  postalCode: string;
  bedroomCount: number;
  bathrooms: number;
  hasParking: boolean;
  hasCentralHeatCooling: boolean;
  hasInUnitLaundry: boolean;
  hasStorageSpace: boolean;
  hasOutdoorSpace: boolean;
  petFriendly: boolean;
};

export type SubmitPayloadForPrefill = {
  address: string;
  unit?: string;
  postalCode: string;
  bedroomCount: number;
  bathrooms: number;
  hasParking: boolean;
  hasCentralHeatCooling: boolean;
  hasInUnitLaundry: boolean;
  hasStorageSpace: boolean;
  hasOutdoorSpace: boolean;
  petFriendly: boolean;
};

export function buildPrefillFromSubmitPayload(
  payload: SubmitPayloadForPrefill,
): SubmitStepOnePrefill {
  return {
    address: payload.address.trim(),
    unit: (payload.unit ?? "").trim(),
    postalCode: payload.postalCode.trim(),
    bedroomCount: payload.bedroomCount,
    bathrooms: payload.bathrooms,
    hasParking: payload.hasParking,
    hasCentralHeatCooling: payload.hasCentralHeatCooling,
    hasInUnitLaundry: payload.hasInUnitLaundry,
    hasStorageSpace: payload.hasStorageSpace,
    hasOutdoorSpace: payload.hasOutdoorSpace,
    petFriendly: payload.petFriendly,
  };
}

/** Minimal review + property shape for Step 1 prefill (profile, etc.). */
export type SubmitPrefillReviewSource = {
  unit: string | null;
  bedroomCount: number | null;
  bathrooms: number | null;
  hasParking: boolean;
  hasCentralHeatCooling: boolean;
  hasInUnitLaundry: boolean;
  hasStorageSpace: boolean;
  hasOutdoorSpace: boolean;
  petFriendly: boolean;
  property: {
    addressLine1: string;
    postalCode: string | null;
  };
};

/** Build prefill from an existing review row (e.g. profile). */
export function buildPrefillFromReviewRow(
  review: SubmitPrefillReviewSource,
): SubmitStepOnePrefill {
  return {
    address: review.property.addressLine1.trim(),
    unit: (review.unit ?? "").trim(),
    postalCode: (review.property.postalCode ?? "").trim(),
    bedroomCount: review.bedroomCount ?? 0,
    bathrooms: review.bathrooms ?? 1,
    hasParking: review.hasParking,
    hasCentralHeatCooling: review.hasCentralHeatCooling,
    hasInUnitLaundry: review.hasInUnitLaundry,
    hasStorageSpace: review.hasStorageSpace,
    hasOutdoorSpace: review.hasOutdoorSpace,
    petFriendly: review.petFriendly,
  };
}

export function applySubmitStepOnePrefill(
  form: HTMLFormElement,
  prefill: SubmitStepOnePrefill,
) {
  const setIf = (name: string, value: string | number | boolean) => {
    const field = form.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | null;
    if (!field) return;
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = String(value);
    }
  };

  setIf("address", prefill.address);
  setIf("unit", prefill.unit);
  setIf("postalCode", prefill.postalCode);
  setIf("bathrooms", prefill.bathrooms);

  const radios = form.querySelectorAll<HTMLInputElement>('input[name="bedroomCount"]');
  radios.forEach((r) => {
    r.checked = String(r.value) === String(prefill.bedroomCount);
  });

  setIf("hasParking", prefill.hasParking);
  setIf("hasCentralHeatCooling", prefill.hasCentralHeatCooling);
  setIf("hasInUnitLaundry", prefill.hasInUnitLaundry);
  setIf("hasStorageSpace", prefill.hasStorageSpace);
  setIf("hasOutdoorSpace", prefill.hasOutdoorSpace);
  setIf("petFriendly", prefill.petFriendly);
}
