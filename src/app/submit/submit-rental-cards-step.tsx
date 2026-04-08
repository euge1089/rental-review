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

function ScoreScale({
  label,
  value,
  onChange,
  dense,
}: {
  label: string;
  value: number | null;
  onChange: (n: number) => void;
  dense?: boolean;
}) {
  return (
    <div className={dense ? "grid gap-2" : "grid gap-3"}>
      <p
        className={`font-medium leading-snug text-zinc-800 ${dense ? "text-sm" : "text-base"}`}
      >
        {label}
      </p>
      <div className={`flex flex-wrap ${dense ? "gap-1.5" : "gap-2"}`}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded-lg text-sm font-semibold transition ${
              dense ? "h-8 min-w-[2rem] text-xs" : "h-10 min-w-[2.5rem]"
            } ${
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

/** Address + ZIP filled enough to match submit validation gate for revealing the rest. */
function isAddressLineComplete(card: RentalCardState): boolean {
  return (
    card.address.trim().length >= 5 && card.postalCode.trim().length >= 3
  );
}

export function SubmitRentalCardsStep({
  rentalCards,
  leaseYearOptions,
  bostonFloor,
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
          const addrTrim = card.address.trim();
          const summary =
            (addrTrim.length > 42 ? `${addrTrim.slice(0, 42)}…` : addrTrim) ||
            "New place";
          const yearsLabel =
            [...card.selectedYears].sort((a, b) => b - a).join(", ") || "—";
          const showRest = isAddressLineComplete(card);

          return (
            <div
              key={card.id}
              id={`rental-card-${card.id}`}
              className={`rounded-2xl border ${
                cardErr
                  ? "border-red-300/90 bg-red-50/35 ring-1 ring-red-200/50"
                  : "border-zinc-200/80 bg-white"
              } p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-5`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-blue">
                    Property {cardIndex + 1}
                  </p>
                  {card.collapsed ? (
                    <p className="mt-1 truncate text-sm font-medium text-zinc-800">
                      {summary} · {yearsLabel}
                    </p>
                  ) : null}
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
                <div className="mt-4 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,6.5rem)_minmax(0,5.75rem)] sm:items-end sm:gap-3">
                    <div className="grid min-w-0 gap-1">
                      <label
                        htmlFor={
                          cardIndex === 0
                            ? "rental-card-first-address"
                            : `addr-${card.id}`
                        }
                        className="text-xs font-semibold text-zinc-600"
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
                    <div className="grid min-w-0 gap-1">
                      <label
                        htmlFor={`unit-${card.id}`}
                        className="text-xs font-semibold text-zinc-600"
                      >
                        Unit <span className="font-normal text-zinc-400">(opt.)</span>
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
                    <div className="grid min-w-0 gap-1">
                      <label
                        htmlFor={`zip-${card.id}`}
                        className="text-xs font-semibold text-zinc-600"
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

                  {!showRest ? (
                    <p className="text-xs text-zinc-500">
                      Add street address and ZIP to continue — unit is optional.
                    </p>
                  ) : null}

                  {showRest ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="grid min-w-0 gap-1.5">
                          <span
                            className="text-xs font-semibold text-zinc-600"
                            id={`bedroom-count-label-${card.id}`}
                          >
                            Bedrooms
                          </span>
                          <div
                            className="flex h-9 w-full min-w-0 gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            role="group"
                            aria-labelledby={`bedroom-count-label-${card.id}`}
                          >
                            {BEDROOM_SUBMIT_OPTIONS.map(({ value, label }) => (
                              <label
                                key={value}
                                className="flex h-9 min-h-9 min-w-[2.1rem] flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-white px-1.5 text-[11px] font-semibold tabular-nums text-zinc-700 transition has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white sm:min-w-8 sm:text-xs"
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
                        <div className="grid min-w-0 gap-1.5">
                          <span
                            className="text-xs font-semibold text-zinc-600"
                            id={`bathroom-count-label-${card.id}`}
                          >
                            Bathrooms
                          </span>
                          <div
                            className="flex w-full min-w-0 flex-wrap gap-1"
                            role="group"
                            aria-labelledby={`bathroom-count-label-${card.id}`}
                          >
                            {BATHROOM_SUBMIT_OPTIONS.map(({ value, label }) => (
                              <label
                                key={value}
                                className="flex h-9 min-h-9 min-w-[2.75rem] cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-white px-2 text-[11px] font-semibold tabular-nums text-zinc-700 transition has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white sm:text-xs"
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
                      </div>

                      <div
                        id={cardIndex === 0 ? "lease-years-region" : undefined}
                        tabIndex={cardIndex === 0 ? -1 : undefined}
                        className="space-y-2 outline-none ring-muted-blue/40 focus-visible:ring-2 focus-visible:ring-offset-2"
                      >
                        <p className="text-xs font-semibold text-zinc-700">
                          Lease start year(s) ·{" "}
                          <span className="font-normal text-zinc-500">
                            {PRODUCT_POLICY.reviews.leaseStartYearRule} Rent per year.
                          </span>
                        </p>
                        {leaseYearOptions.length === 0 ? (
                          <p className="text-sm text-zinc-600">
                            Set your Boston renting start year above to see eligible
                            years.
                          </p>
                        ) : (
                          <ul className="divide-y divide-zinc-100 border-y border-zinc-100" role="list">
                            {leaseYearOptions.map((year) => {
                              const checked = card.selectedYears.includes(year);
                              return (
                                <li key={`${card.id}-${year}`}>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2 sm:flex-nowrap sm:justify-between">
                                    <label className="flex min-w-[5rem] cursor-pointer items-center gap-2.5">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          toggleCardYear(card.id, year)
                                        }
                                        className="size-4 shrink-0 rounded border-zinc-300 text-muted-blue focus:ring-muted-blue/30"
                                      />
                                      <span className="text-sm font-semibold tabular-nums text-zinc-900">
                                        {year}
                                      </span>
                                    </label>
                                    {checked ? (
                                      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-[14rem]">
                                        <label
                                          htmlFor={`lease-rent-${card.id}-${year}`}
                                          className="sr-only"
                                        >
                                          Monthly rent for {year}
                                        </label>
                                        <span
                                          className="hidden text-xs text-zinc-500 sm:inline"
                                          aria-hidden
                                        >
                                          $/mo
                                        </span>
                                        <input
                                          id={`lease-rent-${card.id}-${year}`}
                                          type="number"
                                          min={0}
                                          step={1}
                                          inputMode="numeric"
                                          placeholder="Rent"
                                          value={card.rentByYear[year] ?? ""}
                                          onChange={(e) =>
                                            setCardRentForYear(
                                              card.id,
                                              year,
                                              e.target.value,
                                            )
                                          }
                                          className={`min-w-0 flex-1 sm:max-w-[9rem] ${formInputCompactClass}`}
                                        />
                                      </div>
                                    ) : null}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      <div className="space-y-3 border-t border-zinc-100 pt-4">
                        <p className="text-sm font-semibold text-zinc-800">
                          How was it?{" "}
                          <span className="font-normal text-zinc-500">
                            (1–10 for each — applies to every year above)
                          </span>
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                          <ScoreScale
                            label="Overall experience"
                            value={card.overallScore}
                            onChange={(n) => patchCard(card.id, { overallScore: n })}
                            dense
                          />
                          <ScoreScale
                            label="Landlord / management"
                            value={card.landlordScore}
                            onChange={(n) =>
                              patchCard(card.id, { landlordScore: n })
                            }
                            dense
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label
                            htmlFor={`reviewText-${card.id}`}
                            className="text-sm font-semibold text-zinc-800"
                          >
                            Anything else?{" "}
                            <span className="font-normal text-zinc-500">
                              (optional)
                            </span>
                          </label>
                          <textarea
                            id={`reviewText-${card.id}`}
                            rows={3}
                            value={card.reviewText}
                            onChange={(e) =>
                              patchCard(card.id, { reviewText: e.target.value })
                            }
                            placeholder="Noise, repairs, tips — a few sentences help."
                            className={formTextareaClass}
                          />
                          <p className="text-xs leading-relaxed text-zinc-500">
                            Full names may trigger a quick manual check before going
                            live.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-zinc-100 pt-4">
                        <p className="text-sm font-semibold text-zinc-800">
                          Amenities
                        </p>
                        <p className="text-xs text-zinc-500">
                          Tap to toggle. Skip if unsure.
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                                className="flex min-h-[4.5rem] flex-col justify-center gap-0.5 rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-3 py-2.5 transition hover:border-muted-blue/35 hover:bg-muted-blue-tint/25 peer-checked:border-muted-blue-hover peer-checked:bg-muted-blue-hover peer-checked:[&_.amenity-card-title]:text-white peer-checked:[&_.amenity-card-sub]:text-white/85 peer-focus-visible:ring-2 peer-focus-visible:ring-muted-blue/35 peer-focus-visible:ring-offset-1"
                              >
                                <span className="amenity-card-title text-xs font-semibold tracking-tight text-zinc-900">
                                  {title}
                                </span>
                                <span className="amenity-card-sub text-[11px] leading-snug text-zinc-600">
                                  {sub}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
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
