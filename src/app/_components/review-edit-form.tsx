"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BATHROOM_SUBMIT_OPTIONS,
  BEDROOM_SUBMIT_OPTIONS,
  PRODUCT_POLICY,
  reviewYearsAllowedForUser,
  snapBathroomsToAllowedDbValue,
} from "@/lib/policy";
import {
  formInputCompactClass,
  formSelectCompactClass,
  formTextareaClass,
  surfaceElevatedClass,
} from "@/lib/ui-classes";

type Props = {
  reviewId: string;
  /** Minimum lease-start year from profile; null = not set (should not happen for editors). */
  minLeaseStartYear: number | null;
  initial: {
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyPostalCode: string | null;
    reviewYear: number;
    bedroomCount: number | null;
    unit: string | null;
    monthlyRent: number | null;
    bathrooms: number | null;
    hasParking: boolean;
    hasCentralHeatCooling: boolean;
    hasInUnitLaundry: boolean;
    hasStorageSpace: boolean;
    hasOutdoorSpace: boolean;
    petFriendly: boolean;
    overallScore: number | null;
    landlordScore: number | null;
    body: string | null;
    displayFullyAnonymous: boolean;
  };
};

export function ReviewEditForm({ reviewId, minLeaseStartYear, initial }: Props) {
  const yearOptions = useMemo(() => {
    if (minLeaseStartYear == null) return [];
    const allowed = reviewYearsAllowedForUser(minLeaseStartYear);
    if (!allowed.includes(initial.reviewYear)) {
      return [...allowed, initial.reviewYear].sort((a, b) => b - a);
    }
    return allowed;
  }, [minLeaseStartYear, initial.reviewYear]);
  const initialBathsSnapped = useMemo(
    () => snapBathroomsToAllowedDbValue(initial.bathrooms),
    [initial.bathrooms],
  );
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setStatusMessage("");

    const form = new FormData(event.currentTarget);

    const payload = {
      reviewYear: Number(form.get("year")),
      bedroomCount: Number(form.get("bedroomCount")),
      unit: String(form.get("unit") ?? "").trim() || undefined,
      monthlyRent: Number(form.get("monthlyRent")) || undefined,
      bathrooms: (() => {
        const raw = form.get("bathrooms");
        if (raw == null || raw === "") return undefined;
        const n = Number(raw);
        return Number.isNaN(n) ? undefined : n;
      })(),
      hasParking: form.get("hasParking") === "on",
      hasCentralHeatCooling: form.get("hasCentralHeatCooling") === "on",
      hasInUnitLaundry: form.get("hasInUnitLaundry") === "on",
      hasStorageSpace: form.get("hasStorageSpace") === "on",
      hasOutdoorSpace: form.get("hasOutdoorSpace") === "on",
      petFriendly: form.get("petFriendly") === "on",
      overallScore: Number(form.get("overallScore")) || undefined,
      landlordScore: Number(form.get("landlordScore")) || undefined,
      reviewText: String(form.get("reviewText") ?? ""),
      majorityYearAttestation: form.get("majorityYearAttestation") === "on",
      displayFullyAnonymous: form.get("displayFullyAnonymous") === "on",
    };

    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as {
      ok: boolean;
      error?: string;
      moderationStatus?: string;
      userMessage?: string;
    };

    if (!result.ok) {
      setStatusMessage(result.error ?? "Could not update review.");
      setIsSaving(false);
      return;
    }

    setStatusMessage(
      result.userMessage ??
        (result.moderationStatus === "PENDING_REVIEW"
          ? "Updated — your review is being reviewed."
          : "Review updated successfully."),
    );

    setIsSaving(false);
    router.push("/profile");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${surfaceElevatedClass} space-y-5 p-6 sm:p-8`}
    >
      {minLeaseStartYear == null ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Set the first year you rented in Boston on{" "}
          <Link href="/profile" className="font-semibold text-muted-blue hover:underline">
            your profile
          </Link>{" "}
          before editing this review.
        </div>
      ) : null}
      <div>
        <p className="text-sm font-medium text-zinc-900">
          {initial.propertyAddress}
        </p>
        <p className="text-xs text-zinc-600">
          {initial.propertyCity}, {initial.propertyState}{" "}
          {initial.propertyPostalCode ?? ""}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-2">
          <label htmlFor="unit" className="text-sm font-medium">
            Apartment / unit (optional)
          </label>
          <input
            id="unit"
            name="unit"
            defaultValue={initial.unit ?? ""}
            placeholder="e.g. Apt 3B"
            className={formInputCompactClass}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="year" className="text-sm font-medium">
            Lease start year
          </label>
          <select
            id="year"
            name="year"
            defaultValue={String(initial.reviewYear)}
            className={formSelectCompactClass}
            disabled={yearOptions.length === 0}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            {PRODUCT_POLICY.reviews.leaseStartYearRule}
          </p>
          {minLeaseStartYear != null ? (
            <p className="text-xs text-zinc-500">
              Choices start at {minLeaseStartYear} based on your profile.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">Bedrooms</p>
        <div className="flex flex-wrap gap-2">
          {BEDROOM_SUBMIT_OPTIONS.map(({ value, label }, i) => (
            <label
              key={value}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white"
            >
              <input
                type="radio"
                name="bedroomCount"
                value={value}
                defaultChecked={initial.bedroomCount === value}
                required={i === 0 && initial.bedroomCount == null}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="monthlyRent" className="text-sm font-medium">
          Monthly rent
        </label>
        <input
          id="monthlyRent"
          name="monthlyRent"
          type="number"
          min={0}
          defaultValue={initial.monthlyRent ?? ""}
          placeholder="e.g. 3200"
          className={formInputCompactClass}
        />
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">Bathrooms</p>
        <div className="flex flex-wrap gap-2">
          {BATHROOM_SUBMIT_OPTIONS.map(({ value, label }, i) => (
            <label
              key={value}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white"
            >
              <input
                type="radio"
                name="bathrooms"
                value={value}
                defaultChecked={
                  initialBathsSnapped != null &&
                  Math.abs(initialBathsSnapped - value) < 1e-6
                }
                required={i === 0 && initialBathsSnapped == null}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          <span className="font-medium">4+</span> means four or more bathrooms combined.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-zinc-200/90 bg-muted-blue-tint/25 p-4 text-sm text-zinc-700">
        <p className="font-medium">Amenities (check all that apply)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="hasParking"
              defaultChecked={initial.hasParking}
            />
            <span>Parking (off-street, garage, etc.)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="hasCentralHeatCooling"
              defaultChecked={initial.hasCentralHeatCooling}
            />
            <span>Central heating / cooling</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="hasInUnitLaundry"
              defaultChecked={initial.hasInUnitLaundry}
            />
            <span>In-unit laundry</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="hasStorageSpace"
              defaultChecked={initial.hasStorageSpace}
            />
            <span>Storage room / closet</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="hasOutdoorSpace"
              defaultChecked={initial.hasOutdoorSpace}
            />
            <span>Outdoor space (yard, balcony, roof, etc.)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="petFriendly"
              defaultChecked={initial.petFriendly}
            />
            <span>Pet friendly</span>
          </label>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-zinc-200/90 bg-muted-blue-tint/25 p-4 text-sm text-zinc-700">
        <p className="font-medium">Quick scores (1–10)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <label htmlFor="overallScore" className="text-sm font-medium">
              Overall rental experience
            </label>
            <input
              id="overallScore"
              name="overallScore"
              type="number"
              min={1}
              max={10}
              defaultValue={initial.overallScore ?? ""}
              placeholder="1–10"
              className={formInputCompactClass}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="landlordScore" className="text-sm font-medium">
              Landlord / management responsiveness
            </label>
            <input
              id="landlordScore"
              name="landlordScore"
              type="number"
              min={1}
              max={10}
              defaultValue={initial.landlordScore ?? ""}
              placeholder="1–10"
              className={formInputCompactClass}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="reviewText" className="text-sm font-medium">
          Review details
        </label>
        <textarea
          id="reviewText"
          name="reviewText"
          rows={5}
          defaultValue={initial.body ?? ""}
          className={formTextareaClass}
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-zinc-200/90 bg-muted-blue-tint/25 p-3 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="majorityYearAttestation"
          className="mt-1"
          defaultChecked
          required
        />
        <span>{PRODUCT_POLICY.reviews.majorityYearAttestationRule}</span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-zinc-200/90 bg-muted-blue-tint/25 p-3 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="displayFullyAnonymous"
          className="mt-1"
          defaultChecked={initial.displayFullyAnonymous}
        />
        <span>
          <span className="font-medium">Show me as fully anonymous</span> (appears as
          &quot;Anonymous renter&quot; publicly).
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-muted-blue px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgb(92_107_127/0.4)] transition hover:bg-muted-blue-hover disabled:opacity-70"
        >
          Save changes
        </button>
        <Link
          href="/profile"
          className="text-sm font-semibold text-muted-blue underline-offset-2 hover:underline"
        >
          Cancel and go back
        </Link>
        {statusMessage ? (
          <p className="text-sm text-zinc-600">{statusMessage}</p>
        ) : null}
      </div>
    </form>
  );
}

