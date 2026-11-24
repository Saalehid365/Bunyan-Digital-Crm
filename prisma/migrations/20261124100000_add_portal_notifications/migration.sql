-- CreateEnum
CREATE TYPE "PortalNotificationKind" AS ENUM ('DOCUMENT', 'PRODUCT', 'MESSAGE', 'OVERVIEW');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "portalNotificationsReadAt" JSONB;

-- CreateTable
CREATE TABLE "PortalNotification" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" "PortalNotificationKind" NOT NULL,
    "message" TEXT NOT NULL,
    "ctaPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortalNotification_clientId_createdAt_idx" ON "PortalNotification"("clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "PortalNotification" ADD CONSTRAINT "PortalNotification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
