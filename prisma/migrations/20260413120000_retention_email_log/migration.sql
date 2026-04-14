-- AlterTable
ALTER TABLE "User" ADD COLUMN "retentionEmailsOptOut" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RetentionEmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetentionEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetentionEmailLog_userId_campaign_key" ON "RetentionEmailLog"("userId", "campaign");

-- CreateIndex
CREATE INDEX "RetentionEmailLog_campaign_sentAt_idx" ON "RetentionEmailLog"("campaign", "sentAt");

-- AddForeignKey
ALTER TABLE "RetentionEmailLog" ADD CONSTRAINT "RetentionEmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
