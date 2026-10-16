import { Shield, Check, X, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  PERMISSION_CATALOG,
  getRolePermissions,
  getAllRoles,
  getPermissionsByResource,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

// ── Role display config ──

const roleDisplayConfig: Record<string, { label: string; badgeClass: string }> = {
  superadmin: {
    label: "Super Admin",
    badgeClass: "bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]",
  },
  administrator: {
    label: "Administrator",
    badgeClass: "bg-[#F5F0FF] text-[#5B21B6] border-[#DDD6FE]",
  },
  "social-worker": {
    label: "Social Worker",
    badgeClass: "bg-[#EDF2EC] text-[#245C52] border-[#DCE5DE]",
  },
  "discharge-planner": {
    label: "Discharge Planner",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
  },
  "facility-coordinator": {
    label: "Facility Coordinator",
    badgeClass: "bg-[#E8F8F0] text-[#14532D] border-[#C6F0D9]",
  },
  customer: {
    label: "Customer",
    badgeClass: "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE]",
  },
};

// ── Resource display labels ──

const resourceLabels: Record<string, string> = {
  patients: "Patients & Clinical Records",
  placements: "Placements & Transition Cases",
  facilities: "Facility Network & Capacity",
  users: "Organization Users & Roles",
  dashboard: "Analytics & Telemetry Dashboards",
  settings: "Organization Settings",
  audit: "Security & Audit Logs",
};

export default function PermissionsOverviewPage() {
  const roles = getAllRoles();
  const permissionsByResource = getPermissionsByResource();

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Roles & Permissions"
        description="Comprehensive role-based access control (RBAC) matrix and capability assignments across CareBridge."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Roles & Permissions" },
        ]}
      >
        <div className="flex items-center gap-2 rounded-full border border-[#DCE5DE] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#203E39] shadow-xs">
          <ShieldCheck className="size-4 text-[#245C52]" />
          {roles.length} Roles &middot; {PERMISSION_CATALOG.length} Permissions
        </div>
      </PageHeader>

      {/* Permission Matrix */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE5DE] bg-[#FAFBF8] text-xs font-semibold text-[#53665E]">
                <th className="sticky left-0 z-10 bg-[#FAFBF8] py-3.5 pl-6 pr-4">
                  Permission Capability
                </th>
                {roles.map((role) => {
                  const display = roleDisplayConfig[role] ?? {
                    label: role,
                    badgeClass: "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE]",
                  };
                  return (
                    <th key={role} className="py-3.5 px-3 text-center">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
                          display.badgeClass
                        )}
                      >
                        {display.label}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            {Object.entries(permissionsByResource).map(
              ([resource, permissions]) => (
                <tbody key={resource} className="divide-y divide-[#DCE5DE]/60">
                  {/* Resource Section Banner */}
                  <tr className="bg-[#EDF2EC]/50 border-t border-b border-[#DCE5DE]">
                    <td
                      colSpan={roles.length + 1}
                      className="py-2.5 pl-6 pr-4 text-xs font-semibold text-[#245C52] uppercase tracking-wider"
                    >
                      {resourceLabels[resource] ?? resource}
                    </td>
                  </tr>

                  {/* Permission Rows */}
                  {permissions.map((permission) => {
                    const info = PERMISSION_CATALOG.find(
                      (p) => p.key === permission
                    );
                    return (
                      <tr
                        key={permission}
                        className="hover:bg-[#FAFBF8] transition-colors"
                      >
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-[#FAFBF8] py-3 pl-6 pr-4">
                          <div className="flex flex-col">
                            <span className="text-xs md:text-sm font-medium text-[#0D1B17]">
                              {info?.label ?? permission}
                            </span>
                            <span className="text-xs text-[#53665E]">
                              {info?.description ?? permission}
                            </span>
                          </div>
                        </td>
                        {roles.map((role) => {
                          const rolePerms = getRolePermissions(role);
                          const hasPermission = rolePerms.includes(permission);
                          return (
                            <td
                              key={`${role}-${permission}`}
                              className="py-3 px-3 text-center"
                            >
                              {hasPermission ? (
                                <div className="inline-flex size-6 items-center justify-center rounded-full bg-[#EDF2EC] text-[#245C52]">
                                  <Check className="size-3.5" />
                                </div>
                              ) : (
                                <div className="inline-flex size-6 items-center justify-center text-[#53665E]/30">
                                  <X className="size-3.5" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              )
            )}
          </table>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const display = roleDisplayConfig[role] ?? {
            label: role,
            badgeClass: "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE]",
          };
          const perms = getRolePermissions(role);
          const percent = Math.round(
            (perms.length / PERMISSION_CATALOG.length) * 100
          );

          return (
            <div
              key={role}
              className="rounded-2xl border border-[#DCE5DE] bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold border",
                    display.badgeClass
                  )}
                >
                  {display.label}
                </span>
                <span className="text-xs font-semibold text-[#53665E]">
                  {perms.length} / {PERMISSION_CATALOG.length} ({percent}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDF2EC]">
                <div
                  className="h-full rounded-full bg-[#245C52] transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-[#53665E]">
                {perms.length === PERMISSION_CATALOG.length
                  ? "Full administrative access across all system resources."
                  : `${
                      PERMISSION_CATALOG.length - perms.length
                    } restricted operations.`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
