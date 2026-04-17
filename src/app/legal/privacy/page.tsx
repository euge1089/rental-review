import Link from "next/link";

export const dynamic = "force-dynamic";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { PrivacyPolicyContent } from "@/app/_components/privacy-policy-content";
import { linkInlineClass } from "@/lib/ui-classes";

export default function PrivacyPage() {
  const support =
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <AppPageShell width="medium" gapClass="gap-6">
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description={
          support ? (
            <p className="text-sm text-zinc-600">
              Questions about this policy or requests regarding your personal
              information can be sent to{" "}
              <a className={linkInlineClass} href={`mailto:${support}`}>
                {support}
              </a>
              .
            </p>
          ) : null
        }
      />

      <SurfacePanel variant="subtle">
        <div className="max-w-none">
          <PrivacyPolicyContent support={support} />
          <p className="text-sm text-zinc-600 pt-1">
            See also{" "}
            <Link href="/legal/terms" className={linkInlineClass}>
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </SurfacePanel>

      <p className="text-sm text-zinc-500">
        <Link href="/" className={linkInlineClass}>
          ← Home
        </Link>
      </p>
    </AppPageShell>
  );
}
