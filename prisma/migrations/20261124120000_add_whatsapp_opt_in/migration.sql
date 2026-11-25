-- AlterTable
ALTER TABLE "Client" ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastWhatsappAlertAt" TIMESTAMP(3);
