-- CreateEnum
CREATE TYPE "RevenueFinderStatus" AS ENUM ('NEW', 'QUALIFIED', 'NOT_QUALIFIED', 'ACCESS_GRANTED', 'SPRINT_RUNNING', 'REVEAL_BOOKED', 'COMPLETED', 'CONVERTED');

-- CreateTable
CREATE TABLE "RevenueFinderApplication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "storeUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "monthlySize" TEXT NOT NULL,
    "notes" TEXT,
    "decisionMakerOnCall" BOOLEAN NOT NULL DEFAULT false,
    "accessWithin48h" BOOLEAN NOT NULL DEFAULT false,
    "status" "RevenueFinderStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "clientId" TEXT,
    "netlifySubmissionId" TEXT NOT NULL,

    CONSTRAINT "RevenueFinderApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevenueFinderApplication_netlifySubmissionId_key" ON "RevenueFinderApplication"("netlifySubmissionId");

-- CreateIndex
CREATE INDEX "RevenueFinderApplication_status_idx" ON "RevenueFinderApplication"("status");

-- CreateIndex
CREATE INDEX "RevenueFinderApplication_createdAt_idx" ON "RevenueFinderApplication"("createdAt");

-- AddForeignKey
ALTER TABLE "RevenueFinderApplication" ADD CONSTRAINT "RevenueFinderApplication_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
