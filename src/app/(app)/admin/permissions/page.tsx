import { Shield, Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  PERMISSION_CATALOG,
  getRolePermissions,
  getAllRoles,
  getPermissionsByResource,
} from "@/lib/permissions";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

// ── Role display config ──

const roleDisplayConfig: Record<string, { label: string; color: string }> = {
  superadmin: { label: "Super Admin", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  administrator: { label: "Administrator", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  "social-worker": { label: "Social Worker", color: "bg-health/10 text-health dark:bg-health/20" },
  "discharge-planner": { label: "Discharge Planner", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "facility-coordinator": { label: "Facility Coordinator", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  customer: { label: "Customer", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

// ── Resource display labels ──

const resourceLabels: Record<string, string> = {
  patients: "Patients",
  placements: "Placements",
  facilities: "Facilities",
  users: "Users",
  dashboard: "Dashboards",
  settings: "Settings",
  audit: "Audit",
};

export default function PermissionsOverviewPage() {
  const roles = getAllRoles();
  const permissionsByResource = getPermissionsByResource();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roles & Permissions"
        description="Overview of all roles and their assigned permissions across the platform."
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-health" />
          {roles.length} roles &middot; {PERMISSION_CATALOG.length} permissions
        </div>
      </PageHeader>

      {/* Responsive permission matrix */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Permission
              </th>
              {roles.map((role) => {
                const display = roleDisplayConfig[role] ?? { label: role, color: "" };
                return (
                  <th key={role} className="px-3 py-3 text-center">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", display.color)}>
                      {display.label}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          {Object.entries(permissionsByResource).map(([resource, permissions]) => (
            <tbody key={resource}>
              {/* Resource group header */}
              <tr className="border-b border-border bg-muted/20">
                <td
                  colSpan={roles.length + 1}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {resourceLabels[resource] ?? resource}
                </td>
              </tr>
              {/* Permission rows */}
              {permissions.map((permission) => {
                const info = PERMISSION_CATALOG.find((p) => p.key === permission);
                return (
                  <tr key={permission} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="sticky left-0 z-10 bg-card px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-card-foreground">
                          {info?.label ?? permission}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {info?.description ?? permission}
                        </span>
                      </div>
                    </td>
                    {roles.map((role) => {
                      const rolePerms = getRolePermissions(role);
                      const hasPermission = rolePerms.includes(permission);
                      return (
                        <td key={`${role}-${permission}`} className="px-3 py-2.5 text-center">
                          {hasPermission ? (
                            <Check className="mx-auto h-4 w-4 text-health" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const display = roleDisplayConfig[role] ?? { label: role, color: "" };
          const perms = getRolePermissions(role);
          return (
            <div key={role} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", display.color)}>
                  {display.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {perms.length} / {PERMISSION_CATALOG.length} permissions
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-health transition-all"
                  style={{ width: `${(perms.length / PERMISSION_CATALOG.length) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {perms.length === PERMISSION_CATALOG.length
                  ? "Full access — all permissions granted."
                  : `${PERMISSION_CATALOG.length - perms.length} permissions restricted.`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
