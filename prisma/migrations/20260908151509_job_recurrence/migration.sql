-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "recurrence" "Recurrence" NOT NULL DEFAULT 'NONE';
