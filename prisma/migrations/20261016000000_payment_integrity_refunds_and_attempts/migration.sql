-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'partially_refunded';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amountRefundedCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 1;
