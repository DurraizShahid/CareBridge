ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'refund_pending';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'demo_refunded';
ALTER TABLE "Referral" ADD COLUMN "depositIssue" TEXT;
ALTER TABLE "Payment" ADD COLUMN "refundId" TEXT, ADD COLUMN "failureReason" TEXT;
CREATE TABLE "BedReservation" (
 "id" TEXT NOT NULL, "referralId" TEXT NOT NULL, "paymentId" TEXT NOT NULL,
 "facilityId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "BedReservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BedReservation_referralId_key" ON "BedReservation"("referralId");
CREATE UNIQUE INDEX "BedReservation_paymentId_key" ON "BedReservation"("paymentId");
CREATE INDEX "BedReservation_facilityId_idx" ON "BedReservation"("facilityId");
ALTER TABLE "BedReservation" ADD CONSTRAINT "BedReservation_referralId_fkey"
 FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BedReservation" ADD CONSTRAINT "BedReservation_paymentId_fkey"
 FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BedReservation" ADD CONSTRAINT "BedReservation_facilityId_fkey"
 FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "PaymentWebhookEvent" (
 "id" TEXT NOT NULL, "externalId" TEXT NOT NULL, "paymentId" TEXT NOT NULL,
 "kind" TEXT NOT NULL, "processed" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "processedAt" TIMESTAMP(3),
 CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaymentWebhookEvent_externalId_key" ON "PaymentWebhookEvent"("externalId");
CREATE INDEX "PaymentWebhookEvent_paymentId_processed_idx" ON "PaymentWebhookEvent"("paymentId","processed");
ALTER TABLE "PaymentWebhookEvent" ADD CONSTRAINT "PaymentWebhookEvent_paymentId_fkey"
 FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Existing column is named demo (Prisma exposes isDemo via @map).
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_demo_status_consistency";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_demo_status_consistency"
  CHECK ("status"::text NOT IN ('demo_paid', 'demo_refunded') OR "demo" = true);