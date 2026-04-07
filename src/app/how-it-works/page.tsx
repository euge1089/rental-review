import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";

export default function HowItWorksPage() {
  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader
        eyebrow="How it works"
        title="Boston rental reviews, one address at a time."
        description="This project starts in South Boston and grows as renters share honest, structured reviews about where they actually lived."
      />

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          1. Search an address or browse
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          You can browse reviewed addresses on the{" "}
          <Link href="/properties" className="font-medium text-muted-blue hover:underline">
            Browse
          </Link>{" "}
          page, or paste a Boston street address into the search box. Logged-out visitors
          see teasers only—proof that reviews and rent data exist, without the full text.
        </p>
      </SurfacePanel>

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          2. Sign in and share your experience
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          To leave a review, you sign in with Google and fill out a short form: street +
          optional unit, review year, rent, a few checkboxes (parking, laundry, outdoor
          space, pet friendly, etc.), quick 1–10 scores, and optional written context.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          You can submit one review per property per calendar year. That keeps the signal
          useful without turning it into a spam wall.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          Your public review is anonymous, and your account information stays private.
          We use sign-in for trust and moderation, not to publish your name.
        </p>
      </SurfacePanel>

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          3. Name and safety
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          Your Google account is used for trust and rate limiting, but public reviews
          always show as{" "}
          <span className="font-medium text-zinc-800">Anonymous renter</span> instead of
          your name or email address.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          Reviews are still subject to moderation and basic content rules (no harassment,
          hate, or doxxing), and you can request takedowns for abusive content.
        </p>
      </SurfacePanel>

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          4. Why historical rent matters
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          Listing sites show today&apos;s asking prices. Historical renter-reported rent
          shows what similar places actually rented for, so you can catch unusually steep
          increases and negotiate with context.
        </p>
      </SurfacePanel>

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          5. What&apos;s public vs. members-only
        </h2>
        <p className="mt-2 text-sm font-medium text-zinc-800">Public (no account required):</p>
        <ul className="mt-1 list-disc pl-5 text-sm leading-relaxed text-zinc-700">
          <li>That an address has reviews and rent data.</li>
          <li>High-level teasers (counts and rough signals).</li>
        </ul>
        <p className="mt-3 text-sm font-medium text-zinc-800">
          Members-only (after sign-in with Google):
        </p>
        <ul className="mt-1 list-disc pl-5 text-sm leading-relaxed text-zinc-700">
          <li>Full review text and scores.</li>
          <li>Structured details like amenities and unit info.</li>
        </ul>
      </SurfacePanel>

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          6. Where this is going
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          The first goal is a useful, honest snapshot of South Boston rentals. Over time,
          this can expand to more Boston neighborhoods, better search tools, and clearer
          protections around fairness and legal risk as the dataset grows.
        </p>
      </SurfacePanel>

      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          href="/submit"
          className="inline-flex rounded-full bg-muted-blue px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition hover:bg-muted-blue-hover"
        >
          Share a review
        </Link>
        <Link
          href="/properties"
          className="inline-flex rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
        >
          Browse addresses
        </Link>
      </div>
    </AppPageShell>
  );
}
