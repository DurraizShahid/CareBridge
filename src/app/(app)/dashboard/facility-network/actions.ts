"use server";

import { getServerOrganization } from "@/lib/server-organization";
import { getRecommendedFacilityIds, isFacilityRecommendedForOrg } from "@/lib/recommended-facilities";
import { searchFacilities, getFacilityById } from "@/lib/data-access";
import type { CareLevel, FacilityType, Facility } from "@/types";

export interface SearchFacilitiesParams {
  location?: string;
  insuranceAccepted?: string[];
  careLevelsOffered?: CareLevel[];
  hasAvailability?: boolean;
  facilityTypes?: FacilityType[];
  specialties?: string[];
}

export interface SearchResult {
  facilities: Facility[];
  total: number;
}

export async function searchFacilitiesAction(
  params: SearchFacilitiesParams,
): Promise<SearchResult> {
  const org = await getServerOrganization();
  if (!org) throw new Error("Authentication required");
  const result = await searchFacilities({
    ...params,
    facilityIds: org.organizationType === "hospital" && !org.isSuperadmin
      ? [...await getRecommendedFacilityIds(org.organizationId)] : undefined,
  });
  const facilities = Array.isArray(result) ? result : result.facilities;
  const total = Array.isArray(result) ? result.length : result.total;
  return { facilities, total };
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
