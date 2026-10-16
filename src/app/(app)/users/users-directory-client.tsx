"use client";

import { useState, useMemo } from "react";
import {
  Search,
  X,
  Users,
  Shield,
  Briefcase,
  UserCheck,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/types";

const ROLE_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
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

interface UsersDirectoryClientProps {
  users: UserType[];
}

export function UsersDirectoryClient({ users }: UsersDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter(
      (u) => u.role === "administrator" || u.role === "superadmin"
    ).length;
    const socialWorkerCount = users.filter(
      (u) => u.role === "social-worker" || u.role === "discharge-planner"
    ).length;
    const coordinatorCount = users.filter(
      (u) => u.role === "facility-coordinator"
    ).length;

    return { total, adminCount, socialWorkerCount, coordinatorCount };
  }, [users]);

  // Unique roles present
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    users.forEach((u) => {
      if (u.role) roles.add(u.role);
    });
    return Array.from(roles);
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        const dept = (u.department || "").toLowerCase();
        const role = (u.role || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();

        if (
          !fullName.includes(q) &&
          !email.includes(q) &&
          !dept.includes(q) &&
          !role.includes(q) &&
          !phone.includes(q)
        ) {
          return false;
        }
      }

      if (selectedRole !== "all" && u.role !== selectedRole) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, selectedRole]);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedRole !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
  };

  return (
    <div className="space-y-8">
      {/* ── KPI Stat Cards Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Organization Users"
          value={metrics.total}
          icon={Users}
          variant="default"
          trend={{
            value: `${metrics.total} active members`,
            positive: true,
          }}
        />
        <StatCard
          title="Administrators"
          value={metrics.adminCount}
          icon={Shield}
          variant="purple"
          trend={{
            value: "Security & management",
            positive: true,
            neutral: true,
          }}
        />
        <StatCard
          title="Social Workers & Planners"
          value={metrics.socialWorkerCount}
          icon={UserCheck}
          variant="health"
          trend={{
            value: "Clinical intake",
            positive: true,
          }}
        />
        <StatCard
          title="Facility Coordinators"
          value={metrics.coordinatorCount}
          icon={Briefcase}
          variant="info"
          trend={{
            value: "Network operations",
            positive: true,
          }}
        />
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="rounded-2xl border border-[#DCE5DE] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#53665E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members by name, email, department, role, or phone..."
              className="h-11 w-full rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] pl-10 pr-9 text-sm text-[#0D1B17] outline-none transition-colors placeholder:text-[#53665E]/70 focus:border-[#245C52] focus:bg-white focus:ring-2 focus:ring-[#245C52]/10"
              aria-label="Search users"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#53665E] hover:text-[#0D1B17] p-1"
                aria-label="Clear search input"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-11 rounded-xl px-3 text-xs text-[#53665E] hover:text-[#0D1B17] hover:bg-[#EDF2EC]"
            >
              <X className="size-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DCE5DE]/60 text-xs">
          <span className="font-semibold text-[#53665E] mr-1">Role:</span>
          <button
            type="button"
            onClick={() => setSelectedRole("all")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-all border",
              selectedRole === "all"
                ? "bg-[#245C52] text-white border-[#245C52]"
                : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]"
            )}
          >
            All Roles
          </button>
          {availableRoles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-all border",
                selectedRole === role
                  ? "bg-[#245C52] text-white border-[#245C52]"
                  : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]"
              )}
            >
              {ROLE_CONFIG[role]?.label ?? role}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Content ── */}
      {filteredUsers.length === 0 ? (
        <Empty className="border border-[#DCE5DE] bg-white py-16">
          <EmptyMedia variant="icon">
            <Users className="size-6 text-[#245C52]" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-xl font-serif text-[#0D1B17]">
              {hasActiveFilters ? "No matching team members" : "No users found"}
            </EmptyTitle>
            <EmptyDescription className="text-sm text-[#53665E] max-w-md">
              {hasActiveFilters
                ? "No users in your organization match your current search query or role filter."
                : "There are currently no registered team members recorded in this organization."}
            </EmptyDescription>
          </EmptyHeader>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-2 rounded-full border-[#DCE5DE] text-[#203E39] hover:bg-[#EDF2EC]"
            >
              Clear Filters
            </Button>
          )}
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5DE] bg-[#FAFBF8] text-xs font-semibold text-[#53665E]">
                  <th className="py-3.5 pl-6 pr-4">Team Member</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Role Designation</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 pl-4 pr-6">Contact Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5DE]/60 text-sm">
                {filteredUsers.map((user) => {
                  const roleInfo = ROLE_CONFIG[user.role] ?? {
                    label: user.role,
                    badgeClass: "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE]",
                  };
                  const initials = `${user.firstName?.charAt(0) || ""}${
                    user.lastName?.charAt(0) || ""
                  }`.toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#FAFBF8] transition-colors"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-xs font-semibold text-[#245C52] border border-[#DCE5DE]">
                            {initials || "U"}
                          </div>
                          <div>
                            <span className="font-medium text-[#0D1B17]">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="block text-xs text-[#53665E]">
                              ID: {user.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#53665E]">
                        <a
                          href={`mailto:${user.email}`}
                          className="hover:text-[#255DCE] hover:underline"
                        >
                          {user.email}
                        </a>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                            roleInfo.badgeClass
                          )}
                        >
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#203E39]">
                        {user.department || "—"}
                      </td>
                      <td className="py-4 pl-4 pr-6 text-[#53665E]">
                        {user.phone ? (
                          <a
                            href={`tel:${user.phone}`}
                            className="hover:text-[#255DCE]"
                          >
                            {user.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#DCE5DE] bg-[#FAFBF8] px-6 py-3 text-xs text-[#53665E]">
            <span>
              Showing {filteredUsers.length} of {users.length} members
            </span>
            {hasActiveFilters && (
              <span className="italic">Filtered results active</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
