import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { EmailAuthPanel } from "@/app/_components/email-auth-panel";
import { linkMutedClass } from "@/lib/ui-classes";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const safe =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";
  const encoded = encodeURIComponent(safe);

  return (
    <AppPageShell width="narrow" gapClass="gap-6">
      <PageHeader
        title="Sign in"
        description={
          <>
            Sign in with Google, or create an account with email. We&apos;ll send a
            short code to verify your address before you can sign in with a password.
          </>
        }
      />
      <SurfacePanel>
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
