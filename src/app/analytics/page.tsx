import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { RentExplorer } from "@/app/_components/rent-explorer";
import { authOptions } from "@/lib/auth";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    redirect("/signin?from=/analytics");
  }

  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader
        eyebrow="Boston Rent Explorer"
        title="See what other renters paid"
        description={
          <>
            <p>
              Pick a ZIP, bedrooms, and budget to see rent amounts from real reviews —
              useful for getting a feel for the market, not for locking in an exact
              number.
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Only includes approved reviews for Boston addresses.
            </p>
          </>
        }
      />
      <RentExplorer />
      <p className="text-center text-xs leading-relaxed text-zinc-500 sm:text-left">
        Still new — double-check rent and lease details with the landlord before you
        decide.
      </p>
    </AppPageShell>
  );
}
