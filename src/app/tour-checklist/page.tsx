import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";

export default function TourChecklistPage() {
  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader
        eyebrow="Tour checklist"
        title="Questions to bring to your next showing."
        description="Use this as a starting point when you tour an apartment. Adjust based on what you see in the reviews (noise, heat, pests, responsiveness, etc.)."
      />

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          Basics about the unit
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-zinc-700">
          <li>What floor and exposure is the unit? (Street, alley, courtyard?)</li>
          <li>How is heat and hot water provided? Who controls the thermostat?</li>
          <li>Are utilities included? If not, what are typical monthly costs?</li>
          <li>Are there any known issues with water pressure or hot water consistency?</li>
        </ul>
      </SurfacePanel>

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          Noise and neighbors
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-zinc-700">
          <li>What are quiet hours in the building or complex?</li>
          <li>Is there a history of noise complaints from neighboring units or bars?</li>
          <li>Can you hear footsteps, pipes, or street noise with the windows closed?</li>
        </ul>
      </SurfacePanel>

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          Maintenance and responsiveness
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-zinc-700">
          <li>How do you submit maintenance requests?</li>
          <li>What&apos;s the typical response time for urgent vs. non-urgent issues?</li>
          <li>Have there been any recurring problems (leaks, heat outages, pests)?</li>
        </ul>
      </SurfacePanel>

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          Lease, deposits, and move-out
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-zinc-700">
          <li>What are the conditions for getting the full security deposit back?</li>
          <li>Are there any non-standard fees (amenity fees, move-in/move-out fees)?</li>
          <li>What&apos;s the policy on subletting or early termination?</li>
        </ul>
      </SurfacePanel>

      <SurfacePanel variant="subtle">
        <h2 className="text-base font-semibold text-muted-blue-hover">
          Building-specific concerns
        </h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          Before your tour, skim the reviews for this address and add questions about:
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-zinc-700">
          <li>Any repeated issues (e.g. heat, noise, pests, deposit disputes).</li>
          <li>How those issues were handled, and whether they were fixed.</li>
          <li>Anything you&apos;re nervous about that&apos;s not in the listing.</li>
        </ul>
      </SurfacePanel>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/"
          className="rounded-full border border-zinc-200 bg-white px-5 py-3 font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
        >
          Back to home
        </Link>
        <Link
          href="/properties"
          className="rounded-full border border-zinc-200 bg-white px-5 py-3 font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
        >
          Browse addresses
        </Link>
      </div>
    </AppPageShell>
  );
}
