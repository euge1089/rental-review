import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { linkInlineClass } from "@/lib/ui-classes";

export const dynamic = "force-dynamic";

export default function CopyrightPolicyPage() {
  const support =
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <AppPageShell width="medium" gapClass="gap-6">
      <PageHeader
        eyebrow="Legal"
        title="Copyright and DMCA Policy"
        description={
          support ? (
            <p className="text-sm text-zinc-600">
              Copyright notices may be sent to{" "}
              <a className={linkInlineClass} href={`mailto:${support}`}>
                {support}
              </a>
              .
            </p>
          ) : null
        }
      />

      <SurfacePanel variant="subtle">
        <div className="max-w-none space-y-6 text-sm leading-relaxed text-zinc-700">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              1) Designated contact
            </h2>
            {support ? (
              <p>
                Send copyright notices and counter-notices to{" "}
                <a className={linkInlineClass} href={`mailto:${support}`}>
                  {support}
                </a>
                .
              </p>
            ) : (
              <p>Use the support contact listed on the site for notices.</p>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              2) Notice requirements
            </h2>
            <p>A valid notice should include:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Identification of the copyrighted work claimed infringed.</li>
              <li>Identification of the allegedly infringing material and location.</li>
              <li>Contact details for the complaining party.</li>
              <li>Good-faith statement regarding unauthorized use.</li>
              <li>Accuracy and authority statement under penalty of perjury.</li>
              <li>Physical or electronic signature of the rights holder/agent.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              3) Counter-notice requirements
            </h2>
            <p>A valid counter-notice should include:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Identification of removed/disabled content and former location.</li>
              <li>Statement under penalty of perjury of good-faith mistake claim.</li>
              <li>Name, address, telephone number, and consent to jurisdiction.</li>
              <li>Physical or electronic signature.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              4) Repeat infringer policy
            </h2>
            <p>
              We may terminate accounts and remove content for repeat or
              egregious intellectual property violations, consistent with
              applicable law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              5) Effective date
            </h2>
            <p className="text-xs text-zinc-500">Effective date: April 17, 2026</p>
          </section>
        </div>
      </SurfacePanel>

      <p className="text-sm text-zinc-500">
        <Link href="/legal/terms" className={linkInlineClass}>
          ← Back to Terms of Service
        </Link>
      </p>
    </AppPageShell>
  );
}
