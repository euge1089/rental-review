"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { SubmitRentalCardsStep } from "@/app/submit/submit-rental-cards-step";
import { BostonRentingYearPickForm } from "@/app/_components/boston-renting-year-pick-form";
import {
  BATHROOM_SUBMIT_OPTIONS,
  BEDROOM_SUBMIT_OPTIONS,
  PRODUCT_POLICY,
  REVIEW_YEAR_OPTIONS,
  getBostonRentingSinceYearChoices,
  reviewYearsAllowedForUser,
} from "@/lib/policy";
import {
  SUBMIT_STEP1_PREFILL_KEY,
  type SubmitStepOnePrefill,
  buildPrefillFromSubmitPayload,
} from "@/lib/submit-prefill";
import {
  emptyRentalCard,
  hydrateSubmitDraft,
  prefillToRentalCard,
  serializeSubmitDraft,
  type RentalCardState,
} from "@/lib/submit-rental-draft";
import {
  formInputCompactClass,
  formTextareaClass,
  modalBackdropClass,
  modalDialogClass,
  surfaceElevatedClass,
} from "@/lib/ui-classes";

const DRAFT_KEY = "rental-review-draft-v1";
const SMS_PROMPT_KEY = "sms-prompt-dismissed";
const MAX_RENTAL_CARDS = 5;

/** Shown when Continue is tapped without both 1–10 scores; also used for scroll/focus UX. */
const SUBMIT_STEP2_SCORES_PROMPT =
  "Please tap a score from 1–10 for both ratings on each place card.";

type SessionUser = {
  email?: string | null;
  name?: string | null;
  phoneVerified?: boolean;
};

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
  const [showSmsNudge, setShowSmsNudge] = useState(false);
  const [duplicateModalDupes, setDuplicateModalDupes] = useState<
    { reviewYear: number; reviewId: string }[] | null
  >(null);
  const [duplicateModalAddressHint, setDuplicateModalAddressHint] = useState<
    string | null
  >(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [duplicateDeleting, setDuplicateDeleting] = useState(false);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [rentalCards, setRentalCards] = useState<RentalCardState[]>(() => [
    emptyRentalCard(),
  ]);
  const [majorityAttestationDraft, setMajorityAttestationDraft] =
    useState(false);
  const [step1ErrorsByCardId, setStep1ErrorsByCardId] = useState<
    Record<string, string>
  >({});
  const [lastSubmittedBatchCount, setLastSubmittedBatchCount] = useState(1);
  const draftTouchedRef = useRef(false);

  const patchCard = useCallback(
    (id: string, patch: Partial<RentalCardState>) => {
      draftTouchedRef.current = true;
      setStep1ErrorsByCardId((e) => {
        if (!e[id]) return e;
        const next = { ...e };
        delete next[id];
        return next;
      });
      setRentalCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  const toggleCardYear = useCallback((cardId: string, year: number) => {
    draftTouchedRef.current = true;
    setRentalCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        if (c.selectedYears.includes(year)) {
          const rentByYear = { ...c.rentByYear };
          delete rentByYear[year];
          return {
            ...c,
            selectedYears: c.selectedYears
              .filter((y) => y !== year)
              .sort((a, b) => b - a),
            rentByYear,
          };
        }
        return {
          ...c,
          selectedYears: [...c.selectedYears, year].sort((a, b) => b - a),
        };
      }),
    );
    setStep1ErrorsByCardId((e) => {
      const next = { ...e };
      delete next[cardId];
      return next;
    });
  }, []);

  const setCardRentForYear = useCallback(
    (cardId: string, year: number, value: string) => {
      draftTouchedRef.current = true;
      setRentalCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? { ...c, rentByYear: { ...c.rentByYear, [year]: value } }
            : c,
        ),
      );
    },
    [],
  );

  const copyFromPreviousCard = useCallback(
    (targetIndex: number, targetId: string) => {
      draftTouchedRef.current = true;
      setStep1ErrorsByCardId((e) => {
        if (!e[targetId]) return e;
        const next = { ...e };
        delete next[targetId];
        return next;
      });
      setRentalCards((prev) => {
        if (targetIndex < 1) return prev;
        const source = prev[targetIndex - 1];
        const target = prev[targetIndex];
        if (!source || !target || target.id !== targetId) return prev;
        return prev.map((c, i) =>
          i === targetIndex
            ? {
                ...c,
                address: source.address,
                unit: source.unit,
                postalCode: source.postalCode,
                bedroomCount: source.bedroomCount,
                bathrooms: source.bathrooms,
                hasParking: source.hasParking,
                hasCentralHeatCooling: source.hasCentralHeatCooling,
                hasInUnitLaundry: source.hasInUnitLaundry,
                hasStorageSpace: source.hasStorageSpace,
                hasOutdoorSpace: source.hasOutdoorSpace,
                petFriendly: source.petFriendly,
                overallScore: source.overallScore,
                landlordScore: source.landlordScore,
                reviewText: source.reviewText,
              }
            : c,
        );
      });
    },
    [],
  );
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
    setRentalCards((prev) =>
      prev.map((c) => {
        const years = c.selectedYears.filter((y) =>
          leaseYearOptions.includes(y),
        );
        const rentByYear = { ...c.rentByYear };
        for (const k of Object.keys(rentByYear)) {
          const y = Number(k);
          if (!leaseYearOptions.includes(y)) delete rentByYear[y];
        }
        return { ...c, selectedYears: years, rentByYear };
      }),
    );
  }, [bostonFloor, leaseYearOptions]);

  useEffect(() => {
    if (sessionUser && sessionUser !== "loading" && !sessionUser.phoneVerified) {
      if (typeof window === "undefined") return;
      if (!window.sessionStorage.getItem(SMS_PROMPT_KEY)) {
        setShowSmsNudge(true);
      }
    }
  }, [sessionUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("another") === "1") {
      const preRaw = window.localStorage.getItem(SUBMIT_STEP1_PREFILL_KEY);
      if (preRaw) {
        try {
          const prefill = JSON.parse(preRaw) as SubmitStepOnePrefill;
          setRentalCards([prefillToRentalCard(prefill)]);
          setMajorityAttestationDraft(false);
          setStep1ErrorsByCardId({});
          window.history.replaceState(null, "", "/submit");
          setStatusMessage(
            "We filled in your building from last time — pick your lease-start year(s) and rent for each.",
          );
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
      const hydrated = hydrateSubmitDraft(JSON.parse(raw));
      const cards =
        hydrated.rentalCards.length > 0
          ? hydrated.rentalCards
          : [emptyRentalCard()];
      setRentalCards(cards);
      setMajorityAttestationDraft(hydrated.majorityYearAttestation);
      try {
        window.localStorage.setItem(
          DRAFT_KEY,
          serializeSubmitDraft({
            rentalCards: cards,
            step: 1,
            majorityYearAttestation: hydrated.majorityYearAttestation,
          }),
        );
      } catch {
        // ignore quota / private mode
      }
    } catch {
      // ignore
    }
  }, []);

  const persistDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        serializeSubmitDraft({
          rentalCards,
          step: 1,
          majorityYearAttestation: majorityAttestationDraft,
        }),
      );
    } catch {
      // ignore
    }
  }, [rentalCards, majorityAttestationDraft]);

  useEffect(() => {
    if (!draftTouchedRef.current) return;
    persistDraft();
  }, [rentalCards, majorityAttestationDraft, persistDraft]);

  function addRentalCard() {
    if (rentalCards.length >= MAX_RENTAL_CARDS) return;
    draftTouchedRef.current = true;
    setRentalCards((prev) => [...prev, emptyRentalCard()]);
  }

  function removeRentalCard(id: string) {
    if (rentalCards.length <= 1) return;
    draftTouchedRef.current = true;
    setRentalCards((prev) => prev.filter((c) => c.id !== id));
    setStep1ErrorsByCardId((e) => {
      if (!e[id]) return e;
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  function handleAddAnotherLeaseYear() {
    if (!anotherYearPrefill) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        SUBMIT_STEP1_PREFILL_KEY,
        JSON.stringify(anotherYearPrefill),
      );
    }
    setRentalCards([prefillToRentalCard(anotherYearPrefill)]);
    setMajorityAttestationDraft(false);
    setShowAnotherYearCta(false);
    setAnotherYearPrefill(null);
    setStep1ErrorsByCardId({});
    setStatusMessage(
      "We kept your place details — pick lease-start year(s) and rent for each.",
    );
    draftTouchedRef.current = true;
    requestAnimationFrame(() => {
      document.getElementById("lease-years-region")?.focus();
    });
  }

  function dismissAnotherYearCta() {
    setShowAnotherYearCta(false);
    setAnotherYearPrefill(null);
  }

  function validateRentalStep1(cards: RentalCardState[]): boolean {
    const errors: Record<string, string> = {};
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i]!;
      const label = `Place ${i + 1}`;
      if (c.address.trim().length < 5) {
        errors[c.id] = `${label}: Add a street address.`;
        continue;
      }
      if (c.postalCode.trim().length < 3) {
        errors[c.id] = `${label}: Add a ZIP code.`;
        continue;
      }
      if (c.bedroomCount == null) {
        errors[c.id] = `${label}: Choose bedrooms.`;
        continue;
      }
      if (c.bathrooms == null) {
        errors[c.id] = `${label}: Choose bathrooms.`;
        continue;
      }
      const sortedYears = [...c.selectedYears].sort((a, b) => b - a);
      if (sortedYears.length === 0) {
        errors[c.id] = `${label}: Select at least one lease-start year.`;
        continue;
      }
      let rentOk = true;
      for (const y of sortedYears) {
        const raw = (c.rentByYear[y] ?? "").trim();
        const rent = Number(raw);
        if (
          raw === "" ||
          Number.isNaN(rent) ||
          rent < 0 ||
          !Number.isInteger(rent)
        ) {
          errors[c.id] = `${label}: Enter whole-dollar monthly rent for ${y} (use 0 if rent-free).`;
          rentOk = false;
          break;
        }
      }
      if (!rentOk) continue;
      if (c.overallScore == null || c.landlordScore == null) {
        errors[c.id] = `${label}: Tap 1–10 for both experience ratings.`;
      }
    }
    setStep1ErrorsByCardId(errors);
    if (Object.keys(errors).length > 0) {
      const first = cards.find((card) => errors[card.id]);
      if (first) {
        setRentalCards((prev) =>
          prev.map((card) =>
            card.id === first.id ? { ...card, collapsed: false } : card,
          ),
        );
        requestAnimationFrame(() => {
          document.getElementById(`rental-card-${first.id}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      }
      setStatusMessage("Fix the highlighted places above, then tap Continue.");
      return false;
    }
    setStep1ErrorsByCardId({});
    setStatusMessage("");
    return true;
  }

  function dismissSmsNudge() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SMS_PROMPT_KEY, "1");
    }
    setShowSmsNudge(false);
  }

  const closeDuplicateModal = useCallback(() => {
    setDuplicateModalDupes(null);
    setDuplicateModalAddressHint(null);
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
    if (anotherYearPrefill) {
      handleAddAnotherLeaseYear();
    } else {
      setRentalCards([emptyRentalCard()]);
      setMajorityAttestationDraft(false);
      setStep1ErrorsByCardId({});
      setStatusMessage("Ready for your next review.");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
      }
      requestAnimationFrame(() => {
        document.getElementById("rental-card-first-address")?.focus();
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
        "That review was removed. You can tap Submit again to continue.",
      );
    } finally {
      setDuplicateDeleting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const signedIn = sessionUser && sessionUser !== "loading";
    if (!signedIn) return;

    if (!validateRentalStep1(rentalCards)) {
      return;
    }

    const form = new FormData(formElement);
    if (form.get("majorityYearAttestation") !== "on") {
      setStatusMessage(
        "Please check the box to confirm your lease attestation.",
      );
      document.getElementById("majority-year-attestation")?.focus();
      return;
    }

    setDuplicateChecking(true);
    setDuplicateModalAddressHint(null);
    try {
      for (let i = 0; i < rentalCards.length; i++) {
        const c = rentalCards[i]!;
        const sortedYears = [...c.selectedYears].sort((a, b) => b - a);
        const res = await fetch("/api/reviews/duplicate-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: c.address.trim(),
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
            "We couldn’t read the server response. Please try Submit again.",
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
          setDuplicateModalAddressHint(
            c.address.trim().slice(0, 72) || `Property ${i + 1}`,
          );
          return;
        }
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

    const multiPayload = {
      majorityYearAttestation: true as const,
      rentals: rentalCards.map((c) => {
        const sortedYears = [...c.selectedYears].sort((a, b) => b - a);
        return {
          address: c.address.trim(),
          unit: c.unit.trim() || undefined,
          city: "Boston",
          state: "MA",
          postalCode: c.postalCode.trim(),
          bedroomCount: c.bedroomCount!,
          bathrooms: c.bathrooms!,
          reviewText: c.reviewText.trim() || undefined,
          hasParking: c.hasParking,
          hasCentralHeatCooling: c.hasCentralHeatCooling,
          hasInUnitLaundry: c.hasInUnitLaundry,
          hasStorageSpace: c.hasStorageSpace,
          hasOutdoorSpace: c.hasOutdoorSpace,
          petFriendly: c.petFriendly,
          overallScore: c.overallScore!,
          landlordScore: c.landlordScore!,
          yearEntries: sortedYears.map((y) => ({
            reviewYear: y,
            monthlyRent: Number(c.rentByYear[y]),
          })),
        };
      }),
    };

    const primaryPlace = rentalCards[0]!;

    setFinalSubmitting(true);
    try {
      const response = await fetch("/api/reviews/batch-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(multiPayload),
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
            ? "Submitted — your review is being reviewed."
            : "Submitted successfully."),
      );
      const created = Math.max(
        1,
        result.count ??
          rentalCards.reduce((n, c) => n + c.selectedYears.length, 0),
      );
      setLastSubmittedBatchCount(created);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
        const prefill = buildPrefillFromSubmitPayload({
          address: primaryPlace.address.trim(),
          unit: primaryPlace.unit.trim() || undefined,
          postalCode: primaryPlace.postalCode.trim(),
          bedroomCount: primaryPlace.bedroomCount!,
          bathrooms: primaryPlace.bathrooms!,
          hasParking: primaryPlace.hasParking,
          hasCentralHeatCooling: primaryPlace.hasCentralHeatCooling,
          hasInUnitLaundry: primaryPlace.hasInUnitLaundry,
          hasStorageSpace: primaryPlace.hasStorageSpace,
          hasOutdoorSpace: primaryPlace.hasOutdoorSpace,
          petFriendly: primaryPlace.petFriendly,
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
              You won&apos;t lose anything you already typed — it&apos;s saved on this device
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

      {showSmsNudge && isAuthed ? (
        <div
          className={`${modalBackdropClass} z-30`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sms-nudge-title"
        >
          <div className={modalDialogClass}>
            <h2
              id="sms-nudge-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Verify your phone on Profile?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Add SMS verification under{" "}
              <span className="font-medium">Profile</span> for a verified renter badge
              and <span className="font-medium">faster approval</span> (usually right
              away when your review doesn&apos;t need manual checks). If you skip it,
              we may take up to{" "}
              <span className="font-medium">
                {PRODUCT_POLICY.verification.unverifiedReviewSlaBusinessDays} business
                days
              </span>{" "}
              to manually review new submissions.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/profile#verification"
                className="inline-flex justify-center rounded-full bg-muted-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-muted-blue-hover"
                onClick={dismissSmsNudge}
              >
                Verify in profile
              </Link>
              <button
                type="button"
                onClick={dismissSmsNudge}
                className="inline-flex justify-center rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Not now
              </button>
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
        <div className={`${surfaceElevatedClass} space-y-4 p-6 sm:p-8`}>
          <h2 className="text-lg font-semibold text-muted-blue-hover">
            Set your Boston renting start year
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600">
            Before you submit a review, tell us the first calendar year you started
            renting an apartment in Boston. You&apos;ll only be able to choose
            lease-start years on or after that year. You can also complete this on{" "}
            <Link href="/profile" className="font-semibold text-muted-blue hover:underline">
              your profile
            </Link>
            .
          </p>
          <BostonRentingYearPickForm
            yearChoices={getBostonRentingSinceYearChoices()}
            submitLabel="Save and continue"
            onSaved={(y) => setBostonFloor(y)}
          />
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
                One submission: your rental place(s) — address, years, rent, how it
                felt, and a quick lease confirmation. You can cover multiple Boston
                buildings at once.
              </p>
              <p className="mt-3 text-zinc-500 sm:mt-4">
                Your draft saves on this device until you send it.
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
            One page — add each property, then submit
          </p>
        </div>
        <div className="mt-4 h-2.5 w-full rounded-full bg-emerald-200/80">
          <div className="h-full w-full rounded-full bg-emerald-500" />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-emerald-900/85">
          We check for duplicate years and save your draft automatically while you type.
        </p>
      </section>

      <form
        ref={formRef}
        noValidate
        onSubmit={handleSubmit}
        className={`${surfaceElevatedClass} space-y-7 p-6 text-base sm:space-y-8 sm:p-10 ${formSurfaceBlocked ? "pointer-events-none opacity-40" : ""}`}
      >
        <div className="space-y-7">
          <SubmitRentalCardsStep
            rentalCards={rentalCards}
            leaseYearOptions={leaseYearOptions}
            bostonFloor={bostonFloor}
            step1ErrorsByCardId={step1ErrorsByCardId}
            patchCard={patchCard}
            toggleCardYear={toggleCardYear}
            setCardRentForYear={setCardRentForYear}
            copyFromPreviousCard={copyFromPreviousCard}
            removeRentalCard={removeRentalCard}
            addRentalCard={addRentalCard}
            maxCards={MAX_RENTAL_CARDS}
          />

          <div className="space-y-4 border-t border-zinc-200/90 pt-6">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200/80 bg-muted-blue-tint/30 p-4 text-sm leading-relaxed text-zinc-700 sm:gap-4 sm:p-5 sm:text-base">
              <input
                id="majority-year-attestation"
                type="checkbox"
                name="majorityYearAttestation"
                required
                checked={majorityAttestationDraft}
                onChange={(e) => {
                  draftTouchedRef.current = true;
                  setMajorityAttestationDraft(e.target.checked);
                }}
                className="mt-1 size-4 shrink-0 rounded border-zinc-300"
              />
              <span>{PRODUCT_POLICY.reviews.majorityYearAttestationRule}</span>
            </label>
            <p className="text-sm leading-relaxed text-zinc-600">
              Your public review is fully anonymous by default. We never show your name
              on review cards. Phone verification is optional on your profile for a
              verified badge and usually quicker approval.
            </p>
          </div>
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

        <div className="flex flex-col gap-4 border-t border-zinc-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <button
            type="submit"
            ref={submitButtonRef}
            disabled={duplicateChecking || finalSubmitting}
            className="rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgb(92_107_127/0.4)] transition hover:bg-muted-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {duplicateChecking
              ? "Checking…"
              : finalSubmitting
                ? "Submitting…"
                : "Submit review"}
          </button>
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
                amenity taps — pick lease-start year(s) and rent for each.
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
            {duplicateModalAddressHint ? (
              <p className="mt-2 text-sm font-medium text-muted-blue-hover">
                Affected property: {duplicateModalAddressHint}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base sm:leading-relaxed">
              Each address and lease-start year can only have one review from your
              account. Deselect those years on that place card and tap Continue again,
              or open an existing review to edit it.
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
              Big win - your renter intel is live.
            </h2>
            <p
              id="submit-success-desc"
              className="mt-3 text-sm leading-relaxed text-zinc-600"
            >
              {lastSubmittedBatchCount > 1 ? (
                <>
                  All {lastSubmittedBatchCount} reviews are in — across the place cards
                  and years you submitted. You just made the next Boston renter way
                  harder to rip off.
                </>
              ) : (
                <>
                  Thanks for sharing that. You just made the next Boston renter way
                  harder to rip off.
                </>
              )}
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
                href="/analytics"
                onClick={closeSubmitSuccessModal}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
              >
                See Rent Explorer
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </AppPageShell>
  );
}
