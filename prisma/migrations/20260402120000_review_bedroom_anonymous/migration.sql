-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "bedroomCount" INTEGER,
ADD COLUMN     "displayFullyAnonymous" BOOLEAN NOT NULL DEFAULT false;
