"use client";

import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/types/permissions";

// ── Props Types ──

interface RequirePermissionProps {
  /** The permission(s) required to render children. */
  permission: Permission | Permission[];
  /**
   * - `"all"` (default): user must have every listed permission.
   * - `"any"`: user must have at least one listed permission.
   */
  mode?: "all" | "any";
  /** Content to render when access is denied (default: nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface RequireRoleProps {
  /** Role(s) the user must have. */
  role: string | string[];
  /**
   * - `"any"` (default): user must match at least one role.
   * - `"all"`: user must match every role (unusual but available).
   */
  mode?: "all" | "any";
  /** Content to render when access is denied (default: nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// ── Components ──

/**
 * Conditionally renders children based on the current user's permissions.
 *
 * @example
 * ```tsx
 * <RequirePermission permission="patients:create">
 *   <AddPatientButton />
 * </RequirePermission>
 *
 * <RequirePermission permission={["patients:read", "placements:read"]} mode="all">
 *   <ComplexFeature />
 * </RequirePermission>
 * ```
 */
export function RequirePermission({
  permission,
  mode = "all",
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { can, canAll, canAny } = usePermissions();
  const perms = Array.isArray(permission) ? permission : [permission];

  const hasAccess = mode === "all" ? canAll(perms) : canAny(perms);

  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Conditionally renders children based on the current user's role.
 *
 * @example
 * ```tsx
 * <RequireRole role="superadmin" fallback={<p>Admins only</p>}>
 *   <AdminPanel />
 * </RequireRole>
 *
 * <RequireRole role={["social-worker", "discharge-planner"]} mode="any">
 *   <CaseloadView />
 * </RequireRole>
 * ```
 */
export function RequireRole({
  role,
  mode = "any",
  fallback = null,
  children,
}: RequireRoleProps) {
  const { role: currentRole } = usePermissions();
  const roles = Array.isArray(role) ? role : [role];

  const hasAccess =
    mode === "all"
      ? roles.every((r) => r === currentRole)
      : roles.some((r) => r === currentRole);

  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Conditionally renders children only if the user has ALL specified permissions.
 * Equivalent to `<RequirePermission mode="all">`.
 */
export function Can({ permission, fallback = null, children }: Omit<RequirePermissionProps, "mode">) {
  return (
    <RequirePermission permission={permission} mode="all" fallback={fallback}>
      {children}
    </RequirePermission>
  );
}

/**
 * Conditionally renders children only if the user has ANY of the specified permissions.
 * Equivalent to `<RequirePermission mode="any">`.
 */
export function CanAny({ permission, fallback = null, children }: Omit<RequirePermissionProps, "mode">) {
  return (
    <RequirePermission permission={permission} mode="any" fallback={fallback}>
      {children}
    </RequirePermission>
  );
}
