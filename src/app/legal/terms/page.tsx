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
        title="Terms of Service"
        description={
          <div className="space-y-2">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <strong>Not legal advice.</strong> These terms summarize how Rent Review
              Boston is intended to operate. A licensed attorney should review and
              tailor them—especially for liability limits, dispute resolution, fair
              housing, defamation, and compliance with Massachusetts and federal law—
              before you rely on them.
            </p>
            {support ? (
              <p className="text-sm text-zinc-600">
                Notices and support:{" "}
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
              Agreement
            </h2>
            <p>
              These Terms of Service (“Terms”) govern your access to and use of the
              website and services branded <strong>Rent Review Boston</strong> (the
              “Service”). By creating an account or using the Service, you agree to
              these Terms and our{" "}
              <Link href="/legal/privacy" className={linkInlineClass}>
                Privacy Policy
              </Link>
              . If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              What the Service is
            </h2>
            <p>
              Rent Review Boston provides tools for renters to share opinions and
              factual information about past tenancies tied to{" "}
              <strong>specific addresses in the City of Boston, Massachusetts</strong>.
              Listings, landlords, property managers, and other third parties are not
              parties to these Terms unless you have a separate agreement with them.
            </p>
            <p>
              Content on the Service is user-generated. Reviews are personal
              experiences and opinions, not professional inspections, legal advice, or
              guaranteed facts. Rent figures, amenities, and scores depend on what
              users submit and may be incomplete or outdated.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Eligibility and accounts
            </h2>
            <p>
              You must be able to form a binding contract where you live. The Service is
              intended for users who are at least <strong>18 years old</strong>. You
              are responsible for your account credentials and for all activity under
              your account. Keep your password confidential. You may sign in with
              Google or, where offered, email and password with email verification.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Reviews, limits, and moderation
            </h2>
            <p>
              You may submit reviews only for Boston addresses and lease-start years
              permitted by the Service rules (including limits on how many reviews an
              account may submit overall and one review per address per lease-start
              year). You must provide accurate attestations where the product asks you
              to confirm that a review reflects your experience for the selected lease
              period.
            </p>
            <p>
              We moderate content to promote a useful and lawful community. Reviews
              may be approved, held for manual review, or rejected. Automated checks may
              flag content (for example, text that appears to include individual
              names). Optional SMS verification on your profile can help automated
              approval when other checks pass; otherwise manual review may apply, with
              target timeframes described in the product. We may update moderation
              practices as the Service evolves.
            </p>
            <p>
              You are responsible for your submissions. You must not post content that
              is illegal, fraudulent, or violates others’ rights. You must comply with{" "}
              <strong>fair housing</strong> laws: do not use the Service to harass,
              discriminate against, or steer people based on protected characteristics,
              or to publish content that could reasonably be understood as doing so.
              You must not post another person’s private contact information without
              permission, threaten or abuse others, or submit knowingly false
              statements of fact that harm others. Counsel should align this section
              with your enforcement playbook and appeals process.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Public display and anonymity
            </h2>
            <p>
              The Service is designed so that your <strong>account email is not</strong>{" "}
              shown on public review cards. You may have options for how your review
              appears (for example, a fully anonymous label). A successful SMS
              verification may display a verification indicator next to your public
              reviews. Your profile display name is for your account experience; align
              marketing copy and these Terms with what the UI actually shows.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Private messages, blocking, and voting
            </h2>
            <p>
              The Service may allow short private messages between signed-in renters in
              connection with published reviews. You must not use messages—or any part
              of the Service—to harass, threaten, intimidate, or coerce anyone. Do not
              share another person’s private contact information without permission.
            </p>
            <p>
              Users may block other accounts; blocking may limit messaging and certain
              interactions. Users may mark reviews as “helpful.” Automated filters may
              apply to messages; they are not a guarantee of safety. For emergencies,
              contact local authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Maps, search, and location
            </h2>
            <p>
              The Service may show properties on a map and use geocoded coordinates for
              exploration and analytics. Map presentation may use approximate locations
              (for example, block-level positioning) rather than precise doorsteps. Your
              counsel can refine this section if you add features that change location
              precision.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Email and SMS
            </h2>
            <p>
              We send transactional emails (such as authentication). We may send
              optional retention or reminder emails and optional daily activity
              summaries as described in the product; you can control certain
              non-transactional emails in your profile where available. SMS is used for
              optional phone verification through a third-party provider; message and
              data rates may apply.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Reporting, enforcement, and intellectual property
            </h2>
            <p>
              We provide ways to report content that may violate these Terms or our
              policies. We may remove or restrict content, suspend or terminate
              accounts, and take other steps we reasonably believe are necessary.
              Repeat infringement of intellectual property rights may result in
              termination. If you allow user photos or uploads beyond text, a DMCA
              agent designation and takedown process should be added here with the
              correct name, address, and email for legal notices.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Privacy
            </h2>
            <p>
              Our collection and use of personal information are described in the{" "}
              <Link href="/legal/privacy" className={linkInlineClass}>
                Privacy Policy
              </Link>
              , including subprocessors used for hosting, email, SMS, maps, analytics,
              and authentication.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Disclaimers
            </h2>
            <p>
              THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF
              ANY KIND, EXPRESS OR IMPLIED, TO THE FULLEST EXTENT PERMITTED BY LAW—
              INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
            </p>
            <p>
              Your lawyer should confirm whether and how caps, exclusions, and
              disclaimers apply in Massachusetts and elsewhere.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Limitation of liability
            </h2>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY LAW, RENT REVIEW BOSTON AND ITS
              OPERATORS, AFFILIATES, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
              PROFITS, DATA, OR GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF THE
              SERVICE. TO THE FULLEST EXTENT PERMITTED BY LAW, OUR AGGREGATE LIABILITY
              FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE SERVICE WILL NOT EXCEED
              THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE
              MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS (IF YOU HAVE NOT
              PAID ANY FEES). SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS; IN
              THOSE CASES, OUR LIABILITY IS LIMITED TO THE MAXIMUM EXTENT PERMITTED BY
              LAW.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Indemnity
            </h2>
            <p>
              To the fullest extent permitted by law, you agree to defend, indemnify,
              and hold harmless Rent Review Boston and its operators, affiliates,
              officers, and employees from any claims, damages, losses, or expenses
              (including reasonable attorneys’ fees) arising from your content, your
              use of the Service, or your violation of these Terms or applicable law.
              Your counsel should tune this clause for your entity structure and risk
              tolerance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Changes to the Service and Terms
            </h2>
            <p>
              We may modify the Service or these Terms. We will post updated Terms on
              this page. If changes are material, we may provide additional notice as
              required by law. Continued use after changes become effective constitutes
              acceptance unless applicable law requires otherwise.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Governing law and disputes
            </h2>
            <p>
              These Terms are governed by the laws of the Commonwealth of Massachusetts,
              excluding conflict-of-law rules. Venue and dispute resolution (courts vs.
              arbitration), class-action waivers, and consumer protections should be
              chosen with counsel—Massachusetts has specific consumer and tenant-
              protection statutes that may affect enforceability of certain clauses.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              General
            </h2>
            <p>
              These Terms, together with the Privacy Policy, are the entire agreement
              between you and us regarding the Service. If a provision is unenforceable,
              the remaining provisions remain in effect. Failure to enforce a provision
              is not a waiver. You may not assign these Terms without our consent; we
              may assign them in connection with a merger, acquisition, or sale of
              assets.
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
