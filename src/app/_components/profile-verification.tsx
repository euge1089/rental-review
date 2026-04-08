"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_POLICY } from "@/lib/policy";

type Props = {
  initialVerified: boolean;
};

export function ProfileVerification({ initialVerified }: Props) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [isBusy, setIsBusy] = useState(false);

  async function startSms() {
    if (!phoneNumber || isBusy) return;
    setIsBusy(true);
    setStatusMessage("");
    try {
      const response = await fetch("/api/sms/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      setStatusMessage(result.ok ? "SMS code sent." : result.error ?? "SMS start failed.");
    } catch {
      setStatusMessage("SMS start failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function checkSms() {
    if (!phoneNumber || !smsCode || isBusy) return;
    setIsBusy(true);
    setStatusMessage("");
    try {
      const response = await fetch("/api/sms/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code: smsCode }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        status?: string;
      };
      if (!result.ok) {
        setStatusMessage(result.error ?? "SMS check failed.");
        return;
      }
      if (result.status === "approved") {
        setIsVerified(true);
        setStatusMessage(
          "Phone verified. New reviews can go live immediately when they pass automated checks.",
        );
        router.refresh();
      } else {
        setStatusMessage(`SMS status: ${result.status ?? "unknown"}`);
      }
    } catch {
      setStatusMessage("SMS check failed.");
    } finally {
      setIsBusy(false);
    }
  }

  if (isVerified) {
    return (
      <p className="text-sm leading-relaxed text-emerald-900/85">
        Your profile is verified via SMS. Your reviews show a verified badge, and new
        submissions are typically approved right away if they don&apos;t need manual
        review.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm text-zinc-700">
      <p>
        Verify with SMS for a <span className="font-medium">verified renter</span>{" "}
        badge and <span className="font-medium">faster approval</span> on new reviews.
        If you skip it, we may take up to{" "}
        <span className="font-medium">
          {PRODUCT_POLICY.verification.unverifiedReviewSlaBusinessDays} business days
        </span>{" "}
        to manually review submissions that aren&apos;t auto-approved.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="+16175551234"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={startSms}
          disabled={isBusy}
          className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-70"
        >
          Send code
        </button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={smsCode}
          onChange={(event) => setSmsCode(event.target.value)}
          placeholder="123456"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={checkSms}
          disabled={isBusy}
          className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-70"
        >
          Verify code
        </button>
      </div>
      {statusMessage ? (
        <p className="text-xs text-zinc-600">{statusMessage}</p>
      ) : null}
    </div>
  );
}
