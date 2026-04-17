"use client";

import Link from "next/link";
import { linkInlineClass } from "@/lib/ui-classes";

type Props = {
  support?: string | null;
};

export function PrivacyPolicyContent({ support }: Props) {
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
          3) Information we collect
        </h2>
        <p>Depending on how you use the Service, we may collect:</p>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>Account information and authentication/session data.</li>
          <li>Verification status and anti-abuse metadata.</li>
          <li>Review content, ratings, and property-related information.</li>
          <li>Derived location data (for maps/search/analytics).</li>
          <li>Community interactions (votes, bookmarks, reports, messages, blocks).</li>
          <li>Communication preferences and email activity metadata.</li>
          <li>Technical and security data (IP, logs, browser/device events).</li>
          <li>Identity-provider profile fields when using social sign-in.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          4) How we use information
        </h2>
        <p>
          We use personal information to operate and improve the Service, moderate
          content, support community features, send service communications, protect
          users and platform security, comply with legal obligations, and analyze
          product performance.
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
          6) Cookies, analytics, retention, and security
        </h2>
        <p>
          We use cookies/related technologies for sessions, security, and product
          functionality. Where enabled, analytics providers may receive usage data. We
          retain data as needed for service operation, legal compliance, and dispute
          handling. We apply administrative, technical, and organizational safeguards,
          but no system is perfectly secure.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          7) Your choices and rights
        </h2>
        <p>
          You can update certain account details in your profile. Depending on your
          jurisdiction, you may have rights to access, correct, delete, or export
          personal information, and to object to or limit certain processing.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          8) Children, international use, and policy updates
        </h2>
        <p>
          The Service is not directed to children under 13. If you access the Service
          from outside the U.S., your data may be processed in the U.S. or other
          countries where providers operate. We may update this policy and post revised
          versions on this page.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-muted-blue-hover">9) Contact us</h2>
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

      <p className="text-xs text-zinc-500">Effective date: April 17, 2026</p>
    </div>
  );
}
