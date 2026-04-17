"use client";

import Link from "next/link";
import { linkInlineClass } from "@/lib/ui-classes";

type Props = {
  support?: string | null;
};

export function PrivacyPolicyContent({ support }: Props) {
  const cookieConsentEnabled =
    process.env.NEXT_PUBLIC_ENABLE_COOKIE_CONSENT === "1" ||
    process.env.NEXT_PUBLIC_ENABLE_COOKIE_CONSENT === "true";

  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-zinc-700">
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">1) Who we are</h2>
        <p>
          This Privacy Policy explains how <strong>Rent Review Boston</strong> (“we,”
          “us,” or “our”) collects, uses, shares, and retains information when you use
          our website and related services (the “Service”).
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
          The Service is focused on rental experiences in Boston, Massachusetts. This
          policy applies to information collected through the Service, including when
          you browse public content, create an account, submit reviews, use messaging,
          or contact support.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          3) Information we collect (by category)
        </h2>
        <p>Depending on how you use the Service, we collect categories such as:</p>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>
            <span className="font-medium text-zinc-800">Identifiers and account data:</span>{" "}
            email, profile fields, account timestamps, and login/session metadata.
          </li>
          <li>
            <span className="font-medium text-zinc-800">Verification data:</span> phone
            number submitted for SMS verification, verification status, and anti-abuse
            signals.
          </li>
          <li>
            <span className="font-medium text-zinc-800">User submissions:</span> reviews,
            ratings, votes, reports, bookmarks, message threads, and moderation metadata.
          </li>
          <li>
            <span className="font-medium text-zinc-800">Device/network data:</span> IP
            address, request logs, browser/device details, and security telemetry.
          </li>
          <li>
            <span className="font-medium text-zinc-800">Location and map data:</span>{" "}
            address/geocoding outputs and approximate map-display coordinates.
          </li>
          <li>
            <span className="font-medium text-zinc-800">Communications metadata:</span>{" "}
            email preference settings, campaign send logs, and click events where enabled.
          </li>
          <li>
            <span className="font-medium text-zinc-800">Analytics data:</span> site usage
            events and page interaction metrics collected through analytics tooling when
            enabled.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          4) Legal bases and how we use information
        </h2>
        <p>
          We use personal information to operate and improve the Service, moderate
          content, support community features, send service communications, protect
          users and platform security, comply with legal obligations, and analyze
          product performance.
        </p>
        <p>
          Depending on your location, we process information under one or more legal
          bases, including performance of a contract, legitimate interests (such as
          safety and abuse prevention), legal compliance, and consent where required.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          5) How and when we share information
        </h2>
        <p>We may share information in limited circumstances, including:</p>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>Public display of review/property content according to product rules.</li>
          <li>With service providers that help us run the Service.</li>
          <li>In connection with legal obligations, safety, or business transfers.</li>
          <li>Where you direct or authorize sharing.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          6) Cookies and analytics controls
        </h2>
        <p>
          We use cookies and similar technologies for essential functionality,
          security, and measurement. Essential technologies support sign-in, session
          integrity, and core site operation.
        </p>
        <p id="cookie-preferences">
          Non-essential analytics technologies may be enabled based on your
          preferences and applicable law. You can manage cookie preferences from the
          site controls when available.
        </p>
        {cookieConsentEnabled ? (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("rr-open-cookie-preferences"))
            }
            className="inline-flex min-h-10 items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
          >
            Open cookie preferences
          </button>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          7) Your privacy rights and request process
        </h2>
        <p>
          Depending on your jurisdiction, you may have rights to access, correct,
          delete, or export personal information, and to object to or limit certain
          processing.
        </p>
        <p>
          You can submit rights requests using the support contact listed below.
          We may request verification details to confirm identity and may require
          authorized-agent proof when requests are submitted on another person’s
          behalf.
        </p>
        <p>
          We respond within legally required timelines and may deny or limit requests
          where legally permitted (for example: fraud prevention, legal hold, safety,
          and compliance obligations). Where required by law, appeal instructions are
          provided with response decisions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          8) Retention schedule
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-xs sm:text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 font-semibold text-zinc-700">Data type</th>
                <th className="px-3 py-2 font-semibold text-zinc-700">Target retention</th>
                <th className="px-3 py-2 font-semibold text-zinc-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr>
                <td className="px-3 py-2">Account records</td>
                <td className="px-3 py-2">While account is active + up to 24 months</td>
                <td className="px-3 py-2">May be retained longer for legal compliance.</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Reviews and moderation history</td>
                <td className="px-3 py-2">Persistent while published; backups as required</td>
                <td className="px-3 py-2">Needed for trust and abuse investigations.</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Reports and complaint records</td>
                <td className="px-3 py-2">Up to 36 months</td>
                <td className="px-3 py-2">Supports repeat-abuse and dispute handling.</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Messaging threads</td>
                <td className="px-3 py-2">While account is active + up to 24 months</td>
                <td className="px-3 py-2">Subject to safety/legal preservation holds.</td>
              </tr>
              <tr>
                <td className="px-3 py-2">SMS verification artifacts</td>
                <td className="px-3 py-2">Up to 12 months</td>
                <td className="px-3 py-2">Verification provider may retain under its policy.</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Security and request logs</td>
                <td className="px-3 py-2">30 to 180 days (typical)</td>
                <td className="px-3 py-2">Varies by system and security needs.</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Email campaign event data</td>
                <td className="px-3 py-2">Up to 24 months</td>
                <td className="px-3 py-2">Used for preference enforcement and campaign performance.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Actual retention may differ when we must preserve records for legal
          obligations, active disputes, fraud prevention, or security investigations.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">9) Contact us</h2>
        <p>
          We may share data with service providers and infrastructure partners,
          including providers for authentication, email delivery, SMS verification,
          analytics, mapping/geocoding, hosting, and database operations. See their
          terms and privacy notices where applicable.
        </p>
        <p>
          We also publish supporting legal policies:
          {" "}
          <Link href="/legal/content-complaints" className={linkInlineClass}>
            Content Complaints
          </Link>
          {" · "}
          <Link href="/legal/copyright" className={linkInlineClass}>
            Copyright
          </Link>
          {" · "}
          <Link href="/legal/law-enforcement-requests" className={linkInlineClass}>
            Legal Requests
          </Link>
          .
        </p>
        {support ? (
          <p>
            Privacy questions and rights requests can be sent to{" "}
            <a className={linkInlineClass} href={`mailto:${support}`}>
              {support}
            </a>
            .
          </p>
        ) : (
          <p>
            Privacy questions can be sent through the support contact listed on the
            site.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          10) Children, international use, and policy updates
        </h2>
        <p>
          The Service is not directed to children under 13. If you access the
          Service from outside the U.S., data may be processed in the U.S. or
          other countries where providers operate.
        </p>
        <p>
          We may update this policy periodically. Material updates are posted on
          this page with a revised effective date.
        </p>
      </section>

      <p className="text-xs text-zinc-500">Effective date: April 17, 2026</p>
    </div>
  );
}
