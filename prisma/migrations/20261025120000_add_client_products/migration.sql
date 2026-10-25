-- CreateEnum
CREATE TYPE "ClientProductCategory" AS ENUM ('CLOTHING', 'HEALTH_BEAUTY', 'ELECTRONICS', 'HOME_KITCHEN', 'TOYS_GAMES', 'OTHER');

-- CreateEnum
CREATE TYPE "ClientProductStatus" AS ENUM ('PENDING', 'LISTED', 'DECLINED');

-- CreateTable
CREATE TABLE "ClientProduct" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ClientProductCategory" NOT NULL DEFAULT 'OTHER',
    "price" DECIMAL(10,2),
    "quantity" INTEGER,
    "description" TEXT,
    "attributes" JSONB,
    "photos" JSONB,
    "status" "ClientProductStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "addedByPortal" BOOLEAN NOT NULL DEFAULT false,
    "addedByUserId" TEXT,
    "addedByPortalUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientProduct_clientId_idx" ON "ClientProduct"("clientId");

-- AddForeignKey
ALTER TABLE "ClientProduct" ADD CONSTRAINT "ClientProduct_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientProduct" ADD CONSTRAINT "ClientProduct_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientProduct" ADD CONSTRAINT "ClientProduct_addedByPortalUserId_fkey" FOREIGN KEY ("addedByPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
