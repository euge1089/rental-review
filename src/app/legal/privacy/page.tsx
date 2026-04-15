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
          <div className="space-y-2">
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <strong>Not legal advice.</strong> This policy describes how Rent Review
              Boston is designed to work today. A qualified attorney should review it
              against your actual data flows, vendors, and obligations (including
              Massachusetts privacy rules and, if you have users in other regions,
              laws such as GDPR or state consumer privacy statutes).
            </p>
            {support ? (
              <p className="text-sm text-zinc-600">
                Privacy questions and requests:{" "}
                <a className={linkInlineClass} href={`mailto:${support}`}>
                  {support}
                </a>
              </p>
            ) : (
              <p className="text-sm text-zinc-600">
                Set{" "}
                <code className="rounded bg-zinc-100 px-1">SUPPORT_EMAIL</code> or{" "}
                <code className="rounded bg-zinc-100 px-1">
                  NEXT_PUBLIC_SUPPORT_EMAIL
                </code>{" "}
                in production to show a contact for privacy requests.
              </p>
            )}
          </div>
        }
      />

      <SurfacePanel variant="subtle">
        <div className="max-w-none space-y-6 text-sm leading-relaxed text-zinc-700">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Who we are and scope
            </h2>
            <p>
              This policy applies to the website and online services branded{" "}
              <strong>Rent Review Boston</strong> (the “Service”). The Service is
              focused on address-level rental experiences in the{" "}
              <strong>City of Boston, Massachusetts</strong>. By using the Service,
              you agree to this Privacy Policy together with our{" "}
              <Link href="/legal/terms" className={linkInlineClass}>
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Information we collect
            </h2>
            <p>
              We collect information in the categories below, depending on how you use
              the Service.
            </p>
            <ul className="list-inside list-disc space-y-2 pl-1">
              <li>
                <strong>Account and profile.</strong> Email address; optional display
                name; optional profile field for the first calendar year you started
                renting in Boston (used to enforce which lease years you may select
                when submitting reviews). For email-and-password sign-up, we store a
                password hash and use one-time email verification codes during
                registration (codes are not retained after successful verification).
              </li>
              <li>
                <strong>Authentication.</strong> If you sign in with Google, we
                receive profile information from Google as part of OAuth (typically
                email and name). We use that to create or update your account.
              </li>
              <li>
                <strong>SMS verification (optional).</strong> If you choose to verify
                your phone number, we send verification codes through our SMS provider.
                Successful verification is stored on your account as a{" "}
                <strong>verification flag</strong> (for example, to show a
                “verified” indicator on your public reviews and to streamline
                moderation). We do <strong>not</strong> need to retain your phone
                number in our database for that purpose after verification completes;
                phone numbers are processed by the SMS vendor when you enter them for
                verification.
              </li>
              <li>
                <strong>Reviews and property content.</strong> Address information (City
                of Boston only), lease-start year, rent and unit details you provide,
                amenity flags, numeric scores, free-text review body, moderation
                status, moderation reasons, timestamps, and optional settings such as
                fully anonymous public display (where enabled).
              </li>
              <li>
                <strong>Derived property location data.</strong> We may geocode
                property addresses to latitude and longitude to power search,
                analytics, and map features. Map views use privacy-conscious
                positioning (for example, coordinates adjusted to a block-level grid)
                so pins do not pinpoint an exact street address on the map.
              </li>
              <li>
                <strong>Community features.</strong> “Helpful” votes on reviews;
                private message threads tied to reviews; user block relationships;
                bookmarks (saved addresses).
              </li>
              <li>
                <strong>Reports and safety.</strong> When you report content, we
                collect the report reason and associated review and account
                identifiers. Administrators may review account and content records to
                enforce policies.
              </li>
              <li>
                <strong>Email programs.</strong> Transactional emails (such as sign-in
                and verification). Optional retention and reminder emails for people
                who have joined but not yet submitted a review, and optional
                follow-ups, subject to your email preferences. An optional daily
                activity email summarizing new “helpful” votes on your reviews and new
                private messages, which you can turn off separately. We may log which
                campaigns were sent and whether certain tracked links were clicked, to
                avoid duplicate sends and measure engagement.
              </li>
              <li>
                <strong>Technical and security data.</strong> Server logs, IP
                addresses, and similar data used for security, abuse prevention,
                debugging, and rate limiting. We may use cookies or similar
                technologies for session management and, when configured, analytics.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              How we use information
            </h2>
            <p>We use the information above to:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Provide, operate, and improve the Service;</li>
              <li>Authenticate users and maintain sessions;</li>
              <li>
                Moderate content (including automated checks, such as flagging
                submissions that may contain individual names, and manual review where
                applicable);
              </li>
              <li>
                Display public property and review information according to our access
                rules (including teaser-only content for signed-out visitors where
                implemented);
              </li>
              <li>
                Show verification indicators, helpful votes, and messaging features as
                described in the product;
              </li>
              <li>
                Send transactional and optional emails in line with your preferences;
              </li>
              <li>Detect, prevent, and respond to fraud, abuse, and security issues;</li>
              <li>Comply with law and enforce our Terms; and</li>
              <li>Analyze usage when analytics tools are enabled.</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your personal information as a commodity.
              We do not use your information for third-party marketing unrelated to the
              Service, except as part of standard analytics or infrastructure
              processing by vendors described below.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              How we share information
            </h2>
            <p>We share information only as needed to run the Service:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>
                <strong>Service providers.</strong> We use third-party vendors for
                hosting and infrastructure, database storage, email delivery, SMS
                verification, maps and geocoding, authentication (e.g., Google
                sign-in), and optional web analytics. Those providers process data on
                our behalf subject to their terms and our agreements.
              </li>
              <li>
                <strong>Public content.</strong> Reviews and related property
                information you submit may be shown to other users and visitors in
                accordance with product rules. Public review display is designed so
                that your account email is not shown on review cards; optional
                anonymity settings may apply. A verified-phone indicator may appear on
                your public reviews when applicable.
              </li>
              <li>
                <strong>Legal and safety.</strong> We may disclose information if
                required by law, legal process, or a good-faith belief that disclosure
                is necessary to protect rights, safety, or the integrity of the
                Service.
              </li>
            </ul>
            <p>
              Subprocessors and categories may change; your counsel may wish to
              maintain an internal list (for example: cloud host, PostgreSQL provider,
              Resend for email, Twilio for SMS verification, Mapbox for maps and
              geocoding, Google OAuth, Google Analytics when{" "}
              <code className="rounded bg-zinc-100 px-1">
                NEXT_PUBLIC_GA_MEASUREMENT_ID
              </code>{" "}
              is set, optional Upstash Redis for rate limiting).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Cookies and analytics
            </h2>
            <p>
              We use cookies and similar technologies as needed for sign-in sessions.
              When a Google Analytics measurement ID is configured, GA4 may collect
              usage and device data according to Google’s policies. You can control
              cookies through your browser; blocking certain cookies may limit
              functionality.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Retention
            </h2>
            <p>
              We retain account and content information for as long as your account is
              active and as needed to provide the Service, comply with law, resolve
              disputes, and enforce our agreements. Backup systems may retain data for
              a period after deletion. Specific retention schedules should be finalized
              with counsel and your hosting setup.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Security
            </h2>
            <p>
              We use reasonable administrative, technical, and organizational measures
              appropriate to the nature of the Service. No method of transmission or
              storage is completely secure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Your choices and rights
            </h2>
            <p>
              Depending on where you live, you may have rights to access, correct,
              delete, or export personal information, or to opt out of certain
              processing. You can update much of your account information in your
              profile (including email preferences for optional emails). For other
              requests, contact us using the email above. We may need to verify your
              identity before fulfilling requests.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Children
            </h2>
            <p>
              The Service is not directed to children under 13, and we do not
              knowingly collect personal information from children under 13 in a manner
              inconsistent with applicable law. Our Terms describe an intended minimum
              age for account holders; align both documents with your age gate and
              counsel’s advice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              International users
            </h2>
            <p>
              The Service is operated from the United States and is Boston-focused. If
              you access it from elsewhere, your information may be processed in the
              U.S. and in the locations where our vendors operate. Cross-border
              transfers should be reviewed with counsel if you market outside the U.S.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-muted-blue-hover">
              Changes to this policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the
              updated policy on this page and may notify you as required by law or as
              we reasonably deem appropriate.
            </p>
          </section>

          <p className="text-sm text-zinc-600">
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
