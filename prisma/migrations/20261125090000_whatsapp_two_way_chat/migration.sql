-- CreateEnum
CREATE TYPE "ClientMessageChannel" AS ENUM ('PORTAL', 'WHATSAPP');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "lastWhatsappInboundAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ClientMessage" ADD COLUMN "channel" "ClientMessageChannel" NOT NULL DEFAULT 'PORTAL',
ADD COLUMN "whatsappMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClientMessage_whatsappMessageId_key" ON "ClientMessage"("whatsappMessageId");
