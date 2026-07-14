"use client";

import { useState } from "react";
import { ChevronDown, Building2, Users, BarChart3, Activity, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SuperAdminDashboardStats, Facility } from "@/types";

interface AdminDetailsAccordionProps {
  stats: SuperAdminDashboardStats;
  facilities: Facility[];
  className?: string;
}

const sections = [
  { id: "organizations", label: "Network Overview", icon: Building2 },
  { id: "users", label: "User Distribution", icon: Users },
  { id: "placements", label: "Placement Stats", icon: BarChart3 },
  { id: "activity", label: "Platform Activity", icon: Activity },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
] as const;

export default function AdminDetailsAccordion({
  stats,
  facilities,
  className = "",
}: AdminDetailsAccordionProps) {
  const [open, setOpen] = useState<string>("placements");

  const userRoleEntries = Object.entries(stats.usersByRole).filter(
    ([, count]) => count > 0,
  );
  const facilityTypes = facilities.reduce<Record<string, number>>((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {});

  const toggle = (id: string) => setOpen(open === id ? "" : id);

  return (
    <div className={`admin-card ${className}`}>
      <h3 className="text-lg font-semibold text-sa-foreground mb-2">Platform Details</h3>
      <div className="divide-y divide-sa-border">
        {sections.map((section) => {
          const isOpen = open === section.id;
          const Icon = section.icon;
          return (
            <div key={section.id}>
              <button
                onClick={() => toggle(section.id)}
                className="flex items-center justify-between w-full py-3 text-sm text-sa-foreground hover:text-sa-primary transition-colors"
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-sa-muted-foreground" />
                  {section.label}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-sa-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <div className="pb-3 text-sm text-sa-muted-foreground animate-in fade-in slide-in-from-top-1 duration-200">
                  {section.id === "organizations" && (
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between">
                        <span>Hospitals</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{stats.totalHospitals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Facilities</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{facilities.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Network</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{stats.totalHospitals + facilities.length}</span>
                      </div>
                      {Object.entries(facilityTypes).length > 0 && (
                        <div className="pt-2 border-t border-sa-border">
                          <p className="text-xs text-sa-muted-foreground mb-1">Facility Types</p>
                          {Object.entries(facilityTypes).map(([type, count]) => (
                            <div key={type} className="flex justify-between text-xs">
                              <span className="capitalize">{type.replace(/-/g, " ")}</span>
                              <span className="font-medium text-sa-foreground tabular-nums">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {section.id === "users" && (
                    <div className="space-y-2 pl-6">
                      {userRoleEntries.length > 0 ? (
                        userRoleEntries.map(([role, count]) => (
                          <div key={role} className="flex justify-between">
                            <span className="capitalize">{role.replace(/-/g, " ")}</span>
                            <span className="font-medium text-sa-foreground tabular-nums">{count}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-sa-muted-foreground">No user data available</p>
                      )}
                      <div className="flex justify-between pt-1 border-t border-sa-border">
                        <span className="font-medium text-sa-foreground">Total</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{stats.totalUsers}</span>
                      </div>
                    </div>
                  )}
                  {section.id === "placements" && (
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{stats.totalPlacements}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{stats.activePlacements}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{stats.completedPlacements}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Approval</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{stats.pendingApprovals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. placement time</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{stats.averagePlacementTimeDays} days</span>
                      </div>
                    </div>
                  )}
                  {section.id === "activity" && (
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between">
                        <span>Utilization Rate</span>
                        <span className="font-medium text-sa-foreground tabular-nums">{stats.facilityUtilizationRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>6-month growth</span>
                        <span className="font-medium text-sa-foreground tabular-nums">
                          {stats.placementsByMonth.reduce((a, b) => a + b.count, 0)}
                        </span>
                      </div>
                    </div>
                  )}
                  {section.id === "compliance" && (
                    <div className="space-y-2 pl-6">
                      <p className="text-xs text-sa-muted-foreground">
                        Platform compliance information will be displayed here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
