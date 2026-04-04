"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPropertyDeleteButton({
  propertyId,
  addressLine,
}: {
  propertyId: string;
  addressLine: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (
      !window.confirm(
        `Delete this property record?\n\n${addressLine}\n\nBookmarks for this address will be removed. This cannot be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Could not delete.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => void onDelete()}
        className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <p className="max-w-[14rem] text-right text-[10px] text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
