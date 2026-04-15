-- AlterTable
ALTER TABLE "User" ADD COLUMN "messageEmailsOptOut" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ReviewMessageThread" ADD COLUMN "acceptedAt" TIMESTAMP(3),
ADD COLUMN "declinedAt" TIMESTAMP(3);

-- Existing threads: treat as already accepted so behavior stays the same.
UPDATE "ReviewMessageThread" SET "acceptedAt" = COALESCE("updatedAt", "createdAt") WHERE "acceptedAt" IS NULL;
