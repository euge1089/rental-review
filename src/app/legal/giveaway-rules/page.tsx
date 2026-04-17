import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { linkInlineClass } from "@/lib/ui-classes";

export const dynamic = "force-dynamic";

export default function GiveawayRulesPage() {
  const support =
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const sponsorName =
    process.env.NEXT_PUBLIC_GIVEAWAY_SPONSOR_NAME?.trim() || "Rent Review Boston";
  const sponsorAddress =
    process.env.NEXT_PUBLIC_GIVEAWAY_SPONSOR_ADDRESS?.trim() ||
    "Boston, Massachusetts, USA";

  return (
    <AppPageShell width="medium" gapClass="gap-6">
      <PageHeader
        eyebrow="Legal"
        title="Official Giveaway Rules"
        description={
          support ? (
            <p className="text-sm text-zinc-600">
              Questions about this promotion can be sent to{" "}
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
              1) Sponsor
            </h2>
            <p>
              The monthly giveaway is sponsored by {sponsorName} (the
              “Sponsor”), located at {sponsorAddress}.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              2) Promotion period
            </h2>
            <p>
              Unless otherwise posted, each monthly promotion begins at 12:00:00
              AM Eastern Time on the first day of the month and ends at 11:59:59
              PM Eastern Time on the last day of the month.
            </p>
            <p>
              Entries submitted after the posted end time are not eligible for
              that month and do not roll over unless specifically stated.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              3) Eligibility
            </h2>
            <p>
              Entrants must be legal residents of a jurisdiction where the
              promotion is lawful, and at least 18 years old (or age of majority
              where higher) at time of entry.
            </p>
            <p>
              Void where prohibited or restricted by law. Sponsor may require
              winner verification before awarding any prize.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              4) How to enter
            </h2>
            <p>
              Eligible entries are generated through qualifying review
              submissions on Rent Review Boston during the promotion period,
              subject to moderation and platform rules.
            </p>
            <p>
              Maximum entries: up to five (5) approved submissions per person per
              promotion month, unless otherwise posted.
            </p>
            <p>
              Entries associated with fraudulent, automated, duplicate, or
              policy-violating behavior may be disqualified.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              5) Prize and odds
            </h2>
            <p>
              Unless otherwise posted for a specific month, the standard monthly
              prize is eight (8) Boston-area restaurant or dining gift cards,
              each with a face value of twenty-five dollars ($25 USD), for a
              total approximate retail value of two hundred dollars ($200 USD).
            </p>
            <p>
              Each $25 gift card is intended to be awarded to a separate
              potential winner (eight (8) winners per month), as described in
              section 6.
            </p>
            <p>
              Odds of winning depend on the number of eligible entries received
              in the applicable month.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              6) Winner selection and notification
            </h2>
            <p>
              After the promotion period, eight (8) potential winners are
              selected by random draw from eligible entries. Each potential
              winner, if verified and eligible, will be awarded one (1) of the
              $25 gift cards described in section 5. Sponsor may contact potential
              winners by account email and may require response within a stated
              timeframe.
            </p>
            <p>
              If a potential winner cannot be contacted, is ineligible, or fails
              required verification, Sponsor may select an alternate winner.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              7) Taxes and compliance
            </h2>
            <p>
              Winner is responsible for any federal, state, local, or other taxes
              and reporting obligations arising from receipt of a prize.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              8) Publicity and privacy
            </h2>
            <p>
              Sponsor may request winner consent for limited promotional use (for
              example, first name and city), where lawful. Entry data is handled
              under the{" "}
              <Link href="/legal/privacy" className={linkInlineClass}>
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              9) Governing law and platform disclaimer
            </h2>
            <p>
              These promotion rules are governed by the laws of the Commonwealth
              of Massachusetts, without regard to conflicts principles, subject to
              mandatory local consumer law.
            </p>
            <p>
              This promotion is administered by Sponsor and is not sponsored by,
              endorsed by, or administered by third-party platforms unless
              explicitly stated.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              10) Contact and effective date
            </h2>
            {support ? (
              <p>
                Questions about these rules may be sent to{" "}
                <a className={linkInlineClass} href={`mailto:${support}`}>
                  {support}
                </a>
                .
              </p>
            ) : (
              <p>
                Questions about these rules may be directed through the support
                contact listed on the site.
              </p>
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
