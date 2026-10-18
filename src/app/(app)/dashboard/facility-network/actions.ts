"use server";

import { getServerOrganization } from "@/lib/server-organization";
import { getRecommendedFacilityIds, isFacilityRecommendedForOrg } from "@/lib/recommended-facilities";
import { searchFacilities, getFacilityById } from "@/lib/data-access";
import type { CareLevel, FacilityType } from "@/types";

export interface SearchFacilitiesParams {
  location?: string;
  insuranceAccepted?: string[];
  careLevelsOffered?: CareLevel[];
  hasAvailability?: boolean;
  facilityTypes?: FacilityType[];
  specialties?: string[];
}

export interface SearchResult {
  facilities: Awaited<ReturnType<typeof searchFacilities>>;
  total: number;
}

export async function searchFacilitiesAction(
  params: SearchFacilitiesParams,
): Promise<SearchResult> {
  const org = await getServerOrganization();
  if (!org) throw new Error("Authentication required");
  const facilities = await searchFacilities({
    ...params,
    facilityIds: org.organizationType === "hospital" && !org.isSuperadmin
      ? [...await getRecommendedFacilityIds(org.organizationId)] : undefined,
  });
  return { facilities, total: facilities.length };
}

export async function getFacilityDetailAction(id: string) {
  const org = await getServerOrganization();
  if (!org) throw new Error("Authentication required");
  if (org.organizationType === "hospital" && !org.isSuperadmin &&
      !await isFacilityRecommendedForOrg(org.organizationId, id)) {
    throw new Error("Facility has not been recommended");
  }
  return getFacilityById(id);
}
