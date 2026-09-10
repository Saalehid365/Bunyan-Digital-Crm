-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('MANAGE_CLIENTS', 'VIEW_REPORTS', 'MANAGE_SERVICES', 'MANAGE_BILLING');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[];
