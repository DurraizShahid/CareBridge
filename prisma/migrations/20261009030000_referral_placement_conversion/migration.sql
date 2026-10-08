ALTER TABLE "Referral" ADD COLUMN "convertedPlacementId" TEXT;
CREATE UNIQUE INDEX "Referral_convertedPlacementId_key" ON "Referral"("convertedPlacementId");
