import {
  getPatients,
  getPatient,
  getFacilities,
  getFacilityById,
  searchFacilities as searchAllFacilities,
  getPlacements,
  getDashboardStats,
  getRecentActivity,
} from "@/lib/data-access";
import type { Facility, Patient, Placement } from "@/types";

function normalizeSearchValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export interface ToolHandlerContext {
  organizationId: string;
  role: string;
  userId: string;
}

export type PlacementDraft = {
  patientName: string;
  patientId: string;
  facilityName: string;
  facilityId: string;
  careLevel: string;
  priority: string;
  assessmentNotes?: string;
  insuranceMatch: boolean;
  hasAvailability: boolean;
  placementData: {
    patientId: string;
    facilityId: string;
    selectedFacilityId: string;
    socialWorkerId: string;
    status: string;
    careLevel: string;
    priority: string;
    assessmentNotes?: string;
    organizationId: string;
  };
};

export type ToolResult =
  | { type: "data"; data: unknown }
  | { type: "facilities"; data: Facility[] }
  | { type: "placement-draft"; data: PlacementDraft }
  | { type: "error"; message: string };

const SEARCHABLE_PATIENT_FIELDS = [
  "firstName",
  "lastName",
  "mrn",
  "primaryDiagnosis",
] as const;

function patientMatchesSearch(
  patient: Patient,
  query: string,
): boolean {
  const normalized = normalizeSearchValue(query);
  return SEARCHABLE_PATIENT_FIELDS.some((field) => {
    const value = patient[field];
    if (typeof value === "string") {
      return normalizeSearchValue(value).includes(normalized);
    }
    return false;
  });
}

function patientMatchesStatus(
  patient: Patient,
  status: string,
): boolean {
  return patient.status === status;
}

function patientMatchesCareLevel(
  patient: Patient,
  careLevel: string,
): boolean {
  return patient.careLevelRequired === careLevel;
}

export const toolHandlers: Record<
  string,
  (
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ) => Promise<ToolResult>
> = {
  searchPatients: async (args, ctx) => {
    try {
      const patients = await getPatients(ctx.organizationId, ctx.role);
      let filtered = patients;

      if (args.query && typeof args.query === "string") {
        const q = args.query;
        filtered = filtered.filter((p) => patientMatchesSearch(p, q));
      }

      if (typeof args.status === "string") {
        const status = args.status;
        filtered = filtered.filter((p) =>
          patientMatchesStatus(p, status),
        );
      }

      if (typeof args.careLevel === "string") {
        const careLevel = args.careLevel;
        filtered = filtered.filter((p) =>
          patientMatchesCareLevel(p, careLevel),
        );
      }

      const limit =
        typeof args.limit === "number"
          ? Math.min(args.limit, 50)
          : 20;

      filtered = filtered.slice(0, limit);
      return { type: "data", data: filtered };
    } catch (e) {
      return {
        type: "error",
        message: e instanceof Error ? e.message : "Failed to search patients",
      };
    }
  },

  getPatient: async (args, ctx) => {
    try {
      const id = args.id as string;
      if (!id) return { type: "error", message: "Patient ID is required" };

      const patient = await getPatient(id, ctx.organizationId, ctx.role);
      if (!patient) return { type: "error", message: "Patient not found" };

      return { type: "data", data: patient };
    } catch (e) {
      return {
        type: "error",
        message: e instanceof Error ? e.message : "Failed to get patient",
      };
    }
  },

  searchFacilities: async (args, _ctx) => {
    try {
      const params: Parameters<typeof searchAllFacilities>[0] = {};

      if (typeof args.location === "string") {
        params.location = args.location;
      }

      if (Array.isArray(args.careLevelsOffered)) {
        params.careLevelsOffered = args.careLevelsOffered;
      }

      if (Array.isArray(args.facilityTypes)) {
        params.facilityTypes = args.facilityTypes;
      }

      if (Array.isArray(args.insuranceAccepted)) {
        params.insuranceAccepted = args.insuranceAccepted;
      }

      if (args.hasAvailability === true) {
        params.hasAvailability = true;
      }

      if (Array.isArray(args.specialties)) {
        params.specialties = args.specialties;
      }

      let facilities = await searchAllFacilities(params);

      if (facilities.length > 10) {
        facilities = facilities.slice(0, 10);
      }

      return { type: "facilities", data: facilities };
    } catch (e) {
      return {
        type: "error",
        message:
          e instanceof Error ? e.message : "Failed to search facilities",
      };
    }
  },

  getFacilities: async (_args, ctx) => {
    try {
      const facilities = await getFacilities(ctx.organizationId, ctx.role);
      return { type: "data", data: facilities };
    } catch (e) {
      return {
        type: "error",
        message:
          e instanceof Error ? e.message : "Failed to get facilities",
      };
    }
  },

  getFacility: async (args, _ctx) => {
    try {
      const id = args.id as string;
      if (!id) return { type: "error", message: "Facility ID is required" };

      const facility = await getFacilityById(id);
      if (!facility) return { type: "error", message: "Facility not found" };

      return { type: "data", data: facility };
    } catch (e) {
      return {
        type: "error",
        message: e instanceof Error ? e.message : "Failed to get facility",
      };
    }
  },

  getPlacements: async (args, ctx) => {
    try {
      const placements = await getPlacements(ctx.organizationId, ctx.role);
      let filtered: Placement[] = placements;

      if (args.status && typeof args.status === "string") {
        filtered = filtered.filter((p) => p.status === args.status);
      }

      if (args.priority && typeof args.priority === "string") {
        filtered = filtered.filter((p) => p.priority === args.priority);
      }

      const limit =
        typeof args.limit === "number"
          ? Math.min(args.limit, 50)
          : 20;

      filtered = filtered.slice(0, limit);
      return { type: "data", data: filtered };
    } catch (e) {
      return {
        type: "error",
        message:
          e instanceof Error ? e.message : "Failed to get placements",
      };
    }
  },

  getDashboardStats: async (_args, ctx) => {
    try {
      const stats = await getDashboardStats(ctx.organizationId, ctx.role);
      return { type: "data", data: stats };
    } catch (e) {
      return {
        type: "error",
        message:
          e instanceof Error ? e.message : "Failed to get dashboard stats",
      };
    }
  },

  getRecentActivity: async (_args, ctx) => {
    try {
      const activity = await getRecentActivity(ctx.organizationId, ctx.role);
      return { type: "data", data: activity };
    } catch (e) {
      return {
        type: "error",
        message:
          e instanceof Error ? e.message : "Failed to get recent activity",
      };
    }
  },

  draftPlacement: async (args, ctx) => {
    try {
      const patientId = args.patientId as string;
      const facilityId = args.facilityId as string;
      const careLevel = args.careLevel as string;
      const priority = (args.priority as string) ?? "medium";
      const assessmentNotes = args.assessmentNotes as string | undefined;

      if (!patientId) return { type: "error", message: "Patient ID is required" };
      if (!facilityId) return { type: "error", message: "Facility ID is required" };
      if (!careLevel) return { type: "error", message: "Care level is required" };

      const validCareLevels = [
        "independent-living", "assisted-living", "skilled-nursing",
        "long-term-care", "rehabilitation", "home-health", "hospice", "memory-care",
      ];
      if (!validCareLevels.includes(careLevel)) {
        return { type: "error", message: `Invalid care level: ${careLevel}` };
      }

      const patient = await getPatient(patientId, ctx.organizationId, ctx.role);
      if (!patient) return { type: "error", message: "Patient not found" };

      const facility = await getFacilityById(facilityId);
      if (!facility) return { type: "error", message: "Facility not found" };

      const hasCareLevel = facility.careLevelsOffered.includes(careLevel as any);
      if (!hasCareLevel) {
        return {
          type: "error",
          message: `${facility.name} does not offer ${careLevel} care`,
        };
      }

      const draft: PlacementDraft = {
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientId: patient.id,
        facilityName: facility.name,
        facilityId: facility.id,
        careLevel,
        priority,
        assessmentNotes,
        insuranceMatch: true,
        hasAvailability: facility.hasAvailability,
        placementData: {
          patientId: patient.id,
          facilityId: facility.id,
          selectedFacilityId: facility.id,
          socialWorkerId: ctx.userId,
          status: "assessment",
          careLevel,
          priority,
          organizationId: ctx.organizationId,
          ...(assessmentNotes ? { assessmentNotes } : {}),
        },
      };

      return { type: "placement-draft", data: draft };
    } catch (e) {
      return {
        type: "error",
        message:
          e instanceof Error ? e.message : "Failed to draft placement",
      };
    }
  },
};
