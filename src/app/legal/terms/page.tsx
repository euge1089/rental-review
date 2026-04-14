import Link from "next/link";

export const dynamic = "force-dynamic";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { linkInlineClass } from "@/lib/ui-classes";

export default function TermsPage() {
  const support =
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <AppPageShell width="medium" gapClass="gap-6">
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service (draft)"
        description={
          <div className="space-y-2">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <strong>Not legal advice.</strong> This draft is for structure and UX
              only. A licensed attorney must review and replace it before you rely on
              it for liability, fair housing, or defamation posture.
            </p>
            {support ? (
              <p className="text-sm text-zinc-600">
                Draft contact for notices and support:{" "}
                <a className={linkInlineClass} href={`mailto:${support}`}>
                  {support}
                </a>
              </p>
            ) : (
              <p className="text-sm text-zinc-600">
                Set <code className="rounded bg-zinc-100 px-1">SUPPORT_EMAIL</code> or{" "}
                <code className="rounded bg-zinc-100 px-1">
                  NEXT_PUBLIC_SUPPORT_EMAIL
                </code>{" "}
                in production to show a public contact here.
              </p>
            )}
          </div>
        }
      />

      <SurfacePanel variant="subtle">
        <div className="max-w-none space-y-6 text-sm leading-relaxed text-zinc-700">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Service and eligibility
            </h2>
            <p>
              Rent Review Boston offers tools for renters to share opinions and factual
              information about past tenancies tied to specific addresses in Boston.
              Listings, landlords, and third parties are not parties to these Terms
              unless you add them elsewhere.
            </p>
            <p>
              <strong>Draft age rule:</strong> the service is intended for users who
              are at least 18 years old. Final Terms should match COPPA/children’s
              privacy choices and any signup enforcement you implement.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              User content, fair housing, and defamation
            </h2>
            <p>
              You are responsible for your reviews. Counsel should define prohibited
              content, including harassment, discrimination or steering (federal and
              state fair housing), privacy violations (e.g. posting someone else’s
              contact info), clearly unlawful material, and bad-faith false
              statements. Describe how moderation works, approximate timelines, and
              appeals.
            </p>
            <p>
              Reviews are user opinions and experiences, not professional inspections
              or legal conclusions. Final Terms often include disclaimers of warranties
              and a liability cap - your lawyer should tailor those.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Reporting, takedowns, and repeat infringement
            </h2>
            <p>
              The product includes reporting flows for reviews. Your final Terms should
              describe how reports are handled, any counter-notification or appeal
              steps, and (if you allow photos or other media) a DMCA/copyright agent
              block with designated agent name, address, and email for takedown
              notices.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Privacy
            </h2>
            <p>
              Data practices are summarized in the draft{" "}
              <Link href="/legal/privacy" className={linkInlineClass}>
                Privacy Policy
              </Link>
              . The final Terms should cross-reference it and any subprocessors
              (hosting, email, SMS, analytics).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Massachusetts and general provisions
            </h2>
            <p>
              Counsel typically chooses governing law, venue or arbitration, class
              action waivers (where enforceable), assignment, and how you may change
              these terms. For a Boston-focused product, Massachusetts law and local
              consumer rules may deserve explicit treatment.
            </p>
          </section>
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
