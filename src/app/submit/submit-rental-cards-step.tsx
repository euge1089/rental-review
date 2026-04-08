"use client";

import {
  BATHROOM_SUBMIT_OPTIONS,
  BEDROOM_SUBMIT_OPTIONS,
  PRODUCT_POLICY,
} from "@/lib/policy";
import type { RentalCardState } from "@/lib/submit-rental-draft";
import { formInputCompactClass, formTextareaClass } from "@/lib/ui-classes";

const STEP1_AMENITY_CARDS: {
  name:
    | "hasParking"
    | "hasCentralHeatCooling"
    | "hasInUnitLaundry"
    | "hasStorageSpace"
    | "hasOutdoorSpace"
    | "petFriendly";
  title: string;
  sub: string;
}[] = [
  {
    name: "hasParking",
    title: "Parking",
    sub: "Garage, driveway, or dedicated spot",
  },
  {
    name: "hasCentralHeatCooling",
    title: "Central heat & AC",
    sub: "Building-wide heating and cooling",
  },
  {
    name: "hasInUnitLaundry",
    title: "In-unit laundry",
    sub: "Washer and dryer in your unit",
  },
  {
    name: "hasStorageSpace",
    title: "Extra storage",
    sub: "Unit closet, locker, or basement space",
  },
  {
    name: "hasOutdoorSpace",
    title: "Outdoor space",
    sub: "Yard, balcony, deck, or roof access",
  },
  {
    name: "petFriendly",
    title: "Pet friendly",
    sub: "Building or lease allowed pets",
  },
];

type SessionUser = {
  email?: string | null;
  name?: string | null;
  phoneVerified?: boolean;
};

function ScoreScale({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (n: number) => void;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-base font-medium leading-snug text-zinc-800">{label}</p>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 min-w-[2.5rem] rounded-xl text-sm font-semibold transition ${
              value === n
                ? "bg-muted-blue-hover text-white shadow-sm"
                : "border border-zinc-200/90 bg-white text-zinc-600 hover:border-muted-blue/30 hover:bg-muted-blue-tint/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SubmitRentalCardsStep({
  rentalCards,
  leaseYearOptions,
  bostonFloor,
  sessionUser,
  step1ErrorsByCardId,
  patchCard,
  toggleCardYear,
  setCardRentForYear,
  copyFromPreviousCard,
  removeRentalCard,
  addRentalCard,
  maxCards,
}: {
  rentalCards: RentalCardState[];
  leaseYearOptions: number[];
  bostonFloor: number | undefined | null;
  sessionUser: SessionUser | null | "loading";
  step1ErrorsByCardId: Record<string, string>;
  patchCard: (id: string, patch: Partial<RentalCardState>) => void;
  toggleCardYear: (cardId: string, year: number) => void;
  setCardRentForYear: (cardId: string, year: number, value: string) => void;
  copyFromPreviousCard: (targetIndex: number, targetId: string) => void;
  removeRentalCard: (id: string) => void;
  addRentalCard: () => void;
  maxCards: number;
}) {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-blue">
          Step 1
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-muted-blue-hover sm:text-2xl">
          Your Boston rental place(s)
        </h2>
        <div className="max-w-2xl space-y-2 pt-0.5">
          <p className="text-sm leading-relaxed text-zinc-600">
            Public reviews are <span className="font-semibold">fully anonymous</span>.
            We never show your name, and we do not publish your exact lease-start year.
          </p>
          {typeof bostonFloor === "number" ? (
            <p className="text-sm leading-relaxed text-zinc-600">
              Your profile says you started renting in Boston in {bostonFloor}, so only{" "}
              {bostonFloor} and later years appear below.
            </p>
          ) : null}
        </div>
      </div>

      <p className="rounded-xl border border-muted-blue/20 bg-muted-blue-tint/35 px-4 py-3 text-sm leading-relaxed text-zinc-700">
        <span className="font-semibold text-muted-blue-hover">Same building?</span> Use{" "}
        <span className="font-medium">one card</span> and add every lease-start year
        there.{" "}
        <span className="font-semibold text-muted-blue-hover">Different building?</span>{" "}
        Tap <span className="font-medium">Add another address</span> (up to {maxCards}{" "}
        places per submit). Years and rent stay per card — we don&apos;t copy those when
        you copy a place.
      </p>

      <div className="h-px w-full bg-zinc-200/90" />

      <div className="space-y-8">
        {rentalCards.map((card, cardIndex) => {
          const cardErr = step1ErrorsByCardId[card.id];
          const unusedOnCard = leaseYearOptions.filter(
            (y) => !card.selectedYears.includes(y),
          );
          const unusedShort = (() => {
            const y = [...unusedOnCard].sort((a, b) => b - a);
            if (y.length === 0) return "";
            if (y.length <= 4) return y.join(", ");
            return `${y.slice(0, 3).join(", ")}, +${y.length - 3} more`;
          })();
          const addrTrim = card.address.trim();
          const summary =
            (addrTrim.length > 42 ? `${addrTrim.slice(0, 42)}…` : addrTrim) ||
            "New place";
          const yearsLabel =
            [...card.selectedYears].sort((a, b) => b - a).join(", ") || "—";

          return (
            <div
              key={card.id}
              id={`rental-card-${card.id}`}
              className={`rounded-2xl border ${
                cardErr
                  ? "border-red-300/90 bg-red-50/35 ring-1 ring-red-200/50"
                  : "border-zinc-200/80 bg-white"
              } p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-6`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-blue">
                    Place {cardIndex + 1}
                  </p>
                  {card.collapsed ? (
                    <p className="mt-1 truncate text-sm font-medium text-zinc-800">
                      {summary} · {yearsLabel}
                    </p>
                  ) : (
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-muted-blue-hover">
                      This address
                    </h3>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {cardIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => copyFromPreviousCard(cardIndex, card.id)}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-muted-blue-hover transition hover:border-muted-blue/35 hover:bg-muted-blue-tint/40"
                    >
                      Copy from previous
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => patchCard(card.id, { collapsed: !card.collapsed })}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    {card.collapsed ? "Expand" : "Collapse"}
                  </button>
                  {rentalCards.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRentalCard(card.id)}
                      className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>

              {cardErr ? (
                <p
                  className="mt-3 text-sm font-medium text-red-800"
                  role="alert"
                >
                  {cardErr}
                </p>
              ) : null}

              {!card.collapsed ? (
                <div className="mt-6 space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
                    <div className="grid min-w-0 flex-1 gap-2">
                      <label
                        htmlFor={
                          cardIndex === 0
                            ? "rental-card-first-address"
                            : `addr-${card.id}`
                        }
                        className="text-sm font-semibold leading-5 text-zinc-800"
                      >
                        Street address
                      </label>
                      <input
                        id={
                          cardIndex === 0
                            ? "rental-card-first-address"
                            : `addr-${card.id}`
                        }
                        value={card.address}
                        onChange={(e) =>
                          patchCard(card.id, { address: e.target.value })
                        }
                        placeholder="35 W 3rd St"
                        autoComplete="street-address"
                        className={formInputCompactClass}
                      />
                    </div>
                    <div className="flex min-w-0 gap-2 sm:gap-3 lg:contents">
                      <div className="grid min-w-0 flex-1 gap-2 sm:max-w-[10rem] lg:w-[min(7.5rem,100%)] lg:max-w-[7.5rem] lg:flex-none">
                        <label
                          htmlFor={`unit-${card.id}`}
                          className="text-sm font-semibold leading-5 text-zinc-800"
                        >
                          Unit{" "}
                          <span className="font-normal text-zinc-500">(opt.)</span>
                        </label>
                        <input
                          id={`unit-${card.id}`}
                          value={card.unit}
                          onChange={(e) =>
                            patchCard(card.id, { unit: e.target.value })
                          }
                          placeholder="3B"
                          className={formInputCompactClass}
                        />
                      </div>
                      <div className="grid w-[min(100%,6.5rem)] shrink-0 gap-2 sm:w-28 lg:w-24 lg:flex-none">
                        <label
                          htmlFor={`zip-${card.id}`}
                          className="text-sm font-semibold leading-5 text-zinc-800"
                        >
                          ZIP
                        </label>
                        <input
                          id={`zip-${card.id}`}
                          value={card.postalCode}
                          onChange={(e) =>
                            patchCard(card.id, { postalCode: e.target.value })
                          }
                          placeholder="02127"
                          autoComplete="postal-code"
                          className={formInputCompactClass}
                        />
                      </div>
                    </div>
                    <div className="grid min-w-0 flex-[1.2] gap-2 lg:min-w-0">
                      <span
                        className="text-sm font-semibold leading-5 text-zinc-800"
                        id={`bedroom-count-label-${card.id}`}
                      >
                        Bedrooms
                      </span>
                      <div
                        className="flex h-10 w-full min-w-0 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:overflow-visible [&::-webkit-scrollbar]:hidden"
                        role="group"
                        aria-labelledby={`bedroom-count-label-${card.id}`}
                      >
                        {BEDROOM_SUBMIT_OPTIONS.map(({ value, label }) => (
                          <label
                            key={value}
                            className="flex h-10 min-h-10 min-w-[2.35rem] flex-1 cursor-pointer items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-2 text-xs font-semibold tabular-nums text-zinc-700 shadow-[0_1px_0_rgb(15_23_42/0.03)] transition has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white has-[:checked]:shadow-none sm:min-w-9 sm:px-2.5"
                          >
                            <input
                              type="radio"
                              name={`bedroomCount-${card.id}`}
                              checked={card.bedroomCount === value}
                              onChange={() =>
                                patchCard(card.id, { bedroomCount: value })
                              }
                              className="sr-only"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-2">
                    <span
                      className="text-sm font-semibold leading-5 text-zinc-800"
                      id={`bathroom-count-label-${card.id}`}
                    >
                      Bathrooms
                    </span>
                    <div
                      className="flex w-full min-w-0 flex-wrap gap-1.5 sm:gap-2"
                      role="group"
                      aria-labelledby={`bathroom-count-label-${card.id}`}
                    >
                      {BATHROOM_SUBMIT_OPTIONS.map(({ value, label }) => (
                        <label
                          key={value}
                          className="flex h-10 min-h-10 min-w-[3rem] cursor-pointer items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-3 text-xs font-semibold tabular-nums text-zinc-700 shadow-[0_1px_0_rgb(15_23_42/0.03)] transition has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white has-[:checked]:shadow-none sm:min-w-[3.25rem] sm:px-3.5"
                        >
                          <input
                            type="radio"
                            name={`bathrooms-${card.id}`}
                            checked={
                              card.bathrooms != null &&
                              Math.abs(card.bathrooms - value) < 1e-6
                            }
                            onChange={() =>
                              patchCard(card.id, { bathrooms: value })
                            }
                            className="sr-only"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div
                    id={cardIndex === 0 ? "lease-years-region" : undefined}
                    tabIndex={cardIndex === 0 ? -1 : undefined}
                    className="grid gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 outline-none ring-muted-blue/40 focus-visible:ring-2 sm:p-5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        Lease start year(s) at this address
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                        {PRODUCT_POLICY.reviews.leaseStartYearRule} Choose every year you
                        want a review for — rent can differ each year.
                      </p>
                    </div>
                    {leaseYearOptions.length === 0 ? (
                      <p className="text-sm text-zinc-600">
                        Set your Boston renting start year above to see eligible years.
                      </p>
                    ) : (
                      <ul className="grid gap-2" role="list">
                        {leaseYearOptions.map((year) => {
                          const checked = card.selectedYears.includes(year);
                          return (
                            <li key={`${card.id}-${year}`}>
                              <div
                                className={`rounded-xl border bg-white transition ${
                                  checked
                                    ? "border-muted-blue-hover shadow-[0_1px_0_rgb(15_23_42/0.04)]"
                                    : "border-zinc-200/90"
                                }`}
                              >
                                <label className="flex cursor-pointer items-center gap-3 px-3 py-3 sm:px-4">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleCardYear(card.id, year)}
                                    className="size-4 shrink-0 rounded border-zinc-300 text-muted-blue focus:ring-muted-blue/30"
                                  />
                                  <span className="text-base font-semibold tabular-nums text-zinc-900">
                                    {year}
                                  </span>
                                </label>
                                {checked ? (
                                  <div className="border-t border-zinc-100 px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
                                    <label
                                      htmlFor={`lease-rent-${card.id}-${year}`}
                                      className="text-xs font-semibold uppercase tracking-wide text-zinc-600"
                                    >
                                      Monthly rent for {year}
                                    </label>
                                    <input
                                      id={`lease-rent-${card.id}-${year}`}
                                      type="number"
                                      min={0}
                                      step={1}
                                      inputMode="numeric"
                                      placeholder="e.g. 3200"
                                      value={card.rentByYear[year] ?? ""}
                                      onChange={(e) =>
                                        setCardRentForYear(
                                          card.id,
                                          year,
                                          e.target.value,
                                        )
                                      }
                                      className={`mt-1.5 ${formInputCompactClass}`}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {sessionUser &&
                    sessionUser !== "loading" &&
                    typeof bostonFloor === "number" &&
                    unusedOnCard.length > 0 ? (
                      <div className="rounded-xl border border-muted-blue/25 bg-muted-blue-tint/40 px-3 py-3.5 sm:px-4">
                        <p className="text-sm font-semibold text-muted-blue-hover">
                          More lease years at this place?
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">
                          {card.selectedYears.length === 0 ? (
                            <>
                              You can pick{" "}
                              <span className="font-medium">several years</span> for this
                              address if you lived here in a row. Other years you&apos;re
                              eligible for (
                              <span className="font-medium tabular-nums">
                                {unusedShort}
                              </span>
                              ) might be a{" "}
                              <span className="font-medium">different</span> Boston
                              building — use{" "}
                              <span className="font-medium">Add another address</span> for
                              those.
                            </>
                          ) : (
                            <>
                              You haven&apos;t added{" "}
                              <span className="font-medium tabular-nums">
                                {unusedShort}
                              </span>{" "}
                              on this card yet. Tap them above if those years were at{" "}
                              <span className="font-medium">this</span> address.
                            </>
                          )}
                        </p>
                      </div>
                    ) : null}
                    <div className="rounded-xl border border-zinc-200/80 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
                        Privacy mapping shown publicly
                      </p>
                      <div className="mt-2 grid gap-2 text-xs text-zinc-600">
                        <p>
                          <span className="font-medium text-zinc-800">Recent years</span>{" "}
                          -&gt; Recent (within ~2 years)
                        </p>
                        <p>
                          <span className="font-medium text-zinc-800">
                            Mid-range years
                          </span>{" "}
                          -&gt; A few years ago (2-5 years)
                        </p>
                        <p>
                          <span className="font-medium text-zinc-800">Older years</span>{" "}
                          -&gt; Older experience (5+ years)
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        We store the exact year internally for quality checks and
                        anti-spam, but only show the bucket publicly.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-muted-blue-tint/40 to-muted-blue-tint/15 p-5 sm:gap-6 sm:p-7">
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        How was it at this place?
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                        These scores and your optional story apply to every lease-start
                        year you selected for this address.
                      </p>
                    </div>
                    <div className="grid gap-8 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:gap-9 sm:p-7">
                      <div>
                        <p className="text-sm font-semibold text-zinc-800">
                          Tap a number from 1 (rough) to 10 (great)
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                          Go with your gut — there are no wrong answers.
                        </p>
                      </div>
                      <ScoreScale
                        label="Overall rental experience"
                        value={card.overallScore}
                        onChange={(n) => patchCard(card.id, { overallScore: n })}
                      />
                      <ScoreScale
                        label="Landlord / management responsiveness"
                        value={card.landlordScore}
                        onChange={(n) => patchCard(card.id, { landlordScore: n })}
                      />
                    </div>
                    <div className="grid gap-3">
                      <label
                        htmlFor={`reviewText-${card.id}`}
                        className="text-base font-semibold text-zinc-800"
                      >
                        Anything else you&apos;d like to add?{" "}
                        <span className="font-normal text-zinc-500">(optional)</span>
                      </label>
                      <textarea
                        id={`reviewText-${card.id}`}
                        rows={5}
                        value={card.reviewText}
                        onChange={(e) =>
                          patchCard(card.id, { reviewText: e.target.value })
                        }
                        placeholder="Noise, management, repairs, neighbors, tips for someone new — whatever feels fair to share."
                        className={formTextareaClass}
                      />
                      <p className="text-sm leading-relaxed text-zinc-500">
                        Totally optional, but stories help people the most. If you mention
                        someone&apos;s full name, we may hold the review for a quick
                        manual check before it goes live.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-muted-blue-tint/40 to-muted-blue-tint/15 p-5 sm:gap-6 sm:p-7">
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        Amenities at this place
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                        Tap the ones that fit — tap again to turn off. Skip anything
                        you&apos;re unsure about.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {STEP1_AMENITY_CARDS.map(({ name, title, sub }) => (
                        <label
                          key={name}
                          className="relative block cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={Boolean(card[name])}
                            onChange={() =>
                              patchCard(card.id, {
                                [name]: !card[name],
                              } as Partial<RentalCardState>)
                            }
                          />
                          <div
                            className="flex min-h-[5.25rem] flex-col justify-center gap-1 rounded-2xl border border-zinc-200/90 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.05)] ring-1 ring-transparent transition hover:border-muted-blue/35 hover:bg-muted-blue-tint/30 hover:shadow-[0_8px_24px_-12px_rgb(15_23_42/0.12)] peer-checked:border-muted-blue-hover peer-checked:bg-muted-blue-hover peer-checked:shadow-[0_10px_28px_-10px_rgb(21_42_69/0.45)] peer-checked:ring-muted-blue-hover/20 peer-checked:[&_.amenity-card-title]:text-white peer-checked:[&_.amenity-card-sub]:text-white/85 peer-focus-visible:ring-2 peer-focus-visible:ring-muted-blue/35 peer-focus-visible:ring-offset-2"
                          >
                            <span className="amenity-card-title text-sm font-semibold tracking-tight text-zinc-900">
                              {title}
                            </span>
                            <span className="amenity-card-sub text-xs leading-snug text-zinc-600">
                              {sub}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-2 z-10 flex justify-center pt-2 pb-1 sm:bottom-4">
        <button
          type="button"
          disabled={rentalCards.length >= maxCards}
          onClick={addRentalCard}
          className="inline-flex min-h-11 w-full max-w-md items-center justify-center rounded-full border border-muted-blue/30 bg-white px-6 py-3 text-sm font-semibold text-muted-blue-hover shadow-[0_4px_24px_-8px_rgb(15_23_42/0.25)] ring-1 ring-zinc-200/80 transition hover:border-muted-blue/45 hover:bg-muted-blue-tint/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {rentalCards.length >= maxCards
            ? `Maximum ${maxCards} places per submission`
            : "+ Add another address"}
        </button>
      </div>
    </div>
  );
}
