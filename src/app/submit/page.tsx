"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { BostonRentingYearPickForm } from "@/app/_components/boston-renting-year-pick-form";
import {
  BATHROOM_SUBMIT_OPTIONS,
  BEDROOM_SUBMIT_OPTIONS,
  PRODUCT_POLICY,
  REVIEW_YEAR_OPTIONS,
  getBostonRentingSinceYearChoices,
  reviewYearsAllowedForUser,
  snapBathroomsToAllowedDbValue,
} from "@/lib/policy";
import {
  SUBMIT_STEP1_PREFILL_KEY,
  type SubmitStepOnePrefill,
  applySubmitStepOnePrefill,
  buildPrefillFromSubmitPayload,
} from "@/lib/submit-prefill";
import { trackEvent } from "@/lib/analytics-client";
import {
  formInputCompactClass,
  formTextareaClass,
  modalBackdropClass,
  modalDialogClass,
  surfaceElevatedClass,
} from "@/lib/ui-classes";

const DRAFT_KEY = "rental-review-draft-v1";

/**
 * Server-side Review rows are unchanged by the multi-year submit flow. This only
 * normalizes the client draft: legacy `reviewYear` + `monthlyRent` become `leaseYears`,
 * and old keys are dropped so new saves stay consistent.
 */
function migrateSubmitDraft(d: Record<string, unknown>): Record<string, unknown> {
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

/** Shown when Continue is tapped without both 1–10 scores; also used for scroll/focus UX. */
const SUBMIT_STEP2_SCORES_PROMPT =
  "Please tap a score from 1–10 for both questions.";

function resetYearSpecificFields(
  form: HTMLFormElement,
  setOverall: (n: number | null) => void,
  setLandlord: (n: number | null) => void,
  clearLeaseYears?: () => void,
) {
  const text = form.elements.namedItem("reviewText") as HTMLTextAreaElement | null;
  if (text) text.value = "";
  const majority = form.elements.namedItem(
    "majorityYearAttestation",
  ) as HTMLInputElement | null;
  if (majority) majority.checked = false;
  setOverall(null);
  setLandlord(null);
  clearLeaseYears?.();
}

const STEP1_AMENITY_CARDS: {
  name: "hasParking" | "hasCentralHeatCooling" | "hasInUnitLaundry" | "hasStorageSpace" | "hasOutdoorSpace" | "petFriendly";
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
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: number | null;
  onChange: (n: number) => void;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-base font-medium leading-snug text-zinc-800">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`min-h-11 min-w-[2.75rem] rounded-xl px-2 text-sm font-semibold transition sm:min-h-10 sm:min-w-[2.5rem] ${
              value === n
                ? "bg-muted-blue-hover text-white shadow-sm"
                : "border border-zinc-200/90 bg-white text-zinc-600 hover:border-muted-blue/30 hover:bg-muted-blue-tint/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}

export default function SubmitReviewPage() {
  const { data: session, status: sessionStatus } = useSession();
  const sessionUser = useMemo((): SessionUser | null | "loading" => {
    if (sessionStatus === "loading") return "loading";
    if (!session?.user) return null;
    return {
      email: session.user.email,
      name: session.user.name,
      phoneVerified: session.user.phoneVerified,
    };
  }, [session?.user, sessionStatus]);

  const formRef = useRef<HTMLFormElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const statusBannerRef = useRef<HTMLDivElement | null>(null);
  const successPrimaryActionRef = useRef<HTMLButtonElement | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [landlordScore, setLandlordScore] = useState<number | null>(null);
  const [duplicateModalDupes, setDuplicateModalDupes] = useState<
    { reviewYear: number; reviewId: string }[] | null
  >(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [duplicateDeleting, setDuplicateDeleting] = useState(false);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [selectedLeaseYears, setSelectedLeaseYears] = useState<number[]>([]);
  const [rentByYear, setRentByYear] = useState<Record<number, string>>({});
  const [lastSubmittedBatchCount, setLastSubmittedBatchCount] = useState(1);
  const leaseUserTouchedRef = useRef(false);

  const clearLeaseYearsState = useCallback(() => {
    leaseUserTouchedRef.current = false;
    setSelectedLeaseYears([]);
    setRentByYear({});
  }, []);

  const toggleLeaseYear = useCallback((year: number) => {
    leaseUserTouchedRef.current = true;
    setSelectedLeaseYears((prev) => {
      if (prev.includes(year)) {
        setRentByYear((r) => {
          const next = { ...r };
          delete next[year];
          return next;
        });
        return prev.filter((y) => y !== year).sort((a, b) => b - a);
      }
      return [...prev, year].sort((a, b) => b - a);
    });
  }, []);

  const setRentForYear = useCallback((year: number, value: string) => {
    leaseUserTouchedRef.current = true;
    setRentByYear((r) => ({ ...r, [year]: value }));
  }, []);
  const [reviewQuota, setReviewQuota] = useState<{
    count: number;
    max: number;
    atCap: boolean;
  } | null>(null);
  const [anotherYearPrefill, setAnotherYearPrefill] =
    useState<SubmitStepOnePrefill | null>(null);
  const [showAnotherYearCta, setShowAnotherYearCta] = useState(false);
  const [showSubmitSuccessModal, setShowSubmitSuccessModal] = useState(false);
  const [bostonFloor, setBostonFloor] = useState<number | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!sessionUser || sessionUser === "loading") {
      setReviewQuota(null);
      setBostonFloor(undefined);
      return;
    }
    let cancelled = false;
    (async () => {
      const [countRes, profileRes] = await Promise.all([
        fetch("/api/reviews/my-count"),
        fetch("/api/profile"),
      ]);
      const countData = (await countRes.json()) as {
        ok?: boolean;
        count?: number;
        max?: number;
        atCap?: boolean;
      };
      const profileData = (await profileRes.json()) as {
        ok?: boolean;
        bostonRentingSinceYear?: number | null;
      };
      if (cancelled) return;
      if (
        countData.ok &&
        typeof countData.count === "number" &&
        typeof countData.max === "number"
      ) {
        setReviewQuota({
          count: countData.count,
          max: countData.max,
          atCap: Boolean(countData.atCap),
        });
      }
      if (profileData.ok) {
        setBostonFloor(profileData.bostonRentingSinceYear ?? null);
      } else {
        setBostonFloor(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  const leaseYearOptions = useMemo(() => {
    if (!sessionUser || sessionUser === "loading") return REVIEW_YEAR_OPTIONS;
    if (bostonFloor === undefined || bostonFloor === null) return [];
    return reviewYearsAllowedForUser(bostonFloor);
  }, [sessionUser, bostonFloor]);

  /** Drop lease years that fall outside the profile floor once options are known. */
  useEffect(() => {
    if (bostonFloor === undefined || bostonFloor === null) return;
    if (leaseYearOptions.length === 0) return;
    setSelectedLeaseYears((prev) =>
      prev.filter((y) => leaseYearOptions.includes(y)),
    );
    setRentByYear((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        const y = Number(k);
        if (!leaseYearOptions.includes(y)) delete next[y];
      }
      return next;
    });
  }, [bostonFloor, leaseYearOptions]);

  useEffect(() => {
    if (typeof window === "undefined" || !formRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("another") === "1") {
      const preRaw = window.localStorage.getItem(SUBMIT_STEP1_PREFILL_KEY);
      if (preRaw) {
        try {
          const prefill = JSON.parse(preRaw) as SubmitStepOnePrefill;
          applySubmitStepOnePrefill(formRef.current, prefill);
          resetYearSpecificFields(
            formRef.current,
            setOverallScore,
            setLandlordScore,
            clearLeaseYearsState,
          );
          window.history.replaceState(null, "", "/submit");
          setStatusMessage(
            "We filled in your building from last time - pick your lease-start year(s) and rent for each.",
          );
          setStep(1);
          setTimeout(() => {
            persistDraft({ overall: null, landlord: null });
          }, 0);
        } catch {
          // ignore
        }
        return;
      }
      window.history.replaceState(null, "", "/submit");
      return;
    }

    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = migrateSubmitDraft(JSON.parse(raw) as Record<string, unknown>);
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // ignore quota / private mode
      }
      const form = formRef.current;
      const setIfPresent = (name: string, value: unknown) => {
        const field = form.elements.namedItem(name) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement
          | null;
        if (!field || value == null) return;
        if (field instanceof HTMLInputElement && field.type === "checkbox") {
          field.checked = Boolean(value);
        } else if (
          field instanceof HTMLInputElement &&
          field.type === "radio"
        ) {
          if (String(field.value) === String(value)) field.checked = true;
        } else {
          field.value = String(value);
        }
      };

      setIfPresent("address", draft.address);
      setIfPresent("unit", draft.unit);
      setIfPresent("postalCode", draft.postalCode);
      setIfPresent("reviewText", draft.reviewText);
      setIfPresent("hasParking", draft.hasParking);
      setIfPresent("hasCentralHeatCooling", draft.hasCentralHeatCooling);
      setIfPresent("hasInUnitLaundry", draft.hasInUnitLaundry);
      setIfPresent("hasStorageSpace", draft.hasStorageSpace);
      setIfPresent("hasOutdoorSpace", draft.hasOutdoorSpace);
      setIfPresent("petFriendly", draft.petFriendly);
      setIfPresent("majorityYearAttestation", draft.majorityYearAttestation);

      if (draft.bedroomCount != null) {
        const radios = form.querySelectorAll<HTMLInputElement>(
          'input[name="bedroomCount"]',
        );
        radios.forEach((r) => {
          r.checked = String(r.value) === String(draft.bedroomCount);
        });
      }

      const bathRaw = draft.bathrooms;
      if (bathRaw != null && String(bathRaw).trim() !== "") {
        const snapped = snapBathroomsToAllowedDbValue(Number(bathRaw));
        if (snapped != null) {
          const bathRadios = form.querySelectorAll<HTMLInputElement>(
            'input[name="bathrooms"]',
          );
          bathRadios.forEach((r) => {
            r.checked = Math.abs(Number(r.value) - snapped) < 1e-6;
          });
        }
      }

      const os = draft.overallScore;
      const ls = draft.landlordScore;
      if (typeof os === "number" || (typeof os === "string" && os !== "")) {
        setOverallScore(Number(os));
      }
      if (typeof ls === "number" || (typeof ls === "string" && ls !== "")) {
        setLandlordScore(Number(ls));
      }

      const loadedYears: number[] = [];
      const loadedRents: Record<number, string> = {};
      for (const row of (draft.leaseYears ?? []) as {
        year?: unknown;
        rent?: unknown;
      }[]) {
        if (row && typeof row.year === "number") {
          loadedYears.push(row.year);
          if (row.rent != null && String(row.rent).trim() !== "") {
            loadedRents[row.year] = String(row.rent);
          }
        }
      }
      setSelectedLeaseYears(loadedYears.sort((a, b) => b - a));
      setRentByYear(loadedRents);
    } catch {
      // ignore
    }
    // Mount-only: hydrate from localStorage once; deps omitted intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persistDraft/clearLeaseYearsState would retrigger on every form change
  }, []);

  const persistDraft = useCallback(
    (scores?: { overall: number | null; landlord: number | null }) => {
      if (typeof window === "undefined" || !formRef.current) return;
      const form = formRef.current;
      const data = new FormData(form);
      const br = data.get("bedroomCount");
      const os = scores ? scores.overall : overallScore;
      const ls = scores ? scores.landlord : landlordScore;
      const draft = {
        address: data.get("address") ?? "",
        unit: data.get("unit") ?? "",
        postalCode: data.get("postalCode") ?? "",
        leaseYears: selectedLeaseYears.map((y) => ({
          year: y,
          rent: rentByYear[y] ?? "",
        })),
        bedroomCount: br != null && br !== "" ? Number(br) : "",
        bathrooms: data.get("bathrooms") ?? "",
        hasParking: data.get("hasParking") === "on",
        hasCentralHeatCooling: data.get("hasCentralHeatCooling") === "on",
        hasInUnitLaundry: data.get("hasInUnitLaundry") === "on",
        hasStorageSpace: data.get("hasStorageSpace") === "on",
        hasOutdoorSpace: data.get("hasOutdoorSpace") === "on",
        petFriendly: data.get("petFriendly") === "on",
        overallScore: os ?? "",
        landlordScore: ls ?? "",
        reviewText: data.get("reviewText") ?? "",
        majorityYearAttestation: data.get("majorityYearAttestation") === "on",
      };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    },
    [overallScore, landlordScore, selectedLeaseYears, rentByYear],
  );

  useEffect(() => {
    if (!leaseUserTouchedRef.current) return;
    persistDraft();
  }, [selectedLeaseYears, rentByYear, persistDraft]);

  function handleAddAnotherLeaseYear() {
    if (!formRef.current || !anotherYearPrefill) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        SUBMIT_STEP1_PREFILL_KEY,
        JSON.stringify(anotherYearPrefill),
      );
    }
    resetYearSpecificFields(
      formRef.current,
      setOverallScore,
      setLandlordScore,
      clearLeaseYearsState,
    );
    setShowAnotherYearCta(false);
    setAnotherYearPrefill(null);
    setStep(1);
    setStatusMessage(
      "We kept your place details - pick lease-start year(s) and rent for each.",
    );
    setTimeout(() => persistDraft({ overall: null, landlord: null }), 0);
    requestAnimationFrame(() => {
      document.getElementById("lease-years-region")?.focus();
    });
  }

  function dismissAnotherYearCta() {
    setShowAnotherYearCta(false);
    setAnotherYearPrefill(null);
  }

  function advanceToStep(nextStep: 2 | 3) {
    setStep(nextStep);
    if (nextStep === 2) {
      trackEvent("submit_step_2_reached");
    }
    requestAnimationFrame(() => {
      const mobile =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 639px)").matches;
      const target = mobile
        ? formRef.current
        : document.getElementById(`submit-step-${nextStep}`);
      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  /** Constraint check only (no UI); used before switching step on final submit. */
  function isStepPanelValid(form: HTMLFormElement, stepNum: number): boolean {
    const root = form.querySelector<HTMLElement>(`[data-step-panel="${stepNum}"]`);
    if (!root) return true;

    const controls = root.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input:not([type=hidden]), select, textarea");

    const radioNames = new Set<string>();
    for (const el of controls) {
      if (el instanceof HTMLInputElement && el.type === "radio") {
        radioNames.add(el.name);
      }
    }
    for (const name of radioNames) {
      const group = root.querySelectorAll<HTMLInputElement>(
        `input[type="radio"][name="${CSS.escape(name)}"]`,
      );
      if (group.length === 0) continue;
      const required = [...group].some((r) => r.required);
      const checked = [...group].some((r) => r.checked);
      if (required && !checked) return false;
    }

    for (const el of controls) {
      if (el instanceof HTMLInputElement && el.type === "radio") continue;
      if (el instanceof HTMLInputElement && (el.type === "submit" || el.type === "button")) {
        continue;
      }
      if (!el.willValidate) continue;
      if (!el.checkValidity()) return false;
    }
    return true;
  }

  /** Validate one step and focus/report the first invalid control. */
  function validateStepPanel(form: HTMLFormElement, stepNum: number): boolean {
    const root = form.querySelector<HTMLElement>(`[data-step-panel="${stepNum}"]`);
    if (!root) return true;

    const controls = root.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input:not([type=hidden]), select, textarea");

    const radioNames = new Set<string>();
    for (const el of controls) {
      if (el instanceof HTMLInputElement && el.type === "radio") {
        radioNames.add(el.name);
      }
    }
    for (const name of radioNames) {
      const group = root.querySelectorAll<HTMLInputElement>(
        `input[type="radio"][name="${CSS.escape(name)}"]`,
      );
      if (group.length === 0) continue;
      const required = [...group].some((r) => r.required);
      const checked = [...group].some((r) => r.checked);
      if (required && !checked) {
        if (name === "bedroomCount") {
          setStatusMessage("Please choose how many bedrooms.");
          document.getElementById("bedroom-count-label")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (name === "bathrooms") {
          setStatusMessage("Please choose how many bathrooms.");
          document.getElementById("bathroom-count-label")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        group[0]?.reportValidity();
        return false;
      }
    }

    for (const el of controls) {
      if (el instanceof HTMLInputElement && el.type === "radio") continue;
      if (el instanceof HTMLInputElement && (el.type === "submit" || el.type === "button")) {
        continue;
      }
      if (!el.willValidate) continue;
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  const closeDuplicateModal = useCallback(() => {
    setDuplicateModalDupes(null);
  }, []);

  const closeSubmitSuccessModal = useCallback(() => {
    setShowSubmitSuccessModal(false);
    requestAnimationFrame(() => {
      submitButtonRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (!duplicateModalDupes || duplicateModalDupes.length === 0) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDuplicateModal();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [duplicateModalDupes, closeDuplicateModal]);

  useEffect(() => {
    if (!showSubmitSuccessModal) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeSubmitSuccessModal();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      successPrimaryActionRef.current?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showSubmitSuccessModal, closeSubmitSuccessModal]);

  useEffect(() => {
    if (statusMessage !== SUBMIT_STEP2_SCORES_PROMPT) return;
    const el = statusBannerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [statusMessage]);

  function handleLeaveAnotherReview() {
    if (anotherYearPrefill && formRef.current) {
      handleAddAnotherLeaseYear();
    } else if (formRef.current) {
      formRef.current.reset();
      setOverallScore(null);
      setLandlordScore(null);
      clearLeaseYearsState();
      setStep(1);
      setStatusMessage("Ready for your next review.");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
      }
      requestAnimationFrame(() => {
        document.getElementById("address")?.focus();
      });
    }
    setShowSubmitSuccessModal(false);
  }

  async function handleDuplicateDelete() {
    const dup = duplicateModalDupes;
    if (!dup || dup.length !== 1) return;
    const reviewId = dup[0].reviewId;
    if (
      !window.confirm(
        "Delete this review permanently? You can submit a new one for this address and year afterward.",
      )
    ) {
      return;
    }
    setDuplicateDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setStatusMessage(data.error ?? "Could not delete that review.");
        return;
      }
      closeDuplicateModal();
      setStatusMessage(
        "That review was removed. You can tap Continue again to move on with a fresh submission.",
      );
    } finally {
      setDuplicateDeleting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      if (formRef.current && !validateStepPanel(formRef.current, step)) {
        return;
      }
      if (step === 1) {
        const signedIn = sessionUser && sessionUser !== "loading";
        if (!signedIn || !formRef.current) {
          setStatusMessage("");
          setStep(2);
          return;
        }
        const fd = new FormData(formRef.current);
        const address = String(fd.get("address") ?? "").trim();
        const sortedYears = [...selectedLeaseYears].sort((a, b) => b - a);
        if (sortedYears.length === 0) {
          setStatusMessage("Select at least one lease-start year.");
          document.getElementById("lease-years-region")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return;
        }
        for (const y of sortedYears) {
          const raw = (rentByYear[y] ?? "").trim();
          const rent = Number(raw);
          if (
            raw === "" ||
            Number.isNaN(rent) ||
            rent < 0 ||
            !Number.isInteger(rent)
          ) {
            setStatusMessage(
              `Enter a whole-dollar monthly rent for ${y} (use 0 if rent-free).`,
            );
            document.getElementById(`lease-rent-${y}`)?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            return;
          }
        }
        setStatusMessage("");
        setDuplicateChecking(true);
        try {
          const res = await fetch("/api/reviews/duplicate-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address,
              city: "Boston",
              state: "MA",
              reviewYears: sortedYears,
            }),
          });
          let data: {
            ok: boolean;
            duplicates?: { reviewYear: number; reviewId: string }[];
            error?: string;
          };
          try {
            data = (await res.json()) as typeof data;
          } catch {
            setStatusMessage(
              "We couldn’t read the server response. Please try Continue again.",
            );
            return;
          }
          if (!data.ok) {
            setStatusMessage(
              data.error ?? "Could not check for existing reviews.",
            );
            return;
          }
          const dups = data.duplicates ?? [];
          if (dups.length > 0) {
            setDuplicateModalDupes(dups);
            return;
          }
        } catch (err) {
          setStatusMessage(
            err instanceof Error
              ? err.message
              : "Network error while checking your review. Please try again.",
          );
          return;
        } finally {
          setDuplicateChecking(false);
        }
        advanceToStep(2);
        return;
      }
      if (step === 2) {
        if (overallScore == null || landlordScore == null) {
          setStatusMessage(SUBMIT_STEP2_SCORES_PROMPT);
          return;
        }
        setStatusMessage("");
        advanceToStep(3);
        return;
      }
      return;
    }
    const formElement = event.currentTarget;
    for (const s of [1, 2, 3] as const) {
      if (!isStepPanelValid(formElement, s)) {
        setStep(s);
        requestAnimationFrame(() => {
          if (formRef.current) validateStepPanel(formRef.current, s);
        });
        return;
      }
    }
    if (overallScore == null || landlordScore == null) {
      setStatusMessage(SUBMIT_STEP2_SCORES_PROMPT);
      setStep(2);
      return;
    }

    const sortedYears = [...selectedLeaseYears].sort((a, b) => b - a);
    if (sortedYears.length === 0) {
      setStatusMessage("Select at least one lease-start year.");
      setStep(1);
      return;
    }
    for (const y of sortedYears) {
      const raw = (rentByYear[y] ?? "").trim();
      const rent = Number(raw);
      if (
        raw === "" ||
        Number.isNaN(rent) ||
        rent < 0 ||
        !Number.isInteger(rent)
      ) {
        setStatusMessage(`Enter a valid monthly rent for ${y}.`);
        setStep(1);
        return;
      }
    }
    const yearEntries = sortedYears.map((y) => ({
      reviewYear: y,
      monthlyRent: Number(rentByYear[y]),
    }));

    const form = new FormData(formElement);

    const batchPayload = {
      address: String(form.get("address") ?? ""),
      unit: String(form.get("unit") ?? "").trim() || undefined,
      city: "Boston",
      state: "MA",
      postalCode: String(form.get("postalCode") ?? ""),
      bedroomCount: Number(form.get("bedroomCount")),
      bathrooms: Number(form.get("bathrooms")),
      reviewText: String(form.get("reviewText") ?? ""),
      hasParking: form.get("hasParking") === "on",
      hasCentralHeatCooling: form.get("hasCentralHeatCooling") === "on",
      hasInUnitLaundry: form.get("hasInUnitLaundry") === "on",
      hasStorageSpace: form.get("hasStorageSpace") === "on",
      hasOutdoorSpace: form.get("hasOutdoorSpace") === "on",
      petFriendly: form.get("petFriendly") === "on",
      overallScore: overallScore ?? undefined,
      landlordScore: landlordScore ?? undefined,
      majorityYearAttestation: form.get("majorityYearAttestation") === "on",
      yearEntries,
    };

    setFinalSubmitting(true);
    try {
      const response = await fetch("/api/reviews/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchPayload),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        moderationStatus?: string;
        userMessage?: string;
        count?: number;
      };

      if (!result.ok) {
        setStatusMessage(result.error ?? "Could not submit review.");
        return;
      }

      setStatusMessage(
        result.userMessage ??
          (result.moderationStatus === "PENDING_REVIEW"
            ? "Submitted - your review is being reviewed."
            : "Submitted successfully."),
      );
      setLastSubmittedBatchCount(
        Math.max(1, result.count ?? yearEntries.length),
      );
      trackEvent("review_submitted", {
        review_count: Math.max(1, result.count ?? yearEntries.length),
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
        const prefill = buildPrefillFromSubmitPayload({
          address: batchPayload.address,
          unit: batchPayload.unit,
          postalCode: batchPayload.postalCode,
          bedroomCount: batchPayload.bedroomCount,
          bathrooms: batchPayload.bathrooms,
          hasParking: batchPayload.hasParking,
          hasCentralHeatCooling: batchPayload.hasCentralHeatCooling,
          hasInUnitLaundry: batchPayload.hasInUnitLaundry,
          hasStorageSpace: batchPayload.hasStorageSpace,
          hasOutdoorSpace: batchPayload.hasOutdoorSpace,
          petFriendly: batchPayload.petFriendly,
        });
        window.localStorage.setItem(
          SUBMIT_STEP1_PREFILL_KEY,
          JSON.stringify(prefill),
        );
        setAnotherYearPrefill(prefill);
        setShowAnotherYearCta(true);
      }
      setShowSubmitSuccessModal(true);
    } finally {
      setFinalSubmitting(false);
    }
  }

  const callbackUrl = encodeURIComponent("/submit");
  const isAuthed = sessionUser && sessionUser !== "loading";
  const atReviewCap = reviewQuota?.atCap === true;
  const bostonGateActive =
    Boolean(isAuthed) &&
    (bostonFloor === undefined || bostonFloor === null);
  const formSurfaceBlocked =
    !isAuthed || atReviewCap || bostonGateActive;
  const submitActionLabel = duplicateChecking
    ? "Checking…"
    : finalSubmitting
      ? "Submitting…"
      : step < 3
        ? "Continue"
        : "Submit review";

  return (
    <AppPageShell gapClass="gap-6" className="relative">
      {sessionUser === "loading" ? (
        <p className="text-sm text-zinc-500">Checking sign-in…</p>
      ) : null}

      {!isAuthed && sessionUser !== "loading" ? (
        <div
          className={`${modalBackdropClass} z-40`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-auth-title"
        >
          <div className={modalDialogClass}>
            <h2
              id="submit-auth-title"
              className="text-xl font-semibold tracking-tight text-muted-blue-hover"
            >
              Sign in to submit a review
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Sign in with Google or email (new accounts get a quick verification code).
              You won&apos;t lose anything you already typed - it&apos;s saved on this device
              and comes back after you sign in.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={`/api/auth/signin/google?callbackUrl=${callbackUrl}`}
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-muted-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-muted-blue-hover"
              >
                Continue with Google
              </a>
              <Link
                href={`/signin?callbackUrl=${callbackUrl}`}
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
              >
                Email sign-in
              </Link>
              <Link
                href="/properties"
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-muted-blue transition hover:border-muted-blue/25 hover:bg-muted-blue-tint/30"
              >
                Browse apartments
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {isAuthed && atReviewCap ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 ring-1 ring-amber-100">
          You&apos;ve used all {reviewQuota?.max ?? 10} review slots for your account.
          To post a different address, edit or remove a review from your{" "}
          <Link href="/profile" className="font-semibold text-muted-blue hover:underline">
            profile
          </Link>
          .
        </div>
      ) : null}

      {isAuthed && bostonFloor === undefined ? (
        <p className="text-sm text-zinc-500">Loading your profile…</p>
      ) : null}

      {isAuthed && bostonFloor === null ? (
        <div className={`${modalBackdropClass} z-30`}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-boston-year-title"
            className={`${modalDialogClass} z-10 max-w-xl shadow-elevated`}
          >
            <h2
              id="submit-boston-year-title"
              className="text-lg font-semibold text-muted-blue-hover"
            >
              First, select the first year you started renting in Boston
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Before you submit a review, tell us the first calendar year you started
              renting an apartment in Boston. We use this only to determine which years
              you can review. Reviews are fully anonymous, and we do not show the exact
              year you lived at each property. You can also complete this on{" "}
              <Link
                href="/profile"
                className="font-semibold text-muted-blue hover:underline"
              >
                your profile
              </Link>
              .
            </p>
            <div className="mt-6">
              <BostonRentingYearPickForm
                yearChoices={getBostonRentingSinceYearChoices()}
                submitLabel="Save and continue"
                onSaved={(y) => setBostonFloor(y)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={formSurfaceBlocked ? "pointer-events-none opacity-40" : ""}
      >
        <PageHeader
          eyebrow="Submit review"
          title="Share your Boston rental experience"
          descriptionClassName="max-w-2xl text-base leading-[1.65] text-zinc-600 sm:text-lg sm:leading-[1.7]"
          description={
            <>
              <p>
                What the public sees is anonymous - your name never appears on the
                review.
              </p>
              <p className="mt-2.5 sm:mt-3">
                We don&apos;t publish your exact lease-start years, so no one can guess
                who wrote it.
              </p>
            </>
          }
        />
      </div>

      <section
        className={`rounded-2xl border border-emerald-200/60 bg-gradient-to-b from-emerald-50/95 to-emerald-50/80 p-5 text-emerald-950 shadow-[0_1px_2px_rgb(6_78_59/0.06)] sm:p-6 ${formSurfaceBlocked ? "pointer-events-none opacity-40" : ""}`}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-medium tracking-tight text-emerald-950">
            {step === 1
              ? "You're a couple clicks away from unlocking the full database of real renter reviews in Boston."
              : step === 2
                ? "Nice - keep going. The full Boston review database is almost yours."
                : "Last step - finish here and you're in."}
          </p>
          <p className="text-sm font-medium text-emerald-800/90">
            Step {step} of 3
          </p>
        </div>
        <div className="mt-4 flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2.5 flex-1 rounded-full transition-colors ${
                step >= s ? "bg-emerald-500" : "bg-emerald-200/80"
              }`}
            />
          ))}
        </div>
        <ul className="mt-5 grid gap-3 text-sm leading-snug sm:grid-cols-3 sm:gap-4">
          <li
            className={`rounded-xl bg-white/60 px-3 py-2.5 sm:px-3.5 ${step === 1 ? "font-semibold text-emerald-950 ring-1 ring-emerald-300/50" : "text-emerald-900/75"}`}
          >
            <span className="text-emerald-700/80">1 · </span>
            Your Property
          </li>
          <li
            className={`rounded-xl bg-white/60 px-3 py-2.5 sm:px-3.5 ${step === 2 ? "font-semibold text-emerald-950 ring-1 ring-emerald-300/50" : "text-emerald-900/75"}`}
          >
            <span className="text-emerald-700/80">2 · </span>
            Your Experience
          </li>
          <li
            className={`rounded-xl bg-white/60 px-3 py-2.5 sm:px-3.5 ${step === 3 ? "font-semibold text-emerald-950 ring-1 ring-emerald-300/50" : "text-emerald-900/75"}`}
          >
            <span className="text-emerald-700/80">3 · </span>
            Submit
          </li>
        </ul>
      </section>

      <form
        id="submit-review-form"
        ref={formRef}
        noValidate
        onSubmit={handleSubmit}
        onChange={() => {
          persistDraft();
        }}
        className={`${surfaceElevatedClass} scroll-mt-24 space-y-7 p-6 pb-28 text-base sm:space-y-8 sm:p-10 ${formSurfaceBlocked ? "pointer-events-none opacity-40" : ""}`}
      >
        <div
          data-step-panel="1"
          className={step === 1 ? "space-y-7" : "hidden"}
          aria-hidden={step !== 1}
        >
            <div id="submit-step-1" className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-muted-blue-hover sm:text-2xl">
                Where did you live?
              </h2>
              <div className="max-w-2xl space-y-2 pt-0.5">
                <p className="text-sm leading-relaxed text-zinc-600">
                  The years you select here are{" "}
                  <span className="font-semibold text-zinc-700">not shown exactly</span>{" "}
                  on the public review - only a broad timeframe.
                </p>
                {typeof bostonFloor === "number" ? (
                  <p className="text-sm leading-relaxed text-zinc-600">
                    Your profile says you started renting in Boston in {bostonFloor},
                    so only {bostonFloor} and later years appear here.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="h-px w-full bg-zinc-200/90" />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
              <div className="grid min-w-0 flex-1 gap-2">
                <label
                  htmlFor="address"
                  className="text-sm font-semibold leading-5 text-zinc-800"
                >
                  Street address
                </label>
                <input
                  id="address"
                  name="address"
                  placeholder="35 W 3rd St"
                  required
                  className={formInputCompactClass}
                />
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:flex sm:gap-3 lg:contents">
                <div className="grid min-w-0 gap-2 sm:max-w-[10rem] sm:flex-1 lg:w-[min(7.5rem,100%)] lg:max-w-[7.5rem] lg:flex-none">
                  <label
                    htmlFor="unit"
                    className="text-sm font-semibold leading-5 text-zinc-800"
                  >
                    Unit{" "}
                    <span className="font-normal text-zinc-500">(opt.)</span>
                  </label>
                  <input
                    id="unit"
                    name="unit"
                    placeholder="3B"
                    className={formInputCompactClass}
                  />
                </div>
                <div className="grid w-[min(100%,6.5rem)] shrink-0 gap-2 sm:w-28 lg:w-24 lg:flex-none">
                  <label
                    htmlFor="postalCode"
                    className="text-sm font-semibold leading-5 text-zinc-800"
                  >
                    ZIP
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    placeholder="02127"
                    required
                    inputMode="numeric"
                    className={formInputCompactClass}
                  />
                </div>
              </div>
              <div className="grid min-w-0 flex-[1.2] gap-2 lg:min-w-0">
                <span
                  className="text-sm font-semibold leading-5 text-zinc-800"
                  id="bedroom-count-label"
                >
                  Bedrooms
                </span>
                <div
                  className="flex h-10 w-full min-w-0 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:overflow-visible [&::-webkit-scrollbar]:hidden"
                  role="group"
                  aria-labelledby="bedroom-count-label"
                >
                  {BEDROOM_SUBMIT_OPTIONS.map(({ value, label }, i) => (
                    <label
                      key={value}
                      className="flex h-10 min-h-10 min-w-[2.35rem] flex-1 cursor-pointer items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-2 text-xs font-semibold tabular-nums text-zinc-700 shadow-[0_1px_0_rgb(15_23_42/0.03)] transition has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white has-[:checked]:shadow-none sm:min-w-9 sm:px-2.5"
                    >
                      <input
                        type="radio"
                        name="bedroomCount"
                        value={value}
                        required={i === 0}
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
                id="bathroom-count-label"
              >
                Bathrooms
              </span>
              <div
                className="flex w-full min-w-0 flex-wrap gap-1.5 sm:gap-2"
                role="group"
                aria-labelledby="bathroom-count-label"
              >
                {BATHROOM_SUBMIT_OPTIONS.map(({ value, label }, i) => (
                  <label
                    key={value}
                    className="flex h-10 min-h-10 min-w-[3rem] cursor-pointer items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-3 text-xs font-semibold tabular-nums text-zinc-700 shadow-[0_1px_0_rgb(15_23_42/0.03)] transition has-[:checked]:border-muted-blue-hover has-[:checked]:bg-muted-blue-hover has-[:checked]:text-white has-[:checked]:shadow-none sm:min-w-[3.25rem] sm:px-3.5"
                  >
                    <input
                      type="radio"
                      name="bathrooms"
                      value={value}
                      required={i === 0}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div
              id="lease-years-region"
              tabIndex={-1}
              className="grid gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 outline-none ring-muted-blue/40 focus-visible:ring-2 sm:p-5"
            >
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    Lease start year(s)
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                    {PRODUCT_POLICY.reviews.leaseStartYearRule} Choose every year you
                    want a review for - rent can differ each year.
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-600">
                    Please enter <strong>total unit monthly rent</strong> (not per room).
                  </p>
                </div>
                {leaseYearOptions.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    Set your Boston renting start year above to see eligible years.
                  </p>
                ) : (
                  <ul className="grid gap-2" role="list">
                    {leaseYearOptions.map((year) => {
                      const checked = selectedLeaseYears.includes(year);
                      return (
                        <li key={year}>
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
                                onChange={() => toggleLeaseYear(year)}
                                className="size-4 shrink-0 rounded border-zinc-300 text-muted-blue focus:ring-muted-blue/30"
                              />
                              <span className="text-base font-semibold tabular-nums text-zinc-900">
                                {year}
                              </span>
                            </label>
                            {checked ? (
                              <div className="border-t border-zinc-100 px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
                                <label
                                  htmlFor={`lease-rent-${year}`}
                                  className="text-xs font-semibold uppercase tracking-wide text-zinc-600"
                                >
                                  Monthly rent for {year}
                                </label>
                                <input
                                  id={`lease-rent-${year}`}
                                  type="number"
                                  min={0}
                                  step={1}
                                  inputMode="numeric"
                                  placeholder="e.g. 3200"
                                  value={rentByYear[year] ?? ""}
                                  onChange={(e) =>
                                    setRentForYear(year, e.target.value)
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
                <div className="rounded-xl border border-zinc-200/80 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
                    PRIVACY MAPPING (HOW YEARS ARE HIDDEN PUBLICLY)
                  </p>
                  <div className="mt-2 grid gap-2 text-xs text-zinc-600">
                    <p>
                      <span className="font-medium text-zinc-800">Recent years</span>{" "}
                      -&gt; Recent (within ~2 years)
                    </p>
                    <p>
                      <span className="font-medium text-zinc-800">Mid-range years</span>{" "}
                      -&gt; A few years ago (2-5 years)
                    </p>
                    <p>
                      <span className="font-medium text-zinc-800">Older years</span>{" "}
                      -&gt; Older experience (5+ years)
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    We store the exact year internally for quality checks and anti-spam,
                    but only show the bucket publicly.
                  </p>
                </div>
            </div>

            <div className="grid gap-5 rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-muted-blue-tint/40 to-muted-blue-tint/15 p-5 sm:gap-6 sm:p-7">
              <div>
                <p className="text-sm font-semibold text-zinc-800">
                  Amenities at your place
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                  Tap the ones that fit - tap again to turn off. Skip anything you&apos;re
                  unsure about.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {STEP1_AMENITY_CARDS.map(({ name, title, sub }) => (
                  <label
                    key={name}
                    className="relative block cursor-pointer select-none"
                  >
                    <input type="checkbox" name={name} className="peer sr-only" />
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

        <div
          data-step-panel="2"
          className={step === 2 ? "space-y-7" : "hidden"}
          aria-hidden={step !== 2}
        >
            <div id="submit-step-2" className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-muted-blue-hover sm:text-2xl">
                How was it, really?
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-[1.0625rem] sm:leading-[1.65]">
                Tap two scores. Add a few words if you want - even a short note helps.
              </p>
            </div>
            <div className="h-px w-full bg-zinc-200/90" />

            <div className="grid gap-8 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:gap-9 sm:p-7">
              <div>
                <p className="text-sm font-semibold text-zinc-800">
                  Tap a number from 1 (rough) to 10 (great)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  Go with your gut - there are no wrong answers.
                </p>
              </div>
              <ScoreScale
                name="overallScore"
                label="Overall rental experience"
                value={overallScore}
                onChange={(n) => {
                  setOverallScore(n);
                  queueMicrotask(persistDraft);
                }}
              />
              <ScoreScale
                name="landlordScore"
                label="Landlord / management responsiveness"
                value={landlordScore}
                onChange={(n) => {
                  setLandlordScore(n);
                  queueMicrotask(persistDraft);
                }}
              />
            </div>

            {overallScore == null || landlordScore == null ? (
              <p
                id="step2-scores-hint"
                className="rounded-xl border border-muted-blue/30 bg-muted-blue-tint/50 px-4 py-3.5 text-sm font-medium leading-snug text-muted-blue-hover sm:text-[0.9375rem]"
              >
                Tap a number (1–10) for <strong>both</strong> questions above - then
                Continue below will work.
              </p>
            ) : null}

            <div className="grid gap-3">
              <label htmlFor="reviewText" className="text-base font-semibold text-zinc-800">
                Anything else you&apos;d like to add?{" "}
                <span className="font-normal text-zinc-500">(optional)</span>
              </label>
              <textarea
                id="reviewText"
                name="reviewText"
                rows={6}
                placeholder="Noise, management, repairs, neighbors, tips for someone new - whatever feels fair to share."
                className={formTextareaClass}
              />
              <p className="text-sm leading-relaxed text-zinc-500">
                Totally optional, but stories help people the most. If you mention
                someone&apos;s full name, we may hold the review for a quick manual
                check before it goes live.
              </p>
            </div>
        </div>

        <div
          data-step-panel="3"
          className={step === 3 ? "space-y-7" : "hidden"}
          aria-hidden={step !== 3}
        >
            <div id="submit-step-3" className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-muted-blue-hover sm:text-2xl">
                Send it
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-[1.0625rem] sm:leading-[1.65]">
                Check the box - that&apos;s the last thing.
              </p>
            </div>
            <div className="h-px w-full bg-zinc-200/90" />

            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-zinc-200/80 bg-muted-blue-tint/30 p-4 text-base leading-relaxed text-zinc-700 sm:p-5">
              <input
                type="checkbox"
                name="majorityYearAttestation"
                required
                className="mt-1.5 size-4 shrink-0 rounded border-zinc-300"
              />
              <span>
                I confirm this review is truthful, based on my real rental experience,
                and I either lived at this property or was a leaseholder there for the
                year(s) I selected.
              </span>
            </label>

            <p className="rounded-2xl border border-zinc-200/80 bg-muted-blue-tint/30 p-4 text-sm leading-relaxed text-zinc-700 sm:p-5">
              Same as up top: what goes live stays anonymous - no name on the card.
            </p>
        </div>

        {statusMessage ? (
          <div
            ref={statusBannerRef}
            role="status"
            aria-live="polite"
            className={`scroll-mt-6 mb-5 rounded-xl border px-4 py-3.5 sm:px-5 ${
              statusMessage === SUBMIT_STEP2_SCORES_PROMPT
                ? "border-amber-400/80 bg-amber-50 text-amber-950 shadow-sm"
                : "border-zinc-200/90 bg-zinc-50 text-zinc-800"
            }`}
          >
            <p
              className={`text-sm leading-relaxed sm:text-base ${
                statusMessage === SUBMIT_STEP2_SCORES_PROMPT
                  ? "font-semibold"
                  : ""
              }`}
            >
              {statusMessage}
            </p>
          </div>
        ) : null}

        <div className="hidden border-t border-zinc-100 pt-6 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-wrap gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              ref={submitButtonRef}
              disabled={
                duplicateChecking ||
                finalSubmitting ||
                (step === 2 &&
                  (overallScore == null || landlordScore == null))
              }
              aria-describedby={
                step === 2 &&
                (overallScore == null || landlordScore == null)
                  ? "step2-scores-hint"
                  : undefined
              }
              className="rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgb(92_107_127/0.4)] transition hover:bg-muted-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitActionLabel}
            </button>
          </div>
        </div>

        {showAnotherYearCta && anotherYearPrefill ? (
          <div
            className={`${surfaceElevatedClass} relative space-y-4 overflow-hidden border-l-4 border-l-accent-teal p-5 sm:p-6`}
            role="region"
            aria-label="Add another lease year"
          >
            <div className="pointer-events-none absolute -right-16 top-4 h-24 w-24 rounded-full bg-accent-teal-tint/50 blur-2xl" />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-blue">
                Same building, different year
              </p>
              <p className="mt-2 text-base font-semibold text-muted-blue-hover">
                Add another review for a different lease start year?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                We&apos;ll keep your address, unit, ZIP, bedrooms, bathrooms, and
                amenity taps - pick lease-start year(s) and rent for each.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddAnotherLeaseYear()}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-muted-blue-hover"
                >
                  Add another lease year
                </button>
                <button
                  type="button"
                  onClick={dismissAnotherYearCta}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
                >
                  Not now
                </button>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                Tip: bookmark{" "}
                <span className="font-mono text-zinc-600">/submit?another=1</span> on
                this device to jump back with the same building pre-filled later.
              </p>
            </div>
          </div>
        ) : null}
      </form>

      {!formSurfaceBlocked ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-[min(88rem,calc(100%-1rem))] flex-col gap-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Step {step} of 3
            </p>
            <div className="flex items-center gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-muted-blue-hover active:bg-zinc-50"
              >
                Back
              </button>
            ) : null}
            <button
              type="submit"
              form="submit-review-form"
              disabled={
                duplicateChecking ||
                finalSubmitting ||
                (step === 2 && (overallScore == null || landlordScore == null))
              }
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-muted-blue px-5 py-2 text-sm font-semibold text-white active:bg-muted-blue-hover disabled:opacity-60"
            >
              {submitActionLabel}
            </button>
            </div>
          </div>
        </div>
      ) : null}

      {duplicateModalDupes && duplicateModalDupes.length > 0 ? (
        <div className={`${modalBackdropClass} z-[60]`}>
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close dialog"
            onClick={closeDuplicateModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dup-review-title"
            className={`${modalDialogClass} relative z-10 max-w-md`}
          >
            <div
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-pop/35 to-transparent sm:inset-x-8"
              aria-hidden
            />
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Close"
              onClick={closeDuplicateModal}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2
              id="dup-review-title"
              className="pr-10 text-xl font-semibold tracking-tight text-muted-blue-hover"
            >
              {duplicateModalDupes.length === 1
                ? "You already reviewed this place for that year"
                : "Some years already have reviews"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base sm:leading-relaxed">
              Each address and lease-start year can only have one review from your
              account. Deselect those years above and tap Continue again, or open an
              existing review to edit it.
            </p>
            <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
              {duplicateModalDupes
                .slice()
                .sort((a, b) => b.reviewYear - a.reviewYear)
                .map((d) => (
                  <li key={d.reviewId}>
                    <Link
                      href={`/profile/reviews/${d.reviewId}/edit`}
                      className="inline-flex text-sm font-semibold text-muted-blue hover:underline"
                      onClick={closeDuplicateModal}
                    >
                      Edit {d.reviewYear} review
                    </Link>
                  </li>
                ))}
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {duplicateModalDupes.length === 1 ? (
                <button
                  type="button"
                  disabled={duplicateDeleting}
                  onClick={() => void handleDuplicateDelete()}
                  className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {duplicateDeleting ? "Deleting…" : "Delete review"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeDuplicateModal}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
              >
                Back to form
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showSubmitSuccessModal ? (
        <div className={`${modalBackdropClass} z-[65]`}>
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close dialog"
            onClick={closeSubmitSuccessModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-success-title"
            aria-describedby="submit-success-desc"
            className={`${modalDialogClass} relative z-10 max-w-md`}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Close"
              onClick={closeSubmitSuccessModal}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue">
              Review submitted
            </p>
            <h2
              id="submit-success-title"
              className="mt-2 pr-10 text-xl font-semibold tracking-tight text-muted-blue-hover"
            >
              You&apos;re in - review submitted!
            </h2>
            <p
              id="submit-success-desc"
              className="mt-3 text-sm leading-relaxed text-zinc-600"
            >
              {lastSubmittedBatchCount > 1 ? (
                <>
                  All {lastSubmittedBatchCount} reviews are in. Thanks for helping
                  Boston renters with trusted local insight.
                </>
              ) : (
                <>
                  Thanks for helping Boston renters with trusted local insight.
                </>
              )}
            </p>
            <p className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-sm leading-relaxed text-emerald-950">
              You earned 1 giveaway entry.{" "}
              <span className="font-semibold">$200</span> in Boston restaurant gift
              cards will be awarded - each approved review adds another chance to win.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                ref={successPrimaryActionRef}
                onClick={handleLeaveAnotherReview}
                className="inline-flex items-center justify-center rounded-full bg-muted-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-muted-blue-hover"
              >
                Leave another review
              </button>
              <Link
                href="/profile#verification"
                onClick={closeSubmitSuccessModal}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
              >
                Verify phone in profile
              </Link>
              <Link
                href="/profile"
                onClick={closeSubmitSuccessModal}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
              >
                Go to profile
              </Link>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              More approved reviews = more chances to win (max 5 submissions per person
              per month).
            </p>
          </div>
        </div>
      ) : null}
    </AppPageShell>
  );
}
