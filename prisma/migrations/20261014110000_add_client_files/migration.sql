-- CreateTable
CREATE TABLE "ClientFile" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedByPortal" BOOLEAN NOT NULL DEFAULT false,
    "uploadedByUserId" TEXT,
    "uploadedByPortalUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientFile_key_key" ON "ClientFile"("key");
CREATE INDEX "ClientFile_clientId_idx" ON "ClientFile"("clientId");

-- AddForeignKey
ALTER TABLE "ClientFile" ADD CONSTRAINT "ClientFile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientFile" ADD CONSTRAINT "ClientFile_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientFile" ADD CONSTRAINT "ClientFile_uploadedByPortalUserId_fkey" FOREIGN KEY ("uploadedByPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: ClientAsset gains an optional link to an uploaded ClientFile
ALTER TABLE "ClientAsset" ADD COLUMN     "fileId" TEXT;
CREATE UNIQUE INDEX "ClientAsset_fileId_key" ON "ClientAsset"("fileId");
ALTER TABLE "ClientAsset" ADD CONSTRAINT "ClientAsset_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "ClientFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: ClientDocument gains an optional link to an uploaded ClientFile
ALTER TABLE "ClientDocument" ADD COLUMN     "fileId" TEXT;
CREATE UNIQUE INDEX "ClientDocument_fileId_key" ON "ClientDocument"("fileId");
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "ClientFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
