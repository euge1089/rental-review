import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { EmailAuthPanel } from "@/app/_components/email-auth-panel";
import { linkMutedClass } from "@/lib/ui-classes";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string | string[] }>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function signInErrorGuidance(code: string): { title: string; body: string } {
  switch (code) {
    case "OAuthCallback":
      return {
        title: "Google sign-in didn’t finish",
        body: "NextAuth reported an error exchanging the Google login for a session. On production this is usually configuration: set NEXTAUTH_URL to your public https site URL (no trailing slash), set NEXTAUTH_SECRET, and in Google Cloud Console add the redirect URI https://YOUR_DOMAIN/api/auth/callback/google for the same OAuth client as GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.",
      };
    case "OAuthSignin":
      return {
        title: "Couldn’t start Google sign-in",
        body: "Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server, and that the Google provider is enabled for that OAuth client.",
      };
    case "OAuthAccountNotLinked":
      return {
        title: "Use your original sign-in method",
        body: "This email is already tied to another provider. Sign in the way you used when you first created the account, or contact support if you need to link accounts.",
      };
    case "Callback":
      return {
        title: "Sign-in failed after Google",
        body: "Google returned successfully but the app couldn’t finish creating your session. If you run the site, check server logs for database or callback errors.",
      };
    case "Configuration":
    case "configuration":
      return {
        title: "Auth misconfiguration",
        body: "The server’s auth settings are invalid (for example missing NEXTAUTH_SECRET or NEXTAUTH_URL). Check environment variables and redeploy.",
      };
    default:
      return {
        title: "Sign-in didn’t work",
        body: "Try again, or use email sign-in below. If it keeps failing on the live site, verify NEXTAUTH_URL, NEXTAUTH_SECRET, and Google OAuth redirect URIs match your production domain.",
      };
  }
}

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const { callbackUrl } = params;
  const errorCode = firstParam(params.error);
  const safe =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";
  const encoded = encodeURIComponent(safe);

  const errorGuide = errorCode ? signInErrorGuidance(errorCode) : null;

  return (
    <AppPageShell width="narrow" gapClass="gap-6 lg:gap-10">
      <PageHeader
        title="Sign in"
        description={
          <>
            Sign in with Google, or create an account with email. We&apos;ll send a
            short code to verify your address before you can sign in with a password.
          </>
        }
      />
      {errorGuide ? (
        <div
          className="rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:px-5 sm:py-4"
          role="alert"
        >
          <p className="font-semibold text-amber-950">{errorGuide.title}</p>
          <p className="mt-2 leading-relaxed text-amber-950/90">
            {errorGuide.body}
          </p>
          <p className="mt-2 text-xs text-amber-900/80">
            (NextAuth error code:{" "}
            <span className="font-mono tabular-nums">{errorCode}</span>)
          </p>
        </div>
      ) : null}
      <SurfacePanel className="my-[20px]">
        <EmailAuthPanel
          callbackUrl={safe}
          googleHref={`/api/auth/signin/google?callbackUrl=${encoded}`}
        />
      </SurfacePanel>
      <p className="text-center text-xs text-zinc-500">
        Continued use of the site is subject to the draft{" "}
        <Link href="/legal/terms" className="font-medium text-muted-blue hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="font-medium text-muted-blue hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <Link href="/" className={linkMutedClass}>
        Back to home
      </Link>
    </AppPageShell>
  );
}
