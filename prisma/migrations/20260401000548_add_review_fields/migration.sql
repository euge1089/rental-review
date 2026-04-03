-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "hasCentralHeatCooling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasInUnitLaundry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasOutdoorSpace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasParking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasStorageSpace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landlordScore" INTEGER,
ADD COLUMN     "overallScore" INTEGER,
ADD COLUMN     "unit" TEXT;
