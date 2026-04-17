import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { linkInlineClass } from "@/lib/ui-classes";

export const dynamic = "force-dynamic";

export default function ContentComplaintsPage() {
  const support =
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <AppPageShell width="medium" gapClass="gap-6">
      <PageHeader
        eyebrow="Legal"
        title="Content Complaints and Takedowns"
        description={
          support ? (
            <p className="text-sm text-zinc-600">
              To report unlawful or rights-violating content, contact{" "}
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
              1) Scope
            </h2>
            <p>
              This process applies to complaints about content on Rent Review
              Boston, including claims involving defamation, privacy violations,
              harassment, abuse, and intellectual property concerns.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              2) What to include
            </h2>
            <p>Your complaint should include:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>The exact URL or content identifier.</li>
              <li>The legal or policy basis for your complaint.</li>
              <li>Why the content is inaccurate, unlawful, or rights-violating.</li>
              <li>Any supporting evidence (documents, screenshots, references).</li>
              <li>Your name and contact information for follow-up.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              3) Good-faith declaration
            </h2>
            <p>
              By submitting a complaint, you represent that the information
              provided is accurate to the best of your knowledge and submitted in
              good faith.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              4) Review process and timing
            </h2>
            <p>
              We review complaints in the order received and may request
              additional information. During review, we may temporarily limit
              visibility, maintain content as-is, or remove content where
              warranted by policy or law.
            </p>
            <p>
              Response timing varies by complexity. Emergency safety reports may
              be prioritized.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              5) Counter-notice path
            </h2>
            <p>
              If your content was removed or restricted due to a complaint, you
              may submit a counter-notice via the same support channel. Include
              the original content reference, your response to the claim, and any
              supporting information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              6) Abuse prevention
            </h2>
            <p>
              Repeated abusive, fraudulent, or bad-faith complaints may result in
              restrictions on complaint submissions and/or account enforcement
              actions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              7) In-product reporting
            </h2>
            <p>
              Users can also report review content in-product through the
              “Report this review” action. Reports are routed for moderation
              review and may trigger further investigation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              8) Contact and effective date
            </h2>
            {support ? (
              <p>
                Submit complaints to{" "}
                <a className={linkInlineClass} href={`mailto:${support}`}>
                  {support}
                </a>
                .
              </p>
            ) : (
              <p>Submit complaints through the support contact listed on site.</p>
            )}
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
