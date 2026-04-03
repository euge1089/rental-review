import Link from "next/link";

export const dynamic = "force-dynamic";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { linkInlineClass } from "@/lib/ui-classes";

export default function PrivacyPage() {
  const support =
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <AppPageShell width="medium" gapClass="gap-6">
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy (draft)"
        description={
          <div className="space-y-2">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <strong>Not legal advice.</strong> Replace this draft with language that
              matches your real collection, use, sharing, retention, and regional
              obligations (including Massachusetts and, if applicable, GDPR/UK GDPR).
            </p>
            {support ? (
              <p className="text-sm text-zinc-600">
                Privacy requests (draft contact):{" "}
                <a className={linkInlineClass} href={`mailto:${support}`}>
                  {support}
                </a>
              </p>
            ) : null}
          </div>
        }
      />

      <SurfacePanel variant="subtle">
        <div className="max-w-none space-y-6 text-sm leading-relaxed text-zinc-700">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Who we are
            </h2>
            <p>
              Describe the operating entity (legal name, address). If you use
              subprocessors (e.g. Vercel, database host, Google OAuth, Twilio Verify,
              email provider), the final policy usually lists categories of vendors
              and links to their privacy terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Information you may collect
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>
                Account data: email, optional display name; password hash for
                email/password accounts.
              </li>
              <li>
                Reviews: free text, rent and unit details, scores, amenities, year of
                lease, moderation flags.
              </li>
              <li>
                Optional phone number and verification status if you use SMS
                verification.
              </li>
              <li>
                Technical data: IP address, cookies or session tokens, logs for
                security and debugging.
              </li>
              <li>Reports and admin actions on content.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              How you use information
            </h2>
            <p>
              Final copy should cover: providing the service, authentication,
              moderation, abuse prevention, legal compliance, communicating with users,
              and product improvement. If you do <em>not</em> sell personal
              information, say so in plain language where required (e.g. some U.S.
              state laws).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Sharing and retention
            </h2>
            <p>
              Explain how long accounts, reviews, and logs are kept; when data is
              deleted or anonymized; and backups. Describe any required disclosures to
              law enforcement.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Security and rights
            </h2>
            <p>
              Summarize reasonable safeguards. List how users can access, correct,
              export, or delete data, and how you verify requests. If you operate only
              in the U.S., say so; if you have EU/UK users, address lawful bases and
              international transfers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Children
            </h2>
            <p>
              State that the service is not directed at children under 13 (or under
              16, per counsel) and that you do not knowingly collect their data—aligned
              with your Terms age rule.
            </p>
          </section>

          <p className="text-sm text-zinc-600">
            See also{" "}
            <Link href="/legal/terms" className={linkInlineClass}>
              Terms of Service (draft)
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
