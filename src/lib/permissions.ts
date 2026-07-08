// ─── Core RBAC: Role → Permission mapping & check utilities ───
// Works in both server (plain import) and client (React hook) contexts.

import type { Permission, PermissionResource, RouteAccess } from "@/types/permissions";
import type { UserRole } from "@/types";

// ── Permission Metadata Catalog ──

export const PERMISSION_CATALOG: {
  key: Permission;
  label: string;
  description: string;
  resource: PermissionResource;
}[] = [
  // Patients
  { key: "patients:read", label: "View Patients", description: "View patient records and details", resource: "patients" },
  { key: "patients:create", label: "Create Patients", description: "Add new patient records", resource: "patients" },
  { key: "patients:update", label: "Update Patients", description: "Edit existing patient records", resource: "patients" },
  { key: "patients:delete", label: "Delete Patients", description: "Remove patient records", resource: "patients" },
  // Placements
  { key: "placements:read", label: "View Placements", description: "View placement records", resource: "placements" },
  { key: "placements:create", label: "Create Placements", description: "Initiate new placements", resource: "placements" },
  { key: "placements:update", label: "Update Placements", description: "Edit placement details", resource: "placements" },
  { key: "placements:approve", label: "Approve Placements", description: "Approve pending placements", resource: "placements" },
  { key: "placements:delete", label: "Delete Placements", description: "Remove placement records", resource: "placements" },
  // Facilities
  { key: "facilities:read", label: "View Facilities", description: "View facility listings", resource: "facilities" },
  { key: "facilities:create", label: "Create Facilities", description: "Add new facilities", resource: "facilities" },
  { key: "facilities:update", label: "Update Facilities", description: "Edit facility details", resource: "facilities" },
  { key: "facilities:delete", label: "Delete Facilities", description: "Remove facility records", resource: "facilities" },
  // Hospitals
  { key: "hospitals:manage", label: "Manage Hospitals", description: "Create, edit, and delete hospital records", resource: "hospitals" },
  // Users
  { key: "users:read", label: "View Users", description: "View user accounts", resource: "users" },
  { key: "users:read-org", label: "View Org Users", description: "View users within own organization", resource: "users" },
  { key: "users:create", label: "Create Users", description: "Create new user accounts", resource: "users" },
  { key: "users:update", label: "Update Users", description: "Edit user account details", resource: "users" },
  { key: "users:delete", label: "Delete Users", description: "Remove user accounts", resource: "users" },
  { key: "users:manage-roles", label: "Manage Roles", description: "Change user roles and permissions", resource: "users" },
  // Dashboard
  { key: "dashboard:overview", label: "Dashboard Overview", description: "View the main dashboard", resource: "dashboard" },
  { key: "dashboard:staff", label: "Staff Dashboard", description: "View hospital staff dashboard", resource: "dashboard" },
  { key: "dashboard:facility", label: "Facility Dashboard", description: "View facility operator dashboard", resource: "dashboard" },
  { key: "dashboard:admin", label: "Admin Dashboard", description: "View super admin dashboard", resource: "dashboard" },
  // System
  { key: "settings:read", label: "View Settings", description: "View system settings", resource: "settings" },
  { key: "settings:write", label: "Edit Settings", description: "Modify system settings", resource: "settings" },
  // Audit
  { key: "audit:view", label: "View Audit Log", description: "View audit trail and system logs", resource: "audit" },
];

// ── Role → Permission Mapping ──

/**
 * Complete permission map.
 * `"*"` grants every permission matching the resource wildcard (e.g., `"patients:*"`).
 * Explicit permissions are also fully enumerated for clarity.
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // ── Super Admin — everything ──
  superadmin: [
    "patients:read", "patients:create", "patients:update", "patients:delete",
    "placements:read", "placements:create", "placements:update", "placements:approve", "placements:delete",
    "facilities:read", "facilities:create", "facilities:update", "facilities:delete",
    "hospitals:manage",
    "users:read", "users:read-org", "users:create", "users:update", "users:delete", "users:manage-roles",
    "dashboard:overview", "dashboard:staff", "dashboard:facility", "dashboard:admin",
    "settings:read", "settings:write",
    "audit:view",
  ],

  // ── Hospital Administrator ──
  administrator: [
    "patients:read", "patients:create", "patients:update", "patients:delete",
    "placements:read", "placements:create", "placements:update", "placements:approve", "placements:delete",
    "facilities:read", "facilities:create", "facilities:update",
    "hospitals:manage",
    "users:read", "users:read-org",
    "dashboard:overview", "dashboard:staff", "dashboard:admin",
    "settings:read",
  ],

  // ── Social Worker ──
  "social-worker": [
    "patients:read", "patients:create", "patients:update",
    "placements:read", "placements:create", "placements:update",
    "facilities:read",
    "dashboard:overview", "dashboard:staff",
  ],

  // ── Discharge Planner ──
  "discharge-planner": [
    "patients:read", "patients:create", "patients:update",
    "placements:read", "placements:create", "placements:update",
    "facilities:read",
    "dashboard:overview", "dashboard:staff",
  ],

  // ── Facility Coordinator ──
  "facility-coordinator": [
    "patients:read",
    "placements:read", "placements:update",
    "facilities:read",
    "users:read-org",
    "dashboard:overview", "dashboard:facility",
  ],

  // ── Customer (external / limited) ──
  customer: [
    "patients:read",
    "placements:read",
    "dashboard:overview",
  ],
};

const ROLE_ALIASES: Record<string, UserRole> = {
  social_worker: "social-worker",
  discharge_planner: "discharge-planner",
  facility_coordinator: "facility-coordinator",
  "social-worker": "social-worker",
  "discharge-planner": "discharge-planner",
  "facility-coordinator": "facility-coordinator",
  administrator: "administrator",
  superadmin: "superadmin",
  customer: "customer",
};

export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== "string") return null;
  return ROLE_ALIASES[role.trim().toLowerCase()] ?? null;
}

export function getFallbackRole(): UserRole {
  return process.env.NODE_ENV === "development" ? "superadmin" : "customer";
}

export function resolveRole(...candidates: unknown[]): UserRole {
  for (const candidate of candidates) {
    const role = normalizeRole(candidate);
    if (role) return role;
  }
  return getFallbackRole();
}

// ── Org-Type-to-Roles Mapping ──
// Defines which roles belong to each organization type.
// Used to scope user visibility and creation to org-appropriate roles.

/**
 * Roles that belong to a hospital organization.
 */
export const HOSPITAL_ROLES: UserRole[] = [
  "social-worker",
  "discharge-planner",
  "administrator",
];

/**
 * Roles that belong to a facility organization.
 */
export const FACILITY_ROLES: UserRole[] = [
  "facility-coordinator",
];

/**
 * Roles that are cross-cutting / platform-level (not org-scoped).
 */
export const PLATFORM_ROLES: UserRole[] = [
  "superadmin",
  "customer",
];

/**
 * Returns the roles allowed for a given organization type.
 * Superadmin bypass is handled separately — this returns only
 * the org-scoped roles for the given type.
 */
export function getRolesForOrgType(orgType: "hospital" | "facility"): UserRole[] {
  if (orgType === "facility") return FACILITY_ROLES;
  return HOSPITAL_ROLES;
}

/**
 * Returns all roles the current user can see or assign, based on their
 * role and organization type. Superadmin sees all roles.
 */
export function getAllowedRoles(
  role: string,
  orgType: "hospital" | "facility",
): UserRole[] {
  if (role === "superadmin") {
    return [...HOSPITAL_ROLES, ...FACILITY_ROLES, ...PLATFORM_ROLES];
  }
  return getRolesForOrgType(orgType);
}

// ── Route Access Map ──

export const ROUTE_ACCESS: Record<string, RouteAccess> = {
  "/dashboard": {
    permissions: ["dashboard:overview"],
    redirect: "/",
  },
  "/dashboard/staff": {
    permissions: ["dashboard:staff"],
    redirect: "/dashboard",
  },
  "/dashboard/facility": {
    permissions: ["dashboard:facility"],
    redirect: "/dashboard",
  },
  "/dashboard/admin": {
    permissions: ["dashboard:admin"],
    redirect: "/dashboard",
  },
  "/dashboard/hospitals": {
    permissions: ["hospitals:manage"],
    redirect: "/dashboard",
  },
  "/dashboard/users": {
    permissions: ["users:manage-roles", "users:read-org"],
    mode: "any",
    redirect: "/dashboard",
  },
  "/patients": {
    permissions: ["patients:read"],
    redirect: "/dashboard",
  },
  "/patients/new": {
    permissions: ["patients:create"],
    redirect: "/patients",
  },
  "/facilities": {
    permissions: ["facilities:read"],
    redirect: "/dashboard",
  },
  "/facilities/new": {
    permissions: ["facilities:create"],
    redirect: "/facilities",
  },
  "/placements": {
    permissions: ["placements:read"],
    redirect: "/dashboard",
  },
};

// ── Utility Functions ──

/**
 * Get all permissions assigned to a given role.
 */
export function getRolePermissions(role: string): Permission[] {
  const normalizedRole = resolveRole(role);
  return ROLE_PERMISSIONS[normalizedRole] ?? [];
}

/**
 * Check whether a role has a specific permission.
 * Supports wildcard resource matching (`patients:*` matches `patients:read` etc.)
 */
export function roleHasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = resolveRole(role);
  const allowed = ROLE_PERMISSIONS[normalizedRole];
  if (!allowed) return false;
  if (allowed.includes(permission)) return true;

  // Wildcard check: if the role has `<resource>:*`, grant any action on that resource.
  const resource = permission.split(":")[0] as PermissionResource;
  const wildcard = `${resource}:*` as Permission;
  return allowed.includes(wildcard);
}

/**
 * Check whether a role has all of the required permissions.
 */
export function roleHasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((p) => roleHasPermission(role, p));
}

/**
 * Check whether a role has any of the required permissions.
 */
export function roleHasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}

/**
 * Determine whether a role can access a given route path.
 */
export function canRoleAccessRoute(role: string, pathname: string): { allowed: boolean; redirect: string } {
  // Exact match first, then prefix match
  const access = ROUTE_ACCESS[pathname];
  if (!access) {
    // No explicit restriction — allow by default
    return { allowed: true, redirect: "/" };
  }

  if (access.permissions && access.permissions.length > 0) {
    const allowed = access.mode === "any"
      ? roleHasAnyPermission(role, access.permissions)
      : roleHasAllPermissions(role, access.permissions);
    return { allowed, redirect: access.redirect ?? "/" };
  }

  if (access.roles && access.roles.length > 0) {
    const normalizedRole = resolveRole(role);
    const allowed = access.roles.includes(normalizedRole);
    return { allowed, redirect: access.redirect ?? "/" };
  }

  return { allowed: true, redirect: "/" };
}

/**
 * Return a list of roles that have a specific permission.
 */
export function rolesWithPermission(permission: Permission): string[] {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([, perms]) => {
      if (perms.includes(permission)) return true;
      const resource = permission.split(":")[0] as PermissionResource;
      return perms.includes(`${resource}:*` as Permission);
    })
    .map(([role]) => role);
}

/**
 * Return all known roles.
 */
export function getAllRoles(): UserRole[] {
  return Object.keys(ROLE_PERMISSIONS) as UserRole[];
}

/**
 * All permissions grouped by resource for admin UI display.
 */
export function getPermissionsByResource(): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};
  for (const p of PERMISSION_CATALOG) {
    if (!grouped[p.resource]) grouped[p.resource] = [];
    grouped[p.resource].push(p.key);
  }
  return grouped;
}
