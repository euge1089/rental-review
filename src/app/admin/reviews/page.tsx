"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { bedroomCountToBand } from "@/lib/analytics";
import type { AdminReviewPayload } from "@/lib/serialization";
import { formInputCompactClass, linkMutedClass, surfaceSubtleClass } from "@/lib/ui-classes";

function AdminMonthlyRentField({
  reviewId,
  monthlyRent,
  disabled,
  onSaved,
  onError,
}: {
  reviewId: string;
  monthlyRent: number | null;
  disabled: boolean;
  onSaved: (monthlyRent: number) => void;
  onError: (message: string) => void;
}) {
  const [value, setValue] = useState(
    monthlyRent != null ? String(monthlyRent) : "",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(monthlyRent != null ? String(monthlyRent) : "");
  }, [reviewId, monthlyRent]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed === "") {
      onError("Enter a whole-dollar amount (or 0).");
      return;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 0) {
      onError("Rent must be a whole number ≥ 0 (total per unit, not per room).");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyRent: n }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        monthlyRent?: number | null;
        error?: string;
      };
      if (!result.ok) {
        onError(result.error ?? "Could not update rent.");
        return;
      }
      if (typeof result.monthlyRent === "number") {
        onSaved(result.monthlyRent);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2"
      onSubmit={(e) => void onSubmit(e)}
    >
      <div>
        <label
          htmlFor={`admin-rent-${reviewId}`}
          className="block text-[11px] font-medium uppercase tracking-wide text-zinc-500"
        >
          Monthly rent (total unit, $)
        </label>
        <input
          id={`admin-rent-${reviewId}`}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          className={`${formInputCompactClass} mt-1 w-[8.5rem]`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled || saving}
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-muted-blue-hover hover:bg-muted-blue-tint/40 disabled:opacity-60 sm:min-h-9"
        disabled={disabled || saving}
      >
        {saving ? "Saving…" : "Save rent"}
      </button>
    </form>
  );
}

function AdminReviewsInner() {
  const searchParams = useSearchParams();
  const userIdFromUrl = searchParams.get("userId") ?? "";
  const qFromUrl = searchParams.get("q") ?? "";

  const [reviews, setReviews] = useState<AdminReviewPayload[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [qInput, setQInput] = useState(qFromUrl);

  useEffect(() => {
    setQInput(qFromUrl);
  }, [qFromUrl]);

  const runFetch = useCallback(
    async (searchQ: string) => {
      setLoading(true);
      setStatusMessage("");
      try {
        const url = new URL("/api/admin/reviews", window.location.origin);
        if (userIdFromUrl) url.searchParams.set("userId", userIdFromUrl);
        const q = searchQ.trim();
        if (q) url.searchParams.set("q", q);
        url.searchParams.set("limit", "200");
        const response = await fetch(url.toString());
        const result = (await response.json()) as {
          ok: boolean;
          reviews?: AdminReviewPayload[];
          error?: string;
        };
        if (result.ok && result.reviews) {
          setReviews(result.reviews);
          if (result.reviews.length === 0) {
            setStatusMessage(
              userIdFromUrl || q
                ? "No reviews match your filters."
                : "No reviews yet.",
            );
          } else {
            setStatusMessage("");
          }
        } else {
          setStatusMessage(result.error ?? "Could not load reviews.");
        }
      } finally {
        setLoading(false);
      }
    },
    [userIdFromUrl],
  );

  useEffect(() => {
    void runFetch(qFromUrl);
  }, [userIdFromUrl, qFromUrl, runFetch]);

  async function updateStatus(id: string, action: "APPROVED" | "REJECTED") {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
      };
      if (!result.ok) {
        setStatusMessage(result.error ?? "Update failed.");
        return;
      }
      setReviews((current) =>
        current.map((review) =>
          review.id === id ? { ...review, moderationStatus: action } : review,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteReview(id: string) {
    if (
      !window.confirm(
        "Delete this review permanently? This cannot be undone and frees a review slot for that user.",
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
      };
      if (!result.ok) {
        setStatusMessage(result.error ?? "Delete failed.");
        return;
      }
      setReviews((current) => current.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runFetch(qInput);
  }

  return (
    <AppPageShell gapClass="gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Admin"
          title="Reviews"
          description={
            <p className="mt-1 max-w-xl text-sm text-zinc-600">
              Search across addresses, emails, names, and review text. Approve,
              reject, delete, or correct monthly rent (whole-dollar{" "}
              <span className="font-medium text-zinc-700">total for the unit</span>
              ). Use the Users page to jump here filtered by account.
            </p>
          }
        />
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/dashboard" className={linkMutedClass}>
            Dashboard
          </Link>
          <Link href="/admin/retention" className={linkMutedClass}>
            Retention emails
          </Link>
          <Link href="/admin/users" className={`${linkMutedClass} font-semibold`}>
            Users →
          </Link>
        </div>
      </div>

      <div
        className={`${surfaceSubtleClass} flex flex-col gap-4 p-4 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:flex-row sm:flex-wrap sm:items-end`}
      >
        <form className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end" onSubmit={onSearchSubmit}>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Search reviews
            </label>
            <input
              className={formInputCompactClass}
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Address, email, name, or text…"
              aria-label="Search reviews"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-muted-blue px-5 text-sm font-semibold text-white hover:bg-muted-blue-hover sm:min-h-10"
          >
            Search
          </button>
        </form>
        {userIdFromUrl ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span>Filtered by user ID.</span>
            <Link
              href="/admin/reviews"
              className="font-semibold text-muted-blue hover:underline"
            >
              Clear user filter
            </Link>
          </div>
        ) : null}
      </div>

      {statusMessage ? (
        <p className="text-sm text-zinc-600">{statusMessage}</p>
      ) : null}

      {loading ? (
        <p className="text-zinc-600">Loading…</p>
      ) : reviews.length === 0 && !statusMessage ? (
        <p className="text-zinc-600">No reviews yet.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className={`${surfaceSubtleClass} p-4 text-sm text-zinc-800 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-5`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link
                    href={`/properties/${review.propertyId}`}
                    className="font-medium text-muted-blue-hover underline-offset-2 hover:underline"
                  >
                    {review.property.addressLine1},{" "}
                    <span className="text-xs text-zinc-500">
                      {review.property.city}, {review.property.state}
                    </span>
                  </Link>
                  <p className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">
                      {review.user.displayName ?? review.user.email ?? "Renter"}
                    </span>
                    {review.user.email ? (
                      <span className="text-zinc-500"> · {review.user.email}</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    Review ID {review.id}
                  </p>
                </div>
                <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium uppercase text-zinc-500 ring-1 ring-zinc-200/80">
                  {review.moderationStatus}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Year {review.reviewYear}
                {typeof review.bedroomCount === "number"
                  ? ` · ${bedroomCountToBand(review.bedroomCount)}`
                  : " · bedrooms unknown"}
                {typeof review.monthlyRent === "number"
                  ? ` · currently $${review.monthlyRent.toLocaleString()} / month on site`
                  : " · rent not provided"}
              </p>
              <AdminMonthlyRentField
                reviewId={review.id}
                monthlyRent={review.monthlyRent}
                disabled={updatingId === review.id || deletingId === review.id}
                onSaved={(monthlyRent) => {
                  setReviews((current) =>
                    current.map((r) =>
                      r.id === review.id ? { ...r, monthlyRent } : r,
                    ),
                  );
                  setStatusMessage("Rent updated.");
                }}
                onError={(message) => setStatusMessage(message)}
              />
              {review.body ? (
                <p className="mt-2 leading-6">{review.body}</p>
              ) : (
                <p className="mt-2 text-zinc-500">No written review.</p>
              )}
              {review.moderationReasons.length > 0 ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Reasons: {review.moderationReasons.join("; ")}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Link
                  href={`/admin/reviews?userId=${encodeURIComponent(review.userId)}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-zinc-200 bg-white px-3 py-2 font-medium text-muted-blue-hover hover:bg-muted-blue-tint/40 sm:min-h-0"
                >
                  This user&apos;s reviews
                </Link>
                <button
                  type="button"
                  onClick={() => void updateStatus(review.id, "APPROVED")}
                  className="inline-flex min-h-10 items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white active:bg-emerald-700 hover:bg-emerald-500 disabled:opacity-60 sm:min-h-0 sm:text-xs"
                  disabled={updatingId === review.id}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(review.id, "REJECTED")}
                  className="inline-flex min-h-10 items-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white active:bg-red-700 hover:bg-red-500 disabled:opacity-60 sm:min-h-0 sm:text-xs"
                  disabled={updatingId === review.id}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => void deleteReview(review.id)}
                  className="inline-flex min-h-10 items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-60 sm:min-h-0 sm:text-xs"
                  disabled={deletingId === review.id || updatingId === review.id}
                >
                  {deletingId === review.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppPageShell>
  );
}

function ReviewsFallback() {
  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader eyebrow="Admin" title="Reviews" />
      <p className="text-zinc-600">Loading…</p>
    </AppPageShell>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<ReviewsFallback />}>
      <AdminReviewsInner />
    </Suspense>
  );
}
