CREATE TYPE "ContractParty" AS ENUM ('hospital', 'facility');
ALTER TABLE "Contract" ADD COLUMN "documentText" TEXT;
CREATE TABLE "ContractSignature" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "party" "ContractParty" NOT NULL,
  "typedName" TEXT NOT NULL,
  "signerUserId" TEXT NOT NULL,
  "signerOrgId" TEXT NOT NULL,
  "consentStatement" TEXT NOT NULL,
  "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipHash" TEXT NOT NULL,
  "documentHash" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'standard',
  CONSTRAINT "ContractSignature_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContractSignature_contractId_party_key" ON "ContractSignature"("contractId", "party");
CREATE INDEX "ContractSignature_signerOrgId_signedAt_idx" ON "ContractSignature"("signerOrgId", "signedAt");
ALTER TABLE "ContractSignature" ADD CONSTRAINT "ContractSignature_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;