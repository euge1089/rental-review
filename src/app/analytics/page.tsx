import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { RentExplorer } from "@/app/_components/rent-explorer";
import { authOptions } from "@/lib/auth";
import { normalizeEmail } from "@/lib/normalize-email";
import { prisma } from "@/lib/prisma";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const emailRaw = session?.user?.email ?? null;

  if (!emailRaw) {
    redirect("/signin?from=/analytics");
  }

  const email = normalizeEmail(emailRaw);
  const userRow = await prisma.user.findUnique({
    where: { email },
    select: { _count: { select: { reviews: true } } },
  });
  const userReviewCount = userRow?._count.reviews ?? 0;

  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader
        eyebrow="Boston Rent Explorer"
        title="Boston Rent Intelligence and Analytics"
        description="Explore verified renter data across neighborhoods, compare price ranges, and spot patterns in amenities and recency."
        descriptionClassName="max-w-2xl text-[1.04rem] leading-relaxed text-zinc-600"
      />
      <RentExplorer userReviewCount={userReviewCount} />
      <p className="text-center text-[13px] leading-relaxed text-zinc-500 sm:text-left">
        Still new - double-check rent and lease details with the landlord before you
        decide.
      </p>
    </AppPageShell>
  );
}
