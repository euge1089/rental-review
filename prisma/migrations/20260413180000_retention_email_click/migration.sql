-- CreateTable
CREATE TABLE "RetentionEmailClick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetentionEmailClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetentionEmailClick_userId_campaign_key" ON "RetentionEmailClick"("userId", "campaign");

-- CreateIndex
CREATE INDEX "RetentionEmailClick_campaign_clickedAt_idx" ON "RetentionEmailClick"("campaign", "clickedAt");

-- AddForeignKey
ALTER TABLE "RetentionEmailClick" ADD CONSTRAINT "RetentionEmailClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
