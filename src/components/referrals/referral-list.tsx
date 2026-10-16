"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  ArrowRight,
  ClipboardList,
  Plus,
  Search,
  X,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
  Building2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
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

type Row = {
  id: string;
  patientName: string;
  careLevel: string;
  status: string;
  createdAt: string;
  facility: { name: string };
  sendingOrganization: { name: string };
};

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
    dotClass: "bg-[#9CA3AF]",
  },
  sent: {
    label: "Under Review",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  accepted: {
    label: "Accepted",
    badgeClass: "bg-[#EDF2EC] text-[#203E39] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  declined: {
    label: "Declined",
    badgeClass: "bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]",
    dotClass: "bg-[#DC2626]",
  },
  converted: {
    label: "Converted to Placement",
    badgeClass: "bg-[#F5F0FF] text-[#5B21B6] border-[#DDD6FE]",
    dotClass: "bg-[#7C3AED]",
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

export function ReferralList({ facilityView }: { facilityView: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "patient">("newest");

  useEffect(() => {
    fetch("/api/referrals", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unable to load referrals");
        return r.json();
      })
      .then((data: Row[]) => setRows(data))
      .catch(() => setError("Referrals could not be loaded. Please retry."))
      .finally(() => setBusy(false));
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = rows.length;
    const pendingCount = rows.filter((r) => r.status === "sent" || r.status === "draft").length;
    const acceptedCount = rows.filter((r) => r.status === "accepted").length;
    const convertedCount = rows.filter((r) => r.status === "converted").length;

    return { total, pendingCount, acceptedCount, convertedCount };
  }, [rows]);

  // Filtered & Sorted Referrals
  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const patient = row.patientName.toLowerCase();
          const fac = row.facility.name.toLowerCase();
          const org = row.sendingOrganization.name.toLowerCase();
          const care = row.careLevel.toLowerCase();
          if (
            !patient.includes(q) &&
            !fac.includes(q) &&
            !org.includes(q) &&
            !care.includes(q)
          ) {
            return false;
          }
        }

        if (selectedStatus !== "all" && row.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "patient") {
          return a.patientName.localeCompare(b.patientName);
        }
        return 0;
      });
  }, [rows, searchQuery, selectedStatus, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedStatus !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title={facilityView ? "Referral Inbox" : "Hospital Referrals"}
        description={
          facilityView
            ? "Review, evaluate, and accept patient placement referrals submitted by partner hospitals."
            : "Track requests, manage facility candidate matches, and execute placement agreements."
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Referrals" },
        ]}
      >
        {!facilityView && (
          <Button
            size="sm"
            className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
            render={<Link href="/referrals/new" />}
          >
            <Plus className="size-3.5" />
            New Referral
          </Button>
        )}
      </PageHeader>

      {/* Telemetry / Scope Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Verified CareBridge Referral Protocol
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
          <span className="size-1.5 rounded-full bg-[#245C52] animate-pulse" />
          {metrics.pendingCount} Pending Decisions
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
          <CheckCircle2 className="size-3.5 text-[#255DCE]" />
          {metrics.acceptedCount + metrics.convertedCount} Confirmed Placements
        </div>
      </div>

      {/* KPI Stat Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Referrals"
          value={metrics.total}
          icon={FileText}
          variant="default"
          trend={{
            value: `${metrics.total} recorded`,
            positive: true,
          }}
        />
        <StatCard
          title="Pending / Under Review"
          value={metrics.pendingCount}
          icon={Clock}
          variant="info"
          trend={{
            value: "Needs action",
            positive: true,
            neutral: true,
          }}
        />
        <StatCard
          title="Accepted Referrals"
          value={metrics.acceptedCount}
          icon={CheckCircle2}
          variant="health"
          trend={{
            value: "Ready for contract",
            positive: true,
          }}
        />
        <StatCard
          title="Converted to Placement"
          value={metrics.convertedCount}
          icon={Sparkles}
          variant="purple"
          trend={{
            value: "Transferred",
            positive: true,
          }}
        />
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-2xl border border-[#DCE5DE] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#53665E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search referrals by patient name, facility, sending hospital, or care level..."
              className="h-11 w-full rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] pl-10 pr-9 text-sm text-[#0D1B17] outline-none transition-colors placeholder:text-[#53665E]/70 focus:border-[#245C52] focus:bg-white focus:ring-2 focus:ring-[#245C52]/10"
              aria-label="Search referrals"
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
                setSortBy(e.target.value as "newest" | "oldest" | "patient")
              }
              className="h-11 rounded-xl border border-[#DCE5DE] bg-white px-3.5 text-xs font-semibold text-[#203E39] outline-none transition-colors hover:bg-[#FAFBF8] focus:border-[#245C52]"
              aria-label="Sort referrals by"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
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

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DCE5DE]/60 text-xs">
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
            All Referrals
          </button>
          {[
            { id: "sent", label: "Under Review" },
            { id: "accepted", label: "Accepted" },
            { id: "converted", label: "Converted" },
            { id: "declined", label: "Declined" },
            { id: "draft", label: "Draft" },
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
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      {/* Referral Content */}
      {busy ? (
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-16 text-center text-sm text-[#53665E]">
          Loading referrals...
        </div>
      ) : filteredRows.length === 0 ? (
        <Empty className="border border-[#DCE5DE] bg-white py-16">
          <EmptyMedia variant="icon">
            <ClipboardList className="size-6 text-[#245C52]" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-xl font-serif text-[#0D1B17]">
              {hasActiveFilters ? "No matching referrals" : "No referrals recorded yet"}
            </EmptyTitle>
            <EmptyDescription className="text-sm text-[#53665E] max-w-md">
              {hasActiveFilters
                ? "No referrals match your current search and filter settings. Try resetting filters."
                : facilityView
                ? "Incoming patient placement requests from hospital coordinators will appear here."
                : "Create a new placement referral to start matching patients with accredited care facilities."}
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
          ) : !facilityView ? (
            <Button
              size="sm"
              className="mt-2 rounded-full bg-[#245C52] text-white hover:bg-[#19473F]"
              render={<Link href="/referrals/new" />}
            >
              <Plus className="size-3.5 mr-1.5" />
              New Referral
            </Button>
          ) : null}
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white shadow-xs">
          <div className="divide-y divide-[#DCE5DE]/60">
            {filteredRows.map((row) => {
              const statusInfo =
                STATUS_CONFIG[row.status] ?? {
                  label: row.status,
                  badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
                  dotClass: "bg-[#9CA3AF]",
                };

              return (
                <Link
                  key={row.id}
                  href={`/referrals/${row.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 transition-colors hover:bg-[#FAFBF8] group"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF2EC] text-[#245C52] border border-[#DCE5DE]">
                      <ClipboardList className="size-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-base font-medium text-[#0D1B17] group-hover:text-[#245C52] transition-colors">
                          {row.patientName}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
                          {CARE_LEVEL_LABELS[row.careLevel] ??
                            row.careLevel.replace(/[-_]/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-[#53665E]">
                        {facilityView ? (
                          <>
                            From: <strong className="font-semibold text-[#203E39]">{row.sendingOrganization.name}</strong>
                          </>
                        ) : (
                          <>
                            To: <strong className="font-semibold text-[#203E39]">{row.facility.name}</strong>
                          </>
                        )}
                        <span className="mx-1.5">&middot;</span>
                        Requested {new Date(row.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                        statusInfo.badgeClass
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", statusInfo.dotClass)} />
                      {statusInfo.label}
                    </span>
                    <span className="flex size-8 items-center justify-center rounded-full bg-[#FAFBF8] text-[#53665E] group-hover:bg-[#245C52] group-hover:text-white transition-all border border-[#DCE5DE]">
                      <ChevronRight className="size-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-[#DCE5DE] bg-[#FAFBF8] px-6 py-3 text-xs text-[#53665E]">
            <span>
              Showing {filteredRows.length} of {rows.length} referrals
            </span>
            {hasActiveFilters && <span className="italic">Filtered results active</span>}
          </div>
        </div>
      )}
    </div>
  );
}