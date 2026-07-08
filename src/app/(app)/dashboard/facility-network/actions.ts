"use server";

import { requireAuthenticatedUser } from "@/lib/server-auth";
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
  await requireAuthenticatedUser();
  const facilities = await searchFacilities(params);
  return { facilities, total: facilities.length };
}

export async function getFacilityDetailAction(id: string) {
  await requireAuthenticatedUser();
  return getFacilityById(id);
}
