"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  type FormEvent,
  useCallback,
  useState,
} from "react";
import { trackEvent } from "@/lib/analytics-client";
import { formInputClass } from "@/lib/ui-classes";

function AuthLegalNote() {
  return (
    <p className="text-center text-xs leading-relaxed text-zinc-500 sm:text-left">
      Draft policies:{" "}
      <Link
        href="/legal/terms"
        className="font-medium text-muted-blue underline-offset-2 hover:underline"
      >
        Terms
      </Link>
      {" · "}
      <Link
        href="/legal/privacy"
        className="font-medium text-muted-blue underline-offset-2 hover:underline"
      >
        Privacy
      </Link>
    </p>
  );
}

type Props = {
  callbackUrl: string;
  /** Hero modal: Google + single “create account” CTA and a sign-in link. */
  signupFocus?: boolean;
  /** Called after successful credentials sign-in (e.g. close a dialog). */
  onSignedIn?: () => void;
};

export function EmailAuthPanel({
  callbackUrl,
  signupFocus = false,
  onSignedIn,
}: Props) {
  const router = useRouter();
  const [flow, setFlow] = useState<"pick" | "signin" | "signup" | "verify">(
    "pick",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const postSignupRedirect =
    callbackUrl && callbackUrl !== "/"
      ? `${callbackUrl}${callbackUrl.includes("?") ? "&" : "?"}new=1`
      : "/submit?new=1";

  const resetError = useCallback(() => setError(null), []);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    resetError();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start sign-up.");
        return;
      }
      setFlow("verify");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.replace(/\D/g, "").slice(0, 6) }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      const signed = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });
      if (signed?.error) {
        setError("Signed in failed after verification. Try signing in below.");
        setFlow("signin");
        return;
      }
      trackEvent("sign_up_completed", { method: "email" });
      onSignedIn?.();
      router.push(postSignupRedirect);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    resetError();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not resend code.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      const signed = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });
      if (signed?.error) {
        setError("Invalid email or password, or email not verified yet.");
        return;
      }
      onSignedIn?.();
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignIn() {
    resetError();
    void signIn("google", { callbackUrl });
  }

  if (flow === "pick") {
    if (signupFocus) {
      return (
        <div className="flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="inline-flex w-full max-w-sm items-center justify-center whitespace-nowrap rounded-full bg-muted-blue px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition hover:bg-muted-blue-hover sm:max-w-none sm:w-auto"
          >
            Continue with Google
          </button>
          <div className="flex w-full items-center gap-4">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              or
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>
          <button
            type="button"
            className="w-full max-w-sm rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 sm:max-w-none sm:w-auto"
            onClick={() => {
              resetError();
              setFlow("signup");
            }}
          >
            Create account with email
          </button>
          <p className="text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-muted-blue hover:underline"
            >
              Sign in
            </Link>
          </p>
          <AuthLegalNote />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="inline-flex min-h-11 w-full max-w-sm shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-muted-blue px-5 py-3 text-sm font-semibold text-white transition active:bg-muted-blue-hover/95 hover:bg-muted-blue-hover sm:max-w-none sm:w-auto"
        >
          Continue with Google
        </button>
        <div className="flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            or
          </span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>
        <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 w-full max-w-sm items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 sm:max-w-none sm:w-auto"
            onClick={() => {
              resetError();
              setFlow("signin");
            }}
          >
            Sign in with email
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 w-full max-w-sm items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted-blue-hover transition active:bg-zinc-50 hover:border-muted-blue/30 hover:bg-muted-blue-tint/40 sm:max-w-none sm:w-auto"
            onClick={() => {
              resetError();
              setFlow("signup");
            }}
          >
            Create account with email
          </button>
        </div>
        <AuthLegalNote />
      </div>
    );
  }

  if (flow === "signup") {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          className="w-fit text-sm font-medium text-muted-blue hover:underline"
          onClick={() => {
            resetError();
            setFlow("pick");
          }}
        >
          ← Back
        </button>
        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Email
            </label>
            <input
              className={formInputClass}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Password (at least 8 characters)
            </label>
            <input
              className={formInputClass}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Confirm password
            </label>
            <input
              className={formInputClass}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(ev) => setConfirmPassword(ev.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-muted-blue px-5 py-3 text-sm font-semibold text-white transition active:bg-muted-blue-hover/95 hover:bg-muted-blue-hover disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Sending…" : "Send verification code"}
          </button>
        </form>
        <AuthLegalNote />
      </div>
    );
  }

  if (flow === "verify") {
    return (
      <div className="flex flex-col gap-5">
        <p className="text-sm text-zinc-600">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
          finish creating your account.
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleVerify}>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Verification code
            </label>
            <input
              className={`${formInputClass} tracking-[0.35em] font-mono text-lg`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="000000"
              value={code}
              onChange={(ev) =>
                setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-muted-blue px-5 py-3 text-sm font-semibold text-white transition active:bg-muted-blue-hover/95 hover:bg-muted-blue-hover disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Verifying…" : "Verify and sign in"}
          </button>
        </form>
        <button
          type="button"
          disabled={loading}
          className="text-sm font-medium text-muted-blue hover:underline disabled:opacity-50"
          onClick={() => void handleResend()}
        >
          Resend code
        </button>
        <AuthLegalNote />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        className="w-fit text-sm font-medium text-muted-blue hover:underline"
        onClick={() => {
          resetError();
          setFlow("pick");
        }}
      >
        ← Back
      </button>
      <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Email
          </label>
          <input
            className={formInputClass}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Password
          </label>
          <input
            className={formInputClass}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-muted-blue px-5 py-3 text-sm font-semibold text-white transition active:bg-muted-blue-hover/95 hover:bg-muted-blue-hover disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <AuthLegalNote />
    </div>
  );
}
