"use client";

import { ProfileAccordionSection } from "@/app/_components/profile-accordion-section";
import { ProfileVerification } from "@/app/_components/profile-verification";

type Props = {
  initialVerified: boolean;
};

export function ProfileVerificationPanel({ initialVerified }: Props) {
  const summary = initialVerified
    ? "Your profile is verified via SMS."
    : "Add SMS verification so reviews can show verified and get approved faster.";

  return (
    <ProfileAccordionSection
      id="verification"
      title="SMS Verification"
      summary={summary}
      defaultExpanded={!initialVerified}
      collapsedTone={initialVerified ? "emerald" : "neutral"}
      expandedTone="neutral"
    >
      <ProfileVerification initialVerified={initialVerified} />
    </ProfileAccordionSection>
  );
}
