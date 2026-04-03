import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { ReviewEditForm } from "@/app/_components/review-edit-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { linkInlineClass } from "@/lib/ui-classes";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditReviewPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return (
      <AppPageShell width="xwide" gapClass="gap-6">
        <PageHeader
          title="Edit review"
          description="You need to sign in to edit one of your reviews."
        />
        <Link href="/signin" className={`${linkInlineClass} text-sm`}>
          Sign in →
        </Link>
      </AppPageShell>
    );
  }

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      property: true,
      user: {
        select: { email: true },
      },
    },
  });

  if (!review || review.user.email?.toLowerCase() !== email.toLowerCase()) {
    notFound();
  }

  return (
    <AppPageShell width="xwide" gapClass="gap-6">
      <PageHeader
        eyebrow="Edit review"
        title="Update your experience"
        description="Adjust rent, amenities, scores, or narrative text. The address stays the same; to review a different apartment, submit a new review."
      />
      <ReviewEditForm
        reviewId={review.id}
        initial={{
          propertyAddress: review.property.addressLine1,
          propertyCity: review.property.city,
          propertyState: review.property.state,
          propertyPostalCode: review.property.postalCode,
          reviewYear: review.reviewYear,
          bedroomCount: review.bedroomCount,
          unit: review.unit,
          monthlyRent: review.monthlyRent,
          bathrooms: review.bathrooms,
          hasParking: review.hasParking,
          hasCentralHeatCooling: review.hasCentralHeatCooling,
          hasInUnitLaundry: review.hasInUnitLaundry,
          hasStorageSpace: review.hasStorageSpace,
          hasOutdoorSpace: review.hasOutdoorSpace,
          petFriendly: review.petFriendly,
          overallScore: review.overallScore,
          landlordScore: review.landlordScore,
          body: review.body,
          displayFullyAnonymous: review.displayFullyAnonymous,
        }}
      />
    </AppPageShell>
  );
}
