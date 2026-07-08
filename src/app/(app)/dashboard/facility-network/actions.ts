"use server";

import { requireAuthenticatedUser } from "@/lib/server-auth";
import { getDummyFacilities, getDummyFacilityById } from "@/lib/dummy-facilities";
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
  facilities: ReturnType<typeof getDummyFacilities>;
  total: number;
}

export async function searchFacilitiesAction(
  params: SearchFacilitiesParams,
): Promise<SearchResult> {
  await requireAuthenticatedUser();
  let facilities = getDummyFacilities();

  if (params.location) {
    const loc = params.location.toLowerCase();
    facilities = facilities.filter(
      (f) =>
        f.address.city.toLowerCase().includes(loc) ||
        f.address.state.toLowerCase().includes(loc) ||
        f.address.zipCode.toLowerCase().includes(loc) ||
        (f.address.county && f.address.county.toLowerCase().includes(loc)),
    );
  }

  if (params.insuranceAccepted?.length) {
    facilities = facilities.filter((f) =>
      params.insuranceAccepted!.some((ins) =>
        f.insuranceAccepted.includes(ins),
      ),
    );
  }

  if (params.careLevelsOffered?.length) {
    facilities = facilities.filter((f) =>
      params.careLevelsOffered!.some((cl) =>
        f.careLevelsOffered.includes(cl),
      ),
    );
  }

  if (params.hasAvailability) {
    facilities = facilities.filter((f) => f.hasAvailability);
  }

  if (params.facilityTypes?.length) {
    facilities = facilities.filter((f) =>
      params.facilityTypes!.includes(f.type),
    );
  }

  if (params.specialties?.length) {
    facilities = facilities.filter((f) =>
      params.specialties!.some((s) => f.specialties.includes(s)),
    );
  }

  facilities.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));

  return { facilities, total: facilities.length };
}

export async function getFacilityDetailAction(id: string) {
  await requireAuthenticatedUser();
  return getDummyFacilityById(id) ?? null;
}
