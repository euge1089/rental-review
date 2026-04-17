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
          support ? (
            <p className="text-sm text-zinc-600">
              Legal notices and support inquiries can be sent to{" "}
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
              1) Acceptance of these Terms
            </h2>
            <p>
              These Terms of Service (“Terms”) govern your access to and use of Rent
              Review Boston’s website and related services (collectively, the
              “Service”). By accessing or using the Service, you agree to be bound by
              these Terms and our{" "}
              <Link href="/legal/privacy" className={linkInlineClass}>
                Privacy Policy
              </Link>
              . If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              2) Service description
            </h2>
            <p>
              The Service allows renters to share and view address-level rental
              experiences and related data in the Boston area. Content is largely
              user-generated. The Service is for informational purposes only and does
              not provide legal, financial, housing, or professional advice.
            </p>
            <p>
              We may update, suspend, or discontinue any feature at any time, with or
              without notice, as permitted by law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              3) Eligibility and account registration
            </h2>
            <p>
              You must be at least 18 years old and legally capable of entering a
              binding agreement to use the Service. You agree to provide accurate,
              current account information and to keep your credentials secure. You are
              responsible for activity under your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              4) User content and license
            </h2>
            <p>
              “User Content” includes reviews, scores, messages, reports, and other
              material you submit. You retain ownership of your User Content. By
              submitting User Content, you grant us a worldwide, non-exclusive,
              royalty-free, transferable, sublicensable license to host, store,
              reproduce, modify (for formatting, moderation, and safety), publish,
              display, and distribute that content to operate and improve the Service.
            </p>
            <p>
              You represent and warrant that you have all rights necessary to submit
              User Content and that your submissions do not violate law, these Terms,
              or any third-party rights.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              5) Acceptable use rules
            </h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Post false, defamatory, fraudulent, or misleading content;</li>
              <li>Post personal data about others without authorization;</li>
              <li>Harass, threaten, stalk, or abuse any person;</li>
              <li>
                Use the Service in a discriminatory manner or in violation of fair
                housing or civil rights laws;
              </li>
              <li>
                Circumvent security, scrape data at scale, or interfere with the
                Service’s operation;
              </li>
              <li>Impersonate others or misrepresent your affiliation; or</li>
              <li>Use bots or automation except as expressly authorized by us.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              6) Moderation and enforcement
            </h2>
            <p>
              We may monitor, moderate, remove, restrict, or refuse User Content and
              may suspend or terminate accounts for suspected violations of these Terms,
              legal obligations, or platform safety requirements. We may also preserve
              and disclose relevant information where required by law or to protect
              rights, users, and the Service.
            </p>
            <p>
              We may apply escalating enforcement for repeat violations, including
              warning, reduced visibility, temporary restrictions, content removal,
              suspension, or termination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              7) Promotions and giveaway terms
            </h2>
            <p>
              From time to time, we may offer promotions, sweepstakes, giveaways,
              or similar programs (“Promotions”). Promotions are governed by these
              Terms and by the official rules for each promotion.
            </p>
            <p>
              Current promotion rules are available at{" "}
              <Link href="/legal/giveaway-rules" className={linkInlineClass}>
                Official Giveaway Rules
              </Link>
              . If these Terms conflict with promotion-specific rules, the
              promotion rules control for that promotion.
            </p>
            <p>
              Promotions may be void where prohibited or restricted by law, and
              eligibility may vary by jurisdiction.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              8) Public content, ratings, and anonymity
            </h2>
            <p>
              Review content, scores, and related property information may be displayed
              publicly or to authenticated users depending on product settings. Public
              presentation is designed to avoid exposing account email addresses.
              Verification badges, score labels, and map displays reflect product logic
              and may change over time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              9) Messaging, voting, and community features
            </h2>
            <p>
              If enabled, messaging, voting, reporting, and blocking tools are provided
              as community features. You must use them lawfully and respectfully. We do
              not guarantee delivery, visibility, or permanence of any communication.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              10) Content complaints and takedowns
            </h2>
            <p>
              If you believe content on the Service is unlawful, defamatory,
              rights-infringing, privacy-violating, or otherwise prohibited, you
              may submit a complaint under our{" "}
              <Link href="/legal/content-complaints" className={linkInlineClass}>
                Content Complaints and Takedowns
              </Link>{" "}
              policy.
            </p>
            <p>
              We may remove, limit, or preserve content while investigating and
              may request additional details. Repeated abusive or bad-faith
              complaints may result in restrictions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              11) Third-party services and links
            </h2>
            <p>
              The Service may rely on or link to third-party services (for example,
              authentication providers, mapping/geocoding services, messaging vendors,
              and analytics tools). Your use of third-party services may be subject to
              their terms and privacy policies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              12) Intellectual property
            </h2>
            <p>
              Except for User Content, the Service and its software, branding, design,
              and content are owned by us or our licensors and are protected by
              intellectual property laws. You may not copy, distribute, modify, reverse
              engineer, or create derivative works from the Service except as permitted
              by law or our written permission.
            </p>
            <p>
              Copyright-specific notices and counter-notices are handled under our{" "}
              <Link href="/legal/copyright" className={linkInlineClass}>
                Copyright and DMCA Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              13) Privacy
            </h2>
            <p>
              Our collection and use of personal information is described in the{" "}
              <Link href="/legal/privacy" className={linkInlineClass}>
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              14) Disclaimers
            </h2>
            <p>
              THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF
              ANY KIND, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
              NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY LAW. WE DO NOT
              GUARANTEE THE ACCURACY, COMPLETENESS, OR RELIABILITY OF USER-GENERATED
              CONTENT OR THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              15) Limitation of liability
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
              16) Indemnification
            </h2>
            <p>
              To the fullest extent permitted by law, you agree to defend, indemnify,
              and hold harmless Rent Review Boston and its operators, affiliates,
              officers, and employees from any claims, damages, losses, or expenses
              (including reasonable attorneys’ fees) arising from your content, your
              use of the Service, or your violation of these Terms or applicable law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              17) Disputes, governing law, and venue
            </h2>
            <p>
              We may suspend or terminate access to the Service at our discretion for
              violations of these Terms, legal requirements, or safety concerns.
              These Terms are governed by the laws of the Commonwealth of
              Massachusetts, excluding conflict-of-law principles.
            </p>
            <p>
              Unless otherwise required by law, you agree that claims arising from
              these Terms or the Service will be brought in state or federal courts
              located in Massachusetts, and you consent to personal jurisdiction in
              those courts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              18) Additional contract terms
            </h2>
            <p>
              If any part of these Terms is found unenforceable, the remaining
              provisions remain in effect (severability). Our failure to enforce
              any provision is not a waiver. We may assign these Terms in
              connection with a merger, acquisition, or sale of assets.
            </p>
            <p>
              These Terms, together with the Privacy Policy and referenced legal
              policies, form the entire agreement between you and us regarding the
              Service. Provisions that should survive termination will survive,
              including ownership, disclaimers, liability limitations,
              indemnification, and dispute terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              19) Legal requests, updates, and contact
            </h2>
            <p>
              Guidance for legal process requests is available at{" "}
              <Link
                href="/legal/law-enforcement-requests"
                className={linkInlineClass}
              >
                Law Enforcement and Legal Requests
              </Link>
              .
            </p>
            <p>
              We may revise these Terms from time to time by posting updated
              versions on this page. Continued use after an effective date
              constitutes acceptance of revised Terms, to the extent permitted by
              law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Contact and effective date
            </h2>
            {support ? (
              <p>
                Questions about these Terms may be sent to{" "}
                <a className={linkInlineClass} href={`mailto:${support}`}>
                  {support}
                </a>
                .
              </p>
            ) : (
              <p>
                Questions about these Terms may be directed through the support contact
                listed on the site.
              </p>
            )}
            <p className="text-xs text-zinc-500">Effective date: April 17, 2026</p>
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
