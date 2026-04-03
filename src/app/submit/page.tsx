"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import {
  BEDROOM_SUBMIT_OPTIONS,
  PRODUCT_POLICY,
  REVIEW_YEAR_OPTIONS,
} from "@/lib/policy";
import {
  formInputCompactClass,
  formSelectCompactClass,
  formTextareaClass,
  modalBackdropClass,
  modalDialogClass,
  surfaceElevatedClass,
} from "@/lib/ui-classes";

const DRAFT_KEY = "rental-review-draft-v1";
const SMS_PROMPT_KEY = "sms-prompt-dismissed";

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
  const [statusMessage, setStatusMessage] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showSmsNudge, setShowSmsNudge] = useState(false);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [landlordScore, setLandlordScore] = useState<number | null>(null);
  const [duplicateModalReviewId, setDuplicateModalReviewId] = useState<
    string | null
  >(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [duplicateDeleting, setDuplicateDeleting] = useState(false);
  const [reviewQuota, setReviewQuota] = useState<{
    count: number;
    max: number;
    atCap: boolean;
  } | null>(null);

  useEffect(() => {
    if (!sessionUser || sessionUser === "loading") {
      setReviewQuota(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/reviews/my-count");
      const data = (await res.json()) as {
        ok?: boolean;
        count?: number;
        max?: number;
        atCap?: boolean;
      };
      if (
        !cancelled &&
        data.ok &&
        typeof data.count === "number" &&
        typeof data.max === "number"
      ) {
        setReviewQuota({
          count: data.count,
          max: data.max,
          atCap: Boolean(data.atCap),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  useEffect(() => {
    if (sessionUser && sessionUser !== "loading" && !sessionUser.phoneVerified) {
      if (typeof window === "undefined") return;
      if (!window.sessionStorage.getItem(SMS_PROMPT_KEY)) {
        setShowSmsNudge(true);
      }
    }
  }, [sessionUser]);

  useEffect(() => {
    if (typeof window === "undefined" || !formRef.current) return;
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Record<string, unknown>;
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
      setIfPresent("year", draft.reviewYear);
      setIfPresent("monthlyRent", draft.monthlyRent);
      setIfPresent("bathrooms", draft.bathrooms);
      setIfPresent("reviewText", draft.reviewText);
      setIfPresent("hasParking", draft.hasParking);
      setIfPresent("hasCentralHeatCooling", draft.hasCentralHeatCooling);
      setIfPresent("hasInUnitLaundry", draft.hasInUnitLaundry);
      setIfPresent("hasStorageSpace", draft.hasStorageSpace);
      setIfPresent("hasOutdoorSpace", draft.hasOutdoorSpace);
      setIfPresent("petFriendly", draft.petFriendly);
      setIfPresent("majorityYearAttestation", draft.majorityYearAttestation);
      setIfPresent("displayFullyAnonymous", draft.displayFullyAnonymous);

      if (draft.bedroomCount != null) {
        const radios = form.querySelectorAll<HTMLInputElement>(
          'input[name="bedroomCount"]',
        );
        radios.forEach((r) => {
          r.checked = String(r.value) === String(draft.bedroomCount);
        });
      }

      const os = draft.overallScore;
      const ls = draft.landlordScore;
      if (typeof os === "number" || (typeof os === "string" && os !== "")) {
        setOverallScore(Number(os));
      }
      if (typeof ls === "number" || (typeof ls === "string" && ls !== "")) {
        setLandlordScore(Number(ls));
      }
    } catch {
      // ignore
    }
  }, []);

  function persistDraft() {
    if (typeof window === "undefined" || !formRef.current) return;
    const form = formRef.current;
    const data = new FormData(form);
    const br = data.get("bedroomCount");
    const draft = {
      address: data.get("address") ?? "",
      unit: data.get("unit") ?? "",
      postalCode: data.get("postalCode") ?? "",
      reviewYear: data.get("year") ?? "",
      bedroomCount: br != null && br !== "" ? Number(br) : "",
      monthlyRent: data.get("monthlyRent") ?? "",
      bathrooms: data.get("bathrooms") ?? "",
      hasParking: data.get("hasParking") === "on",
      hasCentralHeatCooling: data.get("hasCentralHeatCooling") === "on",
      hasInUnitLaundry: data.get("hasInUnitLaundry") === "on",
      hasStorageSpace: data.get("hasStorageSpace") === "on",
      hasOutdoorSpace: data.get("hasOutdoorSpace") === "on",
      petFriendly: data.get("petFriendly") === "on",
      overallScore: overallScore ?? "",
      landlordScore: landlordScore ?? "",
      reviewText: data.get("reviewText") ?? "",
      majorityYearAttestation: data.get("majorityYearAttestation") === "on",
      displayFullyAnonymous: data.get("displayFullyAnonymous") === "on",
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
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

  function dismissSmsNudge() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SMS_PROMPT_KEY, "1");
    }
    setShowSmsNudge(false);
  }

  const closeDuplicateModal = useCallback(() => {
    setDuplicateModalReviewId(null);
  }, []);

  useEffect(() => {
    if (!duplicateModalReviewId) return;
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
  }, [duplicateModalReviewId, closeDuplicateModal]);

  async function handleDuplicateDelete() {
    if (!duplicateModalReviewId) return;
    if (
      !window.confirm(
        "Delete this review permanently? You can submit a new one for this address and year afterward.",
      )
    ) {
      return;
    }
    setDuplicateDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${duplicateModalReviewId}`, {
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
        const yearRaw = fd.get("year");
        const reviewYear = Number(yearRaw);
        if (!yearRaw || Number.isNaN(reviewYear)) {
          return;
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
              reviewYear,
            }),
          });
          const data = (await res.json()) as {
            ok: boolean;
            exists?: boolean;
            reviewId?: string | null;
            error?: string;
          };
          if (!data.ok) {
            setStatusMessage(data.error ?? "Could not check for an existing review.");
            return;
          }
          if (data.exists && data.reviewId) {
            setDuplicateModalReviewId(data.reviewId);
            return;
          }
        } finally {
          setDuplicateChecking(false);
        }
        setStep(2);
        return;
      }
      if (step === 2) {
        if (overallScore == null || landlordScore == null) {
          setStatusMessage("Please tap a score from 1–10 for both questions.");
          return;
        }
        setStatusMessage("");
        setStep(3);
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
      setStatusMessage("Please tap a score from 1–10 for both questions.");
      setStep(2);
      return;
    }

    const form = new FormData(formElement);

    const payload = {
      address: String(form.get("address") ?? ""),
      unit: String(form.get("unit") ?? "").trim() || undefined,
      city: "Boston",
      state: "MA",
      postalCode: String(form.get("postalCode") ?? ""),
      reviewYear: Number(form.get("year")),
      bedroomCount: Number(form.get("bedroomCount")),
      monthlyRent: Number(form.get("monthlyRent")),
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
      displayFullyAnonymous: form.get("displayFullyAnonymous") === "on",
    };

    const response = await fetch("/api/reviews", {
      method: "POST",
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
      setStatusMessage(result.error ?? "Could not submit review.");
      return;
    }

    setStatusMessage(
      result.userMessage ??
        (result.moderationStatus === "PENDING_REVIEW"
          ? "Submitted — your review is being reviewed."
          : "Submitted successfully."),
    );
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }

  const callbackUrl = encodeURIComponent("/submit");
  const isAuthed = sessionUser && sessionUser !== "loading";
  const atReviewCap = reviewQuota?.atCap === true;

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

      <div
        className={
          !isAuthed || atReviewCap ? "pointer-events-none opacity-40" : ""
        }
      >
        <PageHeader
          eyebrow="Submit review"
          title="Share your Boston rental experience"
          descriptionClassName="max-w-2xl text-base leading-[1.65] text-zinc-600 sm:text-lg sm:leading-[1.7]"
          description={
            <>
              <p>
                There&apos;s no rush — we&apos;ll guide you through three simple parts:
                your place, how living there felt, and a quick check before you send it.
              </p>
              <p className="mt-3 text-zinc-500 sm:mt-4">
                Your draft saves on this device, so you can step away and pick up where
                you left off.
              </p>
            </>
          }
        />
      </div>

      <section
        className={`rounded-2xl border border-emerald-200/60 bg-gradient-to-b from-emerald-50/95 to-emerald-50/80 p-5 text-emerald-950 shadow-[0_1px_2px_rgb(6_78_59/0.06)] sm:p-6 ${!isAuthed ? "pointer-events-none opacity-40" : ""}`}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-medium tracking-tight text-emerald-950">
            {step === 3
              ? "Last step — you've got this"
              : "Take it one step at a time"}
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
        ref={formRef}
        onSubmit={handleSubmit}
        onChange={() => {
          persistDraft();
        }}
        className={`${surfaceElevatedClass} space-y-7 p-6 text-base sm:space-y-8 sm:p-10 ${!isAuthed ? "pointer-events-none opacity-40" : ""}`}
      >
        <div
          data-step-panel="1"
          className={step === 1 ? "space-y-7" : "hidden"}
          aria-hidden={step !== 1}
        >
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-blue">
                Step 1
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-muted-blue-hover sm:text-2xl">
                Where did you live?
              </h2>
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
              <div className="flex min-w-0 gap-2 sm:gap-3 lg:contents">
                <div className="grid min-w-0 flex-1 gap-2 sm:max-w-[10rem] lg:w-[min(7.5rem,100%)] lg:max-w-[7.5rem] lg:flex-none">
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

            <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              <div className="grid gap-2.5">
                <label htmlFor="year" className="text-sm font-semibold text-zinc-800">
                  Lease start year
                </label>
                <select
                  id="year"
                  name="year"
                  required
                  className={formSelectCompactClass}
                >
                  <option value="">Select year</option>
                  {REVIEW_YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {PRODUCT_POLICY.reviews.leaseStartYearRule}
                </p>
              </div>
              <div className="grid gap-2.5">
                <label
                  htmlFor="monthlyRent"
                  className="text-sm font-semibold text-zinc-800"
                >
                  Monthly rent
                </label>
                <input
                  id="monthlyRent"
                  name="monthlyRent"
                  type="number"
                  min={0}
                  placeholder="e.g. 3200"
                  required
                  className={formInputCompactClass}
                />
              </div>
              <div className="grid gap-2.5">
                <label
                  htmlFor="bathrooms"
                  className="text-sm font-semibold text-zinc-800"
                >
                  Bathrooms
                </label>
                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.5}
                  placeholder="e.g. 1, 1.5, or 2"
                  required
                  className={formInputCompactClass}
                />
                <p className="text-sm leading-relaxed text-zinc-500">
                  Use <span className="font-mono text-zinc-600">.5</span> for a half
                  bath — for example{" "}
                  <span className="font-mono text-zinc-600">1.5</span> means one full
                  and one half.
                </p>
              </div>
            </div>

            <div className="grid gap-5 rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-muted-blue-tint/40 to-muted-blue-tint/15 p-5 sm:gap-6 sm:p-7">
              <div>
                <p className="text-sm font-semibold text-zinc-800">
                  Amenities at your place
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                  Tap the ones that fit — tap again to turn off. Skip anything you&apos;re
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
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-blue">
                Step 2
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-muted-blue-hover sm:text-2xl">
                How was it, really?
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-[1.0625rem] sm:leading-[1.65]">
                Two quick number ratings, then a written part only if you want — even a
                few sentences help the next renter a lot.
              </p>
            </div>
            <div className="h-px w-full bg-zinc-200/90" />

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

            <div className="grid gap-3">
              <label htmlFor="reviewText" className="text-base font-semibold text-zinc-800">
                Anything else you&apos;d like to add?{" "}
                <span className="font-normal text-zinc-500">(optional)</span>
              </label>
              <textarea
                id="reviewText"
                name="reviewText"
                rows={6}
                placeholder="Noise, management, repairs, neighbors, tips for someone new — whatever feels fair to share."
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
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-blue">
                Step 3
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-muted-blue-hover sm:text-2xl">
                One last look
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-[1.0625rem] sm:leading-[1.65]">
                Please read the two items below and check the boxes if they fit. Phone
                verification is optional — you can add it anytime on your profile for a
                verified badge and usually quicker approval.
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
              <span>{PRODUCT_POLICY.reviews.majorityYearAttestationRule}</span>
            </label>

            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-zinc-200/80 bg-muted-blue-tint/30 p-4 text-base leading-relaxed text-zinc-700 sm:p-5">
              <input
                type="checkbox"
                name="displayFullyAnonymous"
                className="mt-1.5 size-4 shrink-0 rounded border-zinc-300"
              />
              <span>
                <span className="font-semibold text-zinc-800">
                  List me as fully anonymous.
                </span>{" "}
                Your review will show as &quot;Anonymous renter&quot; with no initials.
                We still tie it to your account behind the scenes for moderation only.
              </span>
            </label>
        </div>

        <div className="flex flex-col gap-5 border-t border-zinc-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
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
              disabled={duplicateChecking}
              className="rounded-full bg-muted-blue px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgb(92_107_127/0.4)] transition hover:bg-muted-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {duplicateChecking
                ? "Checking…"
                : step < 3
                  ? "Continue"
                  : "Submit review"}
            </button>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-zinc-500">
            Need a break? Your answers stay on this device until you send the review.
          </p>
        </div>
        {statusMessage ? (
          <p className="text-base leading-relaxed text-zinc-700">{statusMessage}</p>
        ) : null}
      </form>

      {duplicateModalReviewId ? (
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
              You already reviewed this place for that year
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base sm:leading-relaxed">
              Each address and lease year can only have one review from your account.
              Update the existing one, or delete it if you&apos;d like to start over on
              this form.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/profile/reviews/${duplicateModalReviewId}/edit`}
                className="inline-flex items-center justify-center rounded-full bg-muted-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-muted-blue-hover"
                onClick={closeDuplicateModal}
              >
                Edit my review
              </Link>
              <button
                type="button"
                disabled={duplicateDeleting}
                onClick={() => void handleDuplicateDelete()}
                className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                {duplicateDeleting ? "Deleting…" : "Delete review"}
              </button>
              <button
                type="button"
                onClick={closeDuplicateModal}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppPageShell>
  );
}
