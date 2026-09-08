/*
  Warnings:

  - You are about to drop the column `monthlyValue` on the `ClientService` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('MONTHLY', 'ONE_OFF');

-- AlterTable
ALTER TABLE "ClientService" DROP COLUMN "monthlyValue",
ADD COLUMN     "billingType" "BillingType" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "priceValue" DECIMAL(10,2);
