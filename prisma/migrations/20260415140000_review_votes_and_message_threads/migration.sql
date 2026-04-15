-- CreateTable
CREATE TABLE "ReviewVote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewMessageThread" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "starterUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewMessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewThreadMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewThreadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_reviewId_userId_key" ON "ReviewVote"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "ReviewVote_reviewId_idx" ON "ReviewVote"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewMessageThread_reviewId_starterUserId_key" ON "ReviewMessageThread"("reviewId", "starterUserId");

-- CreateIndex
CREATE INDEX "ReviewMessageThread_starterUserId_idx" ON "ReviewMessageThread"("starterUserId");

-- CreateIndex
CREATE INDEX "ReviewMessageThread_reviewId_idx" ON "ReviewMessageThread"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewThreadMessage_threadId_createdAt_idx" ON "ReviewThreadMessage"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMessageThread" ADD CONSTRAINT "ReviewMessageThread_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMessageThread" ADD CONSTRAINT "ReviewMessageThread_starterUserId_fkey" FOREIGN KEY ("starterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewThreadMessage" ADD CONSTRAINT "ReviewThreadMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ReviewMessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewThreadMessage" ADD CONSTRAINT "ReviewThreadMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
