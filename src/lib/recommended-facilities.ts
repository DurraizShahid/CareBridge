import "server-only";
import { prisma } from "@/lib/prisma";

export async function getRecommendedFacilityIds(organizationId: string): Promise<Set<string>> {
  const recommendations = await prisma.chatFacilityRecommendation.findMany({
    where: { organizationId },
    select: { facilityId: true },
    distinct: ["facilityId"],
  });
  return new Set(recommendations.map(({ facilityId }) => facilityId));
}

export async function isFacilityRecommendedForOrg(organizationId: string, facilityId: string): Promise<boolean> {
  const recommendation = await prisma.chatFacilityRecommendation.findFirst({
    where: { organizationId, facilityId }, select: { id: true },
  });
  if (recommendation) return true;

  // Contracts belong to referrals, so this also preserves access through contracts.
  const referral = await prisma.referral.findFirst({
    where: { sendingOrgId: organizationId, facilityId }, select: { id: true },
  });
  if (referral) return true;

  const placement = await prisma.placement.findFirst({
    where: { organizationId, OR: [{ facilityId }, { selectedFacilityId: facilityId }] },
    select: { id: true },
  });
  return Boolean(placement);
}
