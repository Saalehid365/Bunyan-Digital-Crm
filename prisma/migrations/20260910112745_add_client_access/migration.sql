-- CreateTable
CREATE TABLE "ClientAccess" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "username" TEXT,
    "secretCipher" TEXT NOT NULL,
    "url" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientAccess_clientId_idx" ON "ClientAccess"("clientId");

-- AddForeignKey
ALTER TABLE "ClientAccess" ADD CONSTRAINT "ClientAccess_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
