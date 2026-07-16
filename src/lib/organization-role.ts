import {
  UserRole as PrismaUserRole,
} from "@/generated/prisma/enums";
import type { UserRole } from "@/types";

export type OrganizationType = "hospital" | "facility";

const PRISMA_ROLE_TO_APP_ROLE: Record<PrismaUserRole, UserRole> = {
  social_worker: "social-worker",
  discharge_planner: "discharge-planner",
  administrator: "administrator",
  facility_coordinator: "facility-coordinator",
  superadmin: "superadmin",
  customer: "customer",
};

const APP_ROLE_TO_PRISMA_ROLE: Record<UserRole, PrismaUserRole> = {
  "social-worker": PrismaUserRole.social_worker,
  "discharge-planner": PrismaUserRole.discharge_planner,
  administrator: PrismaUserRole.administrator,
  "facility-coordinator": PrismaUserRole.facility_coordinator,
  superadmin: PrismaUserRole.superadmin,
  customer: PrismaUserRole.customer,
};

export function normalizeOrganizationType(
  value: unknown,
): OrganizationType | null {
  if (value === "hospital" || value === "facility") {
    return value;
  }

  return null;
}

export function getHighestRoleForOrganizationType(
  organizationType: OrganizationType,
): PrismaUserRole {
  return organizationType === "facility"
    ? PrismaUserRole.facility_coordinator
    : PrismaUserRole.administrator;
}

export function prismaRoleToAppRole(role: PrismaUserRole): UserRole {
  return PRISMA_ROLE_TO_APP_ROLE[role];
}

export function appRoleToPrismaRole(role: UserRole): PrismaUserRole {
  return APP_ROLE_TO_PRISMA_ROLE[role];
}

const PRISMA_KEBABS: Record<string, PrismaUserRole> = {
  "social-worker": PrismaUserRole.social_worker,
  "discharge-planner": PrismaUserRole.discharge_planner,
  administrator: PrismaUserRole.administrator,
  "facility-coordinator": PrismaUserRole.facility_coordinator,
  superadmin: PrismaUserRole.superadmin,
  customer: PrismaUserRole.customer,
};

export function kebabToPrismaRole(role: string): PrismaUserRole | null {
  return PRISMA_KEBABS[role.toLowerCase()] ?? null;
}

const ROLE_NORMALIZER: Record<string, UserRole> = {
  ...PRISMA_ROLE_TO_APP_ROLE,
  "social-worker": "social-worker",
  "discharge-planner": "discharge-planner",
  "facility-coordinator": "facility-coordinator",
  administrator: "administrator",
  superadmin: "superadmin",
  customer: "customer",
};

export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== "string") return null;
  return ROLE_NORMALIZER[role.trim().toLowerCase()] ?? null;
}
