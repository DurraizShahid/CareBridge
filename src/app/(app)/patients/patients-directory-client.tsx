"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Users,
  ClipboardList,
  Activity,
  CheckCircle2,
  Plus,
  ShieldCheck,
  ChevronRight,
  ArrowUpDown,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  admitted: {
    label: "Admitted",
    badgeClass: "bg-[#EDF2EC] text-[#203E39] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  "assessment-in-progress": {
    label: "Assessment",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  assessment_in_progress: {
    label: "Assessment",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  "ready-for-discharge": {
    label: "Ready for Discharge",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
    dotClass: "bg-[#F59E0B]",
  },
  ready_for_discharge: {
    label: "Ready for Discharge",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
    dotClass: "bg-[#F59E0B]",
  },
  placed: {
    label: "Placed",
    badgeClass: "bg-[#E8F8F0] text-[#14532D] border-[#C6F0D9]",
    dotClass: "bg-[#10B981]",
  },
  discharged: {
    label: "Discharged",
    badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
    dotClass: "bg-[#9CA3AF]",
  },
};

const CARE_LEVEL_LABELS: Record<string, string> = {
  "skilled-nursing": "Skilled Nursing",
  skilled_nursing: "Skilled Nursing",
  "assisted-living": "Assisted Living",
  assisted_living: "Assisted Living",
  "memory-care": "Memory Care",
  memory_care: "Memory Care",
  rehabilitation: "Rehabilitation",
  "long-term-care": "Long Term Care",
  long_term_care: "Long Term Care",
  "home-health": "Home Health",
  home_health: "Home Health",
  hospice: "Hospice",
  "independent-living": "Independent Living",
  independent_living: "Independent Living",
};

interface PatientsDirectoryClientProps {
  patients: Patient[];
  canCreate: boolean;
}

export function PatientsDirectoryClient({
  patients,
  canCreate,
}: PatientsDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCareLevel, setSelectedCareLevel] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "age" | "recent">("name");

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = patients.length;
    const assessmentCount = patients.filter(
      (p) =>
        p.status === "assessment-in-progress" ||
        (p.status as string) === "assessment_in_progress" ||
        p.status === "admitted"
    ).length;
    const dischargeReadyCount = patients.filter(
      (p) =>
        p.status === "ready-for-discharge" ||
        (p.status as string) === "ready_for_discharge"
    ).length;
    const placedCount = patients.filter(
      (p) => p.status === "placed" || p.status === "discharged"
    ).length;

    return {
      total,
      assessmentCount,
      dischargeReadyCount,
      placedCount,
    };
  }, [patients]);

  // Unique care levels present in current data
  const availableCareLevels = useMemo(() => {
    const levels = new Set<string>();
    patients.forEach((p) => {
      if (p.careLevelRequired) levels.add(p.careLevelRequired);
    });
    return Array.from(levels);
  }, [patients]);

  // Filtered & Sorted Patients
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
          const mrn = (p.mrn || "").toLowerCase();
          const diagnosis = (p.primaryDiagnosis || "").toLowerCase();
          const notes = (p.notes || "").toLowerCase();
          if (
            !fullName.includes(q) &&
            !mrn.includes(q) &&
            !diagnosis.includes(q) &&
            !notes.includes(q)
          ) {
            return false;
          }
        }

        // Care Level filter
        if (selectedCareLevel !== "all" && p.careLevelRequired !== selectedCareLevel) {
          return false;
        }

        // Status filter
        if (selectedStatus !== "all") {
          const normalizedStatus = p.status.replace(/_/g, "-");
          const targetStatus = selectedStatus.replace(/_/g, "-");
          if (normalizedStatus !== targetStatus) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          const nameA = `${a.lastName} ${a.firstName}`;
          const nameB = `${b.lastName} ${b.firstName}`;
          return nameA.localeCompare(nameB);
        }
        if (sortBy === "age") {
          return b.age - a.age;
        }
        if (sortBy === "recent") {
          const dateA = new Date(a.admissionDate || 0).getTime();
          const dateB = new Date(b.admissionDate || 0).getTime();
          return dateB - dateA;
        }
        return 0;
      });
  }, [patients, searchQuery, selectedCareLevel, selectedStatus, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCareLevel !== "all" ||
    selectedStatus !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCareLevel("all");
    setSelectedStatus("all");
  };

  return (
    <div className="space-y-8">
      {/* ── 1. Telemetry / Scope Badges ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Verified EHR Clinical Registry
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
          <span className="size-1.5 rounded-full bg-[#245C52] animate-pulse" />
          {metrics.assessmentCount} Active In Care
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
          <Activity className="size-3.5 text-[#255DCE]" />
          {metrics.dischargeReadyCount} Discharge Ready
        </div>
      </div>

      {/* ── 2. KPI Stat Cards Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registered Patients"
          value={metrics.total}
          icon={Users}
          variant="default"
          trend={{
            value: `${metrics.total} recorded`,
            positive: true,
          }}
        />
        <StatCard
          title="Active Assessments"
          value={metrics.assessmentCount}
          icon={ClipboardList}
          variant="info"
          trend={{
            value: "Under review",
            positive: true,
            neutral: true,
          }}
        />
        <StatCard
          title="Ready for Discharge"
          value={metrics.dischargeReadyCount}
          icon={Activity}
          variant="orange"
          trend={{
            value: "Transition pending",
            positive: metrics.dischargeReadyCount > 0,
          }}
        />
        <StatCard
          title="Placed / Discharged"
          value={metrics.placedCount}
          icon={CheckCircle2}
          variant="health"
          trend={{
            value: "Transferred",
            positive: true,
          }}
        />
      </div>

      {/* ── 3. Search & Interactive Filter Controls ── */}
      <div className="rounded-2xl border border-[#DCE5DE] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input with live clear */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#53665E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients by name, MRN, primary diagnosis, or clinical notes..."
              className="h-11 w-full rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] pl-10 pr-9 text-sm text-[#0D1B17] outline-none transition-colors placeholder:text-[#53665E]/70 focus:border-[#245C52] focus:bg-white focus:ring-2 focus:ring-[#245C52]/10"
              aria-label="Search patients"
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

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "name" | "age" | "recent")
                }
                className="h-11 rounded-xl border border-[#DCE5DE] bg-white px-3.5 text-xs font-semibold text-[#203E39] outline-none transition-colors hover:bg-[#FAFBF8] focus:border-[#245C52]"
                aria-label="Sort patients by"
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="age">Sort: Oldest First</option>
                <option value="recent">Sort: Most Recently Admitted</option>
              </select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-11 rounded-xl px-3 text-xs text-[#53665E] hover:text-[#0D1B17] hover:bg-[#EDF2EC]"
              >
                <X className="size-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-col gap-3 pt-2 border-t border-[#DCE5DE]/60 text-xs">
          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#53665E] mr-1">Status:</span>
            <button
              type="button"
              onClick={() => setSelectedStatus("all")}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-all border",
                selectedStatus === "all"
                  ? "bg-[#245C52] text-white border-[#245C52]"
                  : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]"
              )}
            >
              All Statuses
            </button>
            {[
              { id: "admitted", label: "Admitted" },
              { id: "assessment-in-progress", label: "Assessment" },
              { id: "ready-for-discharge", label: "Ready for Discharge" },
              { id: "placed", label: "Placed" },
              { id: "discharged", label: "Discharged" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-all border",
                  selectedStatus === st.id
                    ? "bg-[#245C52] text-white border-[#245C52]"
                    : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Care Level Filter */}
          {availableCareLevels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#53665E] mr-1">Care Level:</span>
              <button
                type="button"
                onClick={() => setSelectedCareLevel("all")}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-all border",
                  selectedCareLevel === "all"
                    ? "bg-[#245C52] text-white border-[#245C52]"
                    : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]"
                )}
              >
                All Care Levels
              </button>
              {availableCareLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedCareLevel(lvl)}
                  className={cn(
                    "rounded-full px-3 py-1 font-medium transition-all border",
                    selectedCareLevel === lvl
                      ? "bg-[#245C52] text-white border-[#245C52]"
                      : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]"
                  )}
                >
                  {CARE_LEVEL_LABELS[lvl] ?? lvl.replace(/[-_]/g, " ")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Patients Directory Content ── */}
      {filteredPatients.length === 0 ? (
        <Empty className="border border-[#DCE5DE] bg-white py-16">
          <EmptyMedia variant="icon">
            <Users className="size-6 text-[#245C52]" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-xl font-serif text-[#0D1B17]">
              {hasActiveFilters ? "No matching patients" : "No patients found"}
            </EmptyTitle>
            <EmptyDescription className="text-sm text-[#53665E] max-w-md">
              {hasActiveFilters
                ? "No registered patients matched your active search and filter settings. Try resetting filters."
                : "Your organization does not have any active patient registrations recorded yet."}
            </EmptyDescription>
          </EmptyHeader>
          {hasActiveFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-2 rounded-full border-[#DCE5DE] text-[#203E39] hover:bg-[#EDF2EC]"
            >
              Clear Active Filters
            </Button>
          ) : canCreate ? (
            <Button
              size="sm"
              className="mt-2 rounded-full bg-[#245C52] text-white hover:bg-[#19473F]"
              render={<Link href="/patients/new" />}
            >
              <Plus className="size-3.5 mr-1.5" />
              Register Patient
            </Button>
          ) : null}
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5DE] bg-[#FAFBF8] text-xs font-semibold text-[#53665E]">
                  <th className="py-3.5 pl-6 pr-4">Patient Profile</th>
                  <th className="py-3.5 px-4">MRN</th>
                  <th className="py-3.5 px-4">Age / Gender</th>
                  <th className="py-3.5 px-4">Primary Diagnosis</th>
                  <th className="py-3.5 px-4">Care Level</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5DE]/60 text-sm">
                {filteredPatients.map((patient) => {
                  const statusInfo =
                    STATUS_CONFIG[patient.status] ??
                    STATUS_CONFIG[patient.status.replace(/_/g, "-")] ?? {
                      label: patient.status,
                      badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
                      dotClass: "bg-[#9CA3AF]",
                    };

                  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();

                  return (
                    <tr
                      key={patient.id}
                      className="group transition-colors hover:bg-[#FAFBF8]"
                    >
                      {/* Name & Initials */}
                      <td className="py-4 pl-6 pr-4">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-xs font-semibold text-[#245C52] border border-[#DCE5DE]">
                            {initials}
                          </div>
                          <div>
                            <span className="font-medium text-[#0D1B17] group-hover:text-[#245C52] transition-colors">
                              {patient.firstName} {patient.lastName}
                            </span>
                            <span className="block text-xs text-[#53665E]">
                              Admitted {new Date(patient.admissionDate).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* MRN */}
                      <td className="py-4 px-4 font-mono text-xs text-[#53665E] whitespace-nowrap">
                        <Link href={`/patients/${patient.id}`}>
                          {patient.mrn}
                        </Link>
                      </td>

                      {/* Age / Gender */}
                      <td className="py-4 px-4 text-[#203E39]">
                        <Link href={`/patients/${patient.id}`}>
                          {patient.age} yrs &middot;{" "}
                          <span className="capitalize">{patient.gender}</span>
                        </Link>
                      </td>

                      {/* Primary Diagnosis */}
                      <td className="py-4 px-4 max-w-xs truncate text-[#203E39]">
                        <Link
                          href={`/patients/${patient.id}`}
                          title={patient.primaryDiagnosis}
                          className="hover:underline"
                        >
                          {patient.primaryDiagnosis}
                        </Link>
                      </td>

                      {/* Care Level */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE] whitespace-nowrap">
                          {CARE_LEVEL_LABELS[patient.careLevelRequired] ??
                            patient.careLevelRequired.replace(/[-_]/g, " ")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap",
                            statusInfo.badgeClass
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              statusInfo.dotClass
                            )}
                          />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/patients/${patient.id}/matching`}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-[#255DCE] bg-[#EBF2FF] hover:bg-[#DCEBFF] border border-[#D0E0FF] transition-colors"
                          >
                            Match
                          </Link>
                          <Link
                            href={`/patients/${patient.id}`}
                            className="p-1 text-[#53665E] hover:text-[#0D1B17] transition-colors"
                            aria-label={`View ${patient.firstName} ${patient.lastName}`}
                          >
                            <ChevronRight className="size-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count indicator */}
          <div className="flex items-center justify-between border-t border-[#DCE5DE] bg-[#FAFBF8] px-6 py-3 text-xs text-[#53665E]">
            <span>
              Showing {filteredPatients.length} of {patients.length} patients
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
