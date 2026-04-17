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
        <div className="max-w-none space-y-6 text-sm leading-relaxed text-zinc-700">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              1) Who we are
            </h2>
            <p>
              This Privacy Policy explains how <strong>Rent Review Boston</strong>{" "}
              (“we,” “us,” or “our”) collects, uses, shares, and retains information
              when you use our website and related services (the “Service”).
            </p>
            <p>
              This policy should be read together with our{" "}
              <Link href="/legal/terms" className={linkInlineClass}>
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              2) Scope and eligibility
            </h2>
            <p>
              The Service is focused on rental experiences in Boston, Massachusetts.
              This policy applies to information collected through the Service,
              including when you browse public content, create an account, submit
              reviews, use messaging, or contact support.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              3) Information we collect
            </h2>
            <p>Depending on how you use the Service, we may collect:</p>
            <ul className="list-inside list-disc space-y-2 pl-1">
              <li>
                <strong>Account information.</strong> Email address, authentication
                data, optional display name, and related account settings.
              </li>
              <li>
                <strong>Verification and trust signals.</strong> If you complete phone
                verification, we store verification status and related anti-abuse
                metadata.
              </li>
              <li>
                <strong>Review content and property data.</strong> Information you
                submit in reviews, including property/address details, rent and unit
                details, ratings, amenity details, free-text comments, timestamps, and
                moderation status.
              </li>
              <li>
                <strong>Derived location data.</strong> Geocoded coordinates derived
                from address data for maps, analytics, and search functionality.
              </li>
              <li>
                <strong>Community interactions.</strong> Votes, bookmarks, reports,
                blocks, and private messages between users where messaging is enabled.
              </li>
              <li>
                <strong>Communications preferences.</strong> Email preference settings
                and records about service emails (for example, delivery and campaign
                activity).
              </li>
              <li>
                <strong>Technical and usage data.</strong> Device/browser data, IP
                address, server logs, and events used for security, diagnostics, fraud
                prevention, and analytics.
              </li>
              <li>
                <strong>Information from third parties.</strong> If you sign in through
                a third-party identity provider (such as Google), we receive profile
                fields those providers share with us (for example, email address).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              4) How we use information
            </h2>
            <p>We use information we collect to:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Provide, operate, maintain, and improve the Service;</li>
              <li>Create and manage user accounts and authentication sessions;</li>
              <li>Publish and organize review content and property information;</li>
              <li>
                Moderate and enforce our community rules (including abuse and safety
                review);
              </li>
              <li>Enable messaging, voting, reporting, and other community features;</li>
              <li>Send service communications and optional product emails;</li>
              <li>Maintain platform security and detect fraud or misuse;</li>
              <li>Comply with legal obligations and resolve disputes; and</li>
              <li>Analyze usage trends and product performance.</li>
            </ul>
            <p>
              We do not sell personal information for money. We also do not use your
              personal information for third-party advertising unrelated to the
              operation of the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              5) Legal bases for processing (where applicable)
            </h2>
            <p>
              If data-protection laws that require a legal basis apply to your use of
              the Service (for example in certain jurisdictions), we generally process
              information based on one or more of the following:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Performance of our contract with you (providing the Service);</li>
              <li>Our legitimate interests (security, moderation, improvements);</li>
              <li>
                Compliance with legal obligations; and/or
              </li>
              <li>Your consent (where we ask for it).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              6) How and when we share information
            </h2>
            <p>We may share information in the following circumstances:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>
                <strong>Public-facing content.</strong> Review and property information
                is shown to users and visitors based on product rules. We design public
                presentation to avoid exposing account email addresses.
              </li>
              <li>
                <strong>Service providers.</strong> Trusted vendors who provide
                infrastructure, database/storage, identity/authentication, maps and
                geocoding, communications (email/SMS), moderation tooling, and analytics.
              </li>
              <li>
                <strong>Business transfers.</strong> In connection with a merger,
                financing, acquisition, or sale of assets, subject to customary
                confidentiality protections.
              </li>
              <li>
                <strong>Legal and safety disclosures.</strong> To comply with law,
                legal process, or valid governmental requests, and to protect users,
                rights, property, and the Service.
              </li>
              <li>
                <strong>With your direction.</strong> Where you request or authorize us
                to share information.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              7) Cookies and analytics
            </h2>
            <p>
              We use cookies and similar technologies for session management, security,
              and product functionality. When analytics is enabled, analytics providers
              may collect usage and device data (for example, page views and interaction
              events). You can control cookies through browser settings, though some
              features may not function properly without required cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              8) Data retention
            </h2>
            <p>
              We retain personal information for as long as needed to provide the
              Service, maintain security and moderation records, comply with legal
              obligations, resolve disputes, and enforce our agreements. Retention
              periods vary by data type and purpose. Backup copies may persist for a
              limited time before deletion.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              9) Security
            </h2>
            <p>
              We use administrative, technical, and organizational safeguards designed
              to protect personal information. No security method is perfect, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              10) Your choices and rights
            </h2>
            <p>
              You can access and update certain account details from your profile.
              Depending on your jurisdiction, you may also have rights to request
              access, correction, deletion, or portability of personal information, and
              to object to or restrict certain processing. We may need to verify your
              identity before processing rights requests.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              11) Children’s privacy
            </h2>
            <p>
              The Service is not directed to children under 13, and we do not knowingly
              collect personal information from children under 13 in violation of
              applicable law. If you believe a child provided personal information to
              us, please contact us so we can investigate and take appropriate action.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              12) International users and transfers
            </h2>
            <p>
              The Service is operated in the United States. If you access it from
              outside the U.S., your information may be processed in the U.S. or other
              countries where our service providers operate, subject to applicable legal
              requirements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              13) Changes to this Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will
              post the revised version on this page and update the effective date below.
              For material changes, we may provide additional notice where required by
              law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              14) Contact us
            </h2>
            {support ? (
              <p>
                To ask questions about privacy or submit a rights request, contact{" "}
                <a className={linkInlineClass} href={`mailto:${support}`}>
                  {support}
                </a>
                .
              </p>
            ) : (
              <p>
                For privacy questions, contact us through the support channel listed on
                the site.
              </p>
            )}
          </section>

          <p className="text-xs text-zinc-500">Effective date: April 17, 2026</p>

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
