"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { linkMutedClass, surfaceSubtleClass } from "@/lib/ui-classes";
type ReviewWithRelations = {
  id: string;
  reviewYear: number;
  monthlyRent: number | null;
  body: string | null;
  moderationStatus: "APPROVED" | "PENDING_REVIEW" | "REJECTED";
  moderationReasons: string[];
  property: {
    addressLine1: string;
    city: string;
    state: string;
  };
  user: {
    email: string | null;
    displayName: string | null;
  };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/reviews");
        const result = (await response.json()) as {
          ok: boolean;
          reviews?: ReviewWithRelations[];
          error?: string;
        };
        if (result.ok && result.reviews) {
          setReviews(result.reviews);
        } else {
          setStatusMessage(result.error ?? "Could not load reviews.");
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

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

  return (
    <AppPageShell gapClass="gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="Admin" title="Review queue" />
        <Link href="/" className={`${linkMutedClass} shrink-0 text-sm`}>
          Back to home
        </Link>
      </div>

      {statusMessage ? (
        <p className="text-sm text-zinc-600">{statusMessage}</p>
      ) : null}

      {loading ? (
        <p className="text-zinc-600">Loading…</p>
      ) : reviews.length === 0 ? (
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
                  <p className="font-medium">
                    {review.property.addressLine1},{" "}
                    <span className="text-xs text-zinc-500">
                      {review.property.city}, {review.property.state}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {review.user.displayName ?? review.user.email ?? "Renter"}
                  </p>
                </div>
                <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium uppercase text-zinc-500 ring-1 ring-zinc-200/80">
                  {review.moderationStatus}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Year {review.reviewYear} ·{" "}
                {typeof review.monthlyRent === "number"
                  ? `$${review.monthlyRent.toLocaleString()} / month`
                  : "Rent not provided"}
              </p>
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
                <button
                  type="button"
                  onClick={() => void updateStatus(review.id, "APPROVED")}
                  className="inline-flex min-h-10 items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white active:bg-emerald-700 hover:bg-emerald-500 disabled:opacity-60 sm:min-h-0 sm:px-3 sm:py-1 sm:text-xs"
                  disabled={updatingId === review.id}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(review.id, "REJECTED")}
                  className="inline-flex min-h-10 items-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white active:bg-red-700 hover:bg-red-500 disabled:opacity-60 sm:min-h-0 sm:px-3 sm:py-1 sm:text-xs"
                  disabled={updatingId === review.id}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppPageShell>
  );
}

