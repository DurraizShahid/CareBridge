-- CreateEnum
CREATE TYPE "InsuranceAuthStatus" AS ENUM ('pending', 'approved', 'denied', 'not_required');

-- AlterTable
ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "insuranceAuthStatus" "InsuranceAuthStatus" NOT NULL DEFAULT 'pending';
