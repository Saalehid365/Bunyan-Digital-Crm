-- CreateTable
CREATE TABLE "ClientOnboardingSubmission" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientOnboardingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientOnboardingSubmission_clientId_key" ON "ClientOnboardingSubmission"("clientId");

-- AddForeignKey
ALTER TABLE "ClientOnboardingSubmission" ADD CONSTRAINT "ClientOnboardingSubmission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
