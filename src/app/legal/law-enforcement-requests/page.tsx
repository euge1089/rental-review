import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { linkInlineClass } from "@/lib/ui-classes";

export const dynamic = "force-dynamic";

export default function LawEnforcementRequestsPage() {
  const support =
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <AppPageShell width="medium" gapClass="gap-6">
      <PageHeader
        eyebrow="Legal"
        title="Law Enforcement and Legal Requests"
        description={
          support ? (
            <p className="text-sm text-zinc-600">
              Legal process requests should be sent to{" "}
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
              1) Submission channel
            </h2>
            <p>
              Formal legal requests (subpoenas, court orders, warrants, and
              similar process) should be submitted through the legal contact
              channel listed on this page.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              2) Required request details
            </h2>
            <p>Please include:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Requesting agency or authority identity.</li>
              <li>Case or investigation reference number.</li>
              <li>Specific account/content identifiers in scope.</li>
              <li>Legal basis and date range for requested data.</li>
              <li>Return instructions and response deadline.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              3) Review and scope minimization
            </h2>
            <p>
              We review requests for legal sufficiency and scope. Where
              appropriate, we may seek clarification or narrow overbroad requests
              before producing records.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              4) Emergency requests
            </h2>
            <p>
              For emergencies involving imminent risk of serious harm, clearly
              mark the request as urgent and include specific emergency facts.
              Emergency requests are evaluated case-by-case under applicable law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              5) User notice
            </h2>
            <p>
              We may notify affected users about legal requests unless prohibited
              by law, court order, or urgent safety concerns.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              6) Effective date
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
