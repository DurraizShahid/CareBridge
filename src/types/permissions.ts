// ─── Permission & Role Types for CareBridge RBAC ───

/**
 * All granular permission keys in the system.
 * Convention: `<resource>:<action>`
 * Wildcard `*` grants all actions on a resource.
 *
 * Defined as a const array with `satisfies` to enforce the `<resource>:<action>` format
 * at compile time — adding an entry without a colon will produce a type error.
 */
export const PERMISSIONS = [
  // ── Patients ──
  "patients:read",
  "patients:create",
  "patients:update",
  "patients:delete",
  // ── Placements ──
  "placements:read",
  "placements:create",
  "placements:update",
  "placements:approve",
  "placements:delete",
  // ── Facilities ──
  "facilities:read",
  "facilities:create",
  "facilities:update",
  "facilities:delete",
  // ── Hospitals ──
  "hospitals:manage",
  // ── Users (admin) ──
  "users:read",
  "users:read-org",
  "users:create",
  "users:update",
  "users:delete",
  "users:manage-roles",
  // ── Dashboard access ──
  "dashboard:overview",
  "dashboard:staff",
  "dashboard:facility",
  "dashboard:admin",
  // ── System ──
  "settings:read",
  "settings:write",
  // ── Audit ──
  "audit:view",
] as const satisfies `${string}:${string}`[];

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Aggregated permission resource strings used for wildcard matching.
 * Internal — not exposed as a user-facing value.
 */
export type PermissionResource = Permission extends `${infer Resource}:${string}` ? Resource : never;

/**
 * Human-readable label for display in admin UI.
 */
export interface PermissionInfo {
  key: Permission;
  label: string;
  description: string;
  resource: PermissionResource;
}

/**
 * Route access descriptor — which roles / permissions are required for a route.
 */
export interface RouteAccess {
  /** If set, the user must have at least one of these roles. */
  roles?: string[];
  /** If set, the user must have the listed permissions. */
  permissions?: Permission[];
  /**
   * How permissions are matched:
   * - `"all"` (default): user must have every listed permission.
   * - `"any"`: user must have at least one listed permission.
   */
  mode?: "all" | "any";
  /** Redirect target when access is denied. */
  redirect?: string;
}
