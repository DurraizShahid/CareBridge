"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Plus,
  Building2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  HeartPulse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { Placement, Patient, Facility } from "@/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  assessment: {
    label: "Assessment",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  searching: {
    label: "Searching",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  matching: {
    label: "Matching",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  "pending-approval": {
    label: "Pending Approval",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
    dotClass: "bg-[#F59E0B]",
  },
  pending_approval: {
    label: "Pending Approval",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
    dotClass: "bg-[#F59E0B]",
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-[#EDF2EC] text-[#203E39] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  "in-progress": {
    label: "In Progress",
    badgeClass: "bg-[#EDF2EC] text-[#245C52] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-[#EDF2EC] text-[#245C52] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
    dotClass: "bg-[#9CA3AF]",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]",
    dotClass: "bg-[#DC2626]",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  emergency: {
    label: "Emergency Priority",
    badgeClass: "bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]",
  },
  high: {
    label: "High Priority",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
  },
  medium: {
    label: "Medium Priority",
    badgeClass: "bg-[#FAFBF8] text-[#203E39] border-[#DCE5DE]",
  },
  low: {
    label: "Low Priority",
    badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
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

interface PlacementsDirectoryClientProps {
  placements: Placement[];
  patients: Patient[];
  facilities: Facility[];
  canCreate: boolean;
}

export function PlacementsDirectoryClient({
  placements,
  patients,
  facilities,
  canCreate,
}: PlacementsDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"priority" | "recent" | "patient">("priority");

  // Lookup helpers
  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const facilityMap = useMemo(() => {
    const map = new Map<string, Facility>();
    facilities.forEach((f) => map.set(f.id, f));
    return map;
  }, [facilities]);

  // Metrics
  const metrics = useMemo(() => {
    const total = placements.length;
    const active = placements.filter(
      (p) => p.status !== "completed" && p.status !== "cancelled"
    ).length;
    const payerCleared = placements.filter(
      (p) => p.insuranceAuthStatus === "approved" || p.insurancePreAuthorized
    ).length;
    const pendingClearance = placements.filter(
      (p) =>
        p.insuranceAuthStatus === "pending" ||
        (!p.insuranceAuthStatus && !p.insurancePreAuthorized)
    ).length;
    const completed = placements.filter((p) => p.status === "completed").length;

    return { total, active, payerCleared, pendingClearance, completed };
  }, [placements]);

  // Priority order weight
  const priorityWeight: Record<string, number> = {
    emergency: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filter & Sort
  const filteredPlacements = useMemo(() => {
    return placements
      .filter((plc) => {
        const patient = patientMap.get(plc.patientId);
        const facilityId = plc.facilityId ?? plc.selectedFacilityId;
        const facility = facilityId ? facilityMap.get(facilityId) : null;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const patientName = patient
            ? `${patient.firstName} ${patient.lastName}`.toLowerCase()
            : "";
          const mrn = patient?.mrn?.toLowerCase() ?? "";
          const facName = facility?.name?.toLowerCase() ?? "";
          const diagnosis = patient?.primaryDiagnosis?.toLowerCase() ?? "";
          const notes = plc.notes?.toLowerCase() ?? "";

          if (
            !patientName.includes(q) &&
            !mrn.includes(q) &&
            !facName.includes(q) &&
            !diagnosis.includes(q) &&
            !notes.includes(q)
          ) {
            return false;
          }
        }

        if (selectedStatus !== "all") {
          const normPlc = plc.status.replace(/_/g, "-");
          const normTarget = selectedStatus.replace(/_/g, "-");
          if (normPlc !== normTarget) return false;
        }

        if (selectedPriority !== "all" && plc.priority !== selectedPriority) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          const wA = priorityWeight[a.priority] ?? 0;
          const wB = priorityWeight[b.priority] ?? 0;
          return wB - wA;
        }
        if (sortBy === "recent") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "patient") {
          const pA = patientMap.get(a.patientId);
          const pB = patientMap.get(b.patientId);
          const nameA = pA ? `${pA.lastName} ${pA.firstName}` : "";
          const nameB = pB ? `${pB.lastName} ${pB.firstName}` : "";
          return nameA.localeCompare(nameB);
        }
        return 0;
      });
  }, [
    placements,
    searchQuery,
    selectedStatus,
    selectedPriority,
    sortBy,
    patientMap,
    facilityMap,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedStatus !== "all" ||
    selectedPriority !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedPriority("all");
  };

  const workflowSteps = [
    { key: "assessment", label: "Assessment" },
    { key: "searching", label: "Searching" },
    { key: "pending-approval", label: "Pending Approval" },
    { key: "in-progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-8">
      {/* ── 1. Telemetry / Scope Badges ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Verified CareBridge Transition Protocol
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
          <span className="size-1.5 rounded-full bg-[#245C52] animate-pulse" />
          {metrics.active} Active Placements
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
          <Clock className="size-3.5 text-[#F59E0B]" />
          {metrics.pendingClearance} Pending Payer Clearances
        </div>
      </div>

      {/* ── 2. KPI Stat Cards Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Placements"
          value={metrics.active}
          icon={Building2}
          variant="default"
          trend={{
            value: `${metrics.total} total cases`,
            positive: true,
          }}
        />
        <StatCard
          title="Payer Authorized"
          value={metrics.payerCleared}
          icon={ShieldCheck}
          variant="health"
          trend={{
            value: "Clearance approved",
            positive: true,
          }}
        />
        <StatCard
          title="Pending Payer Clearance"
          value={metrics.pendingClearance}
          icon={Clock}
          variant="orange"
          trend={{
            value: "Under review",
            positive: metrics.pendingClearance === 0,
            neutral: true,
          }}
        />
        <StatCard
          title="Completed Transitions"
          value={metrics.completed}
          icon={CheckCircle2}
          variant="info"
          trend={{
            value: "Discharged / Placed",
            positive: true,
          }}
        />
      </div>

      {/* ── 3. Search & Interactive Filter Controls ── */}
      <div className="rounded-2xl border border-[#DCE5DE] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#53665E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search placements by patient name, facility, diagnosis, or care level..."
              className="h-11 w-full rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] pl-10 pr-9 text-sm text-[#0D1B17] outline-none transition-colors placeholder:text-[#53665E]/70 focus:border-[#245C52] focus:bg-white focus:ring-2 focus:ring-[#245C52]/10"
              aria-label="Search placements"
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

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "priority" | "recent" | "patient")
              }
              className="h-11 rounded-xl border border-[#DCE5DE] bg-white px-3.5 text-xs font-semibold text-[#203E39] outline-none transition-colors hover:bg-[#FAFBF8] focus:border-[#245C52]"
              aria-label="Sort placements by"
            >
              <option value="priority">Sort: Highest Priority</option>
              <option value="recent">Sort: Most Recent</option>
              <option value="patient">Sort: Patient Name</option>
            </select>
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

        {/* Filter Pills */}
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
              { id: "assessment", label: "Assessment" },
              { id: "searching", label: "Searching" },
              { id: "pending-approval", label: "Pending Approval" },
              { id: "in-progress", label: "In Progress" },
              { id: "completed", label: "Completed" },
              { id: "cancelled", label: "Cancelled" },
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

          {/* Priority Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#53665E] mr-1">Priority:</span>
            <button
              type="button"
              onClick={() => setSelectedPriority("all")}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-all border",
                selectedPriority === "all"
                  ? "bg-[#245C52] text-white border-[#245C52]"
                  : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]"
              )}
            >
              All Priorities
            </button>
            {["emergency", "high", "medium", "low"].map((prio) => (
              <button
                key={prio}
                type="button"
                onClick={() => setSelectedPriority(prio)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-all border capitalize",
                  selectedPriority === prio
                    ? "bg-[#245C52] text-white border-[#245C52]"
                    : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#203E39]"
                )}
              >
                {prio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Placements Cards List ── */}
      {filteredPlacements.length === 0 ? (
        <Empty className="border border-[#DCE5DE] bg-white py-16">
          <EmptyMedia variant="icon">
            <Building2 className="size-6 text-[#245C52]" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-xl font-serif text-[#0D1B17]">
              {hasActiveFilters
                ? "No matching placements"
                : "No placements initiated yet"}
            </EmptyTitle>
            <EmptyDescription className="text-sm text-[#53665E] max-w-md">
              {hasActiveFilters
                ? "No active placements matched your filters. Reset your filters to see all cases."
                : "Initiate your first placement workflow to coordinate patient transfer and care placement."}
            </EmptyDescription>
          </EmptyHeader>
          {hasActiveFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-2 rounded-full border-[#DCE5DE] text-[#203E39] hover:bg-[#EDF2EC]"
            >
              Clear Filters
            </Button>
          ) : canCreate ? (
            <Button
              size="sm"
              className="mt-2 rounded-full bg-[#245C52] text-white hover:bg-[#19473F]"
              render={<Link href="/placements/new" />}
            >
              <Plus className="size-3.5 mr-1.5" />
              New Placement
            </Button>
          ) : null}
        </Empty>
      ) : (
        <div className="space-y-4">
          {filteredPlacements.map((plc) => {
            const patient = patientMap.get(plc.patientId);
            const patientName = patient
              ? `${patient.firstName} ${patient.lastName}`
              : "Unknown Patient";
            const facilityId = plc.facilityId ?? plc.selectedFacilityId;
            const facility = facilityId ? facilityMap.get(facilityId) : null;
            const facilityName = facility?.name ?? "Not assigned";

            const statusInfo =
              STATUS_CONFIG[plc.status] ??
              STATUS_CONFIG[plc.status.replace(/_/g, "-")] ?? {
                label: plc.status,
                badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
                dotClass: "bg-[#9CA3AF]",
              };

            const prioInfo =
              PRIORITY_CONFIG[plc.priority] ?? {
                label: `${plc.priority} priority`,
                badgeClass: "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE]",
              };

            const authStatus =
              plc.insuranceAuthStatus ??
              (plc.insurancePreAuthorized ? "approved" : "pending");

            return (
              <Link
                key={plc.id}
                href={`/placements/${plc.id}`}
                className="group block rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs transition-all hover:border-[#245C52]/50 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4">
                  {/* Top row: Patient Name, Status Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-serif text-lg md:text-xl font-medium text-[#0D1B17] group-hover:text-[#245C52] transition-colors">
                        {patientName}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border",
                          statusInfo.badgeClass
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", statusInfo.dotClass)}
                        />
                        {statusInfo.label}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                          prioInfo.badgeClass
                        )}
                      >
                        {prioInfo.label}
                      </span>
                      {authStatus === "approved" ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#EDF2EC] text-[#245C52] border border-[#DCE5DE]">
                          <ShieldCheck className="size-3" />
                          Payer Cleared
                        </span>
                      ) : authStatus === "pending" ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#FFF4E5] text-[#9A5B00] border border-[#FFE2BF]">
                          <Clock className="size-3" />
                          Payer Clearance Pending
                        </span>
                      ) : authStatus === "denied" ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]">
                          <AlertCircle className="size-3" />
                          Payer Denied
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-[#53665E] group-hover:text-[#245C52] transition-colors">
                      <span>View Case</span>
                      <ChevronRight className="size-4" />
                    </div>
                  </div>

                  {/* Diagnosis & Key Details */}
                  {patient?.primaryDiagnosis && (
                    <p className="text-xs text-[#53665E]">
                      Primary Diagnosis:{" "}
                      <span className="font-medium text-[#0D1B17]">
                        {patient.primaryDiagnosis}
                      </span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#53665E] pt-2 border-t border-[#DCE5DE]/60">
                    <span className="flex items-center gap-1.5">
                      <HeartPulse className="size-3.5 text-[#245C52]" />
                      Care Level:{" "}
                      <strong className="font-semibold text-[#0D1B17]">
                        {CARE_LEVEL_LABELS[plc.careLevel] ??
                          plc.careLevel.replace(/[-_]/g, " ")}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-[#53665E]" />
                      Target Facility:{" "}
                      <strong className="font-semibold text-[#0D1B17]">
                        {facilityName}
                      </strong>
                    </span>
                    {plc.startDate && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-[#53665E]" />
                        Target Start:{" "}
                        <strong className="font-semibold text-[#0D1B17]">
                          {new Date(plc.startDate).toLocaleDateString()}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Workflow Progress Tracker */}
                  {plc.status !== "completed" && plc.status !== "cancelled" && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
                        {workflowSteps.map((step, idx) => {
                          const statusOrder = [
                            "assessment",
                            "searching",
                            "pending-approval",
                            "in-progress",
                            "completed",
                          ];
                          const normCurrent = plc.status.replace(/_/g, "-");
                          const currentIdx = statusOrder.indexOf(normCurrent);
                          const stepIdx = statusOrder.indexOf(step.key);
                          const isComplete =
                            stepIdx < currentIdx ||
                            (stepIdx === currentIdx && normCurrent === "completed");
                          const isCurrent = step.key === normCurrent;

                          return (
                            <div
                              key={step.key}
                              className="flex items-center gap-1.5 shrink-0"
                            >
                              <div
                                className={cn(
                                  "flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                                  isComplete
                                    ? "bg-[#245C52] text-white"
                                    : isCurrent
                                    ? "border-2 border-[#245C52] bg-white text-[#245C52]"
                                    : "border border-[#DCE5DE] bg-[#FAFBF8] text-[#53665E]"
                                )}
                              >
                                {isComplete ? "✓" : idx + 1}
                              </div>
                              <span
                                className={cn(
                                  "text-[11px]",
                                  isCurrent
                                    ? "font-semibold text-[#245C52]"
                                    : isComplete
                                    ? "font-medium text-[#0D1B17]"
                                    : "text-[#53665E]"
                                )}
                              >
                                {step.label}
                              </span>
                              {idx < workflowSteps.length - 1 && (
                                <div
                                  className={cn(
                                    "mx-1.5 h-0.5 w-6 rounded-full transition-colors",
                                    stepIdx < currentIdx
                                      ? "bg-[#245C52]"
                                      : "bg-[#DCE5DE]"
                                  )}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {plc.notes && (
                    <p className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60 p-2.5 text-xs text-[#53665E] italic">
                      &ldquo;{plc.notes}&rdquo;
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
