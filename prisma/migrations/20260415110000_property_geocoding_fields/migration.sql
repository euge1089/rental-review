-- CreateEnum
CREATE TYPE "GeocodeStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Property"
ADD COLUMN "geocodeError" TEXT,
ADD COLUMN "geocodeQueryAddress" TEXT,
ADD COLUMN "geocodeStatus" "GeocodeStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "geocodedAt" TIMESTAMP(3),
ADD COLUMN "latitude" DECIMAL(9,6),
ADD COLUMN "longitude" DECIMAL(9,6);

-- CreateIndex
CREATE INDEX "Property_city_postalCode_idx" ON "Property"("city", "postalCode");

-- CreateIndex
CREATE INDEX "Property_latitude_longitude_idx" ON "Property"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Property_geocodeStatus_updatedAt_idx" ON "Property"("geocodeStatus", "updatedAt");

-- CreateIndex
CREATE INDEX "Review_moderationStatus_createdAt_idx" ON "Review"("moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Review_monthlyRent_idx" ON "Review"("monthlyRent");

-- CreateIndex
CREATE INDEX "Review_propertyId_createdAt_idx" ON "Review"("propertyId", "createdAt");
