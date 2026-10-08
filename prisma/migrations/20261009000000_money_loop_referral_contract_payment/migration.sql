CREATE TYPE "ReferralStatus" AS ENUM ('draft', 'sent', 'accepted', 'declined', 'converted');
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'sent', 'signed');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'demo_paid');
-- Referral stores minimum necessary PHI. Organization-scoped authorization is mandatory.
CREATE TABLE "Referral" (
"id" TEXT NOT NULL PRIMARY KEY, "patientName" TEXT NOT NULL,
"patientDateOfBirth" DATE NOT NULL, "patientMrn" TEXT NOT NULL,
"careLevel" "CareLevel" NOT NULL, "requiredServices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
"status" "ReferralStatus" NOT NULL DEFAULT 'draft',
"sendingOrgId" TEXT NOT NULL, "facilityId" TEXT NOT NULL, "createdById" TEXT NOT NULL,
"sentAt" TIMESTAMP(3), "respondedAt" TIMESTAMP(3),
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Contract" (
"id" TEXT NOT NULL PRIMARY KEY, "referralId" TEXT NOT NULL,
"depositAmountCents" INTEGER NOT NULL, "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
"facilityTermsSnapshot" JSONB NOT NULL, "status" "ContractStatus" NOT NULL DEFAULT 'draft',
"documentHash" TEXT, "hospitalSignedBy" TEXT, "hospitalSignedAt" TIMESTAMP(3),
"facilitySignedBy" TEXT, "facilitySignedAt" TIMESTAMP(3), "sentAt" TIMESTAMP(3),
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "Contract_deposit_nonnegative" CHECK ("depositAmountCents" >= 0)
);
CREATE TABLE "Payment" (
"id" TEXT NOT NULL PRIMARY KEY, "referralId" TEXT NOT NULL, "contractId" TEXT,
"amountCents" INTEGER NOT NULL, "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
"stripePaymentIntentId" TEXT, "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
"demo" BOOLEAN NOT NULL DEFAULT false,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "Payment_amount_nonnegative" CHECK ("amountCents" >= 0),
CONSTRAINT "Payment_demo_status_consistency" CHECK ("status" <> 'demo_paid' OR "demo" = true)
);
CREATE INDEX "Referral_sendingOrgId_status_createdAt_idx" ON "Referral"("sendingOrgId","status","createdAt");
CREATE INDEX "Referral_facilityId_status_createdAt_idx" ON "Referral"("facilityId","status","createdAt");
CREATE UNIQUE INDEX "Contract_referralId_key" ON "Contract"("referralId");
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE INDEX "Payment_referralId_createdAt_idx" ON "Payment"("referralId","createdAt");
CREATE INDEX "Payment_contractId_idx" ON "Payment"("contractId");
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_sendingOrgId_fkey" FOREIGN KEY ("sendingOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;