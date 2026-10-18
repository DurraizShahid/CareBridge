-- CreateTable
CREATE TABLE "ChatFacilityRecommendation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "chatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatFacilityRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatFacilityRecommendation_organizationId_idx" ON "ChatFacilityRecommendation"("organizationId");

-- AddForeignKey
ALTER TABLE "ChatFacilityRecommendation" ADD CONSTRAINT "ChatFacilityRecommendation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatFacilityRecommendation" ADD CONSTRAINT "ChatFacilityRecommendation_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
