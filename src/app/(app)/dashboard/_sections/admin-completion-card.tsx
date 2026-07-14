"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SuperAdminDashboardStats, ActivityEvent } from "@/types";

interface AdminCompletionCardProps {
  stats: SuperAdminDashboardStats;
  activities?: ActivityEvent[];
  className?: string;
}

type QueueStatus = "completed" | "pending" | "warning";

interface QueueItem {
  id: string;
  title: string;
  subtitle: string;
  status: QueueStatus;
  action?: string;
}

export default function AdminCompletionCard({
  stats,
  activities,
  className = "",
}: AdminCompletionCardProps) {
  const { completedPlacements, activePlacements, pendingApprovals, totalPlacements } = stats;
  const total = totalPlacements || 1;

  const completedPct = Math.round((completedPlacements / total) * 100);
  const activePct = Math.round((activePlacements / total) * 100);
  const pendingPct = Math.round((pendingApprovals / total) * 100);
  const remainingPct = Math.max(0, 100 - completedPct - activePct - pendingPct);

  const recentEvents = (activities ?? []).slice(0, 6);

  const queueItems: QueueItem[] = [
    ...(pendingApprovals > 0
      ? [{
          id: "pending-approvals",
          title: "Pending Approvals",
          subtitle: `${pendingApprovals} placement${pendingApprovals > 1 ? "s" : ""} require review`,
          status: "warning" as const,
          action: "/placements",
        }]
      : []),
    ...recentEvents.map((event) => ({
      id: event.id,
      title: event.title,
      subtitle: event.patientName
        ? `${event.patientName} — ${event.type}`
        : event.type,
      status: (event.type === "discharge" ? "completed" : "pending") as QueueStatus,
    })),
    ...(completedPlacements > 0
      ? [{
          id: "completed-total",
          title: `${completedPlacements} Completed`,
          subtitle: `${activePlacements} still active`,
          status: "completed" as const,
          action: "/placements",
        }]
      : []),
    {
      id: "dummy-1",
      title: "New Referral — St. Mary's",
      subtitle: "High-acuity patient awaiting assignment",
      status: "warning" as const,
    },
    {
      id: "dummy-2",
      title: "Bed Availability Alert",
      subtitle: "3 facilities at capacity in Chicago region",
      status: "warning" as const,
    },
    {
      id: "dummy-3",
      title: "Staff Certification Expiry",
      subtitle: "12 nurses require renewal this quarter",
      status: "pending" as const,
    },
    {
      id: "dummy-4",
      title: "Compliance Review Due",
      subtitle: "Q2 audit report pending submission",
      status: "pending" as const,
    },
    {
      id: "dummy-5",
      title: "Insurance Verification — Mercy Health",
      subtitle: "Pre-authorization pending for 3 patients",
      status: "warning" as const,
    },
    {
      id: "dummy-6",
      title: "Discharge Summary — Northwell",
      subtitle: "2 discharge summaries awaiting physician sign-off",
      status: "pending" as const,
    },
    {
      id: "dummy-7",
      title: "Transport Request — County General",
      subtitle: "Non-emergency medical transport not confirmed",
      status: "pending" as const,
    },
    {
      id: "dummy-8",
      title: "Medication Reconciliation",
      subtitle: "5 patients pending medication review this week",
      status: "warning" as const,
    },
  ];

  const sorted = [...queueItems].sort((a, b) => {
    const rank = { warning: 0, pending: 1, completed: 2 };
    return rank[a.status] - rank[b.status];
  });

  const totalCount = sorted.length;
  const completedCount = sorted.filter((i) => i.status === "completed").length;

  const [clickedId, setClickedId] = useState<string | null>(null);

  return (
    <div className={cn("admin-card relative flex h-full min-h-0 flex-col overflow-hidden", className)}>
      {/* Top section: completion header + progress */}
      <div className="shrink-0">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-sa-foreground">Placement Completion</h3>
          <span className="text-2xl font-bold text-sa-primary tabular-nums tracking-tight">
            {completedPct}%
          </span>
        </div>

        <div className="flex h-[28px] rounded-full overflow-hidden gap-0.5 mb-2">
          {completedPct > 0 && (
            <div
              className="bg-sa-accent flex items-center justify-center text-xs font-medium text-[#102A43] transition-opacity hover:opacity-90"
              style={{ width: `${completedPct}%` }}
            >
              {completedPct > 8 ? `${completedPct}%` : null}
            </div>
          )}
          {activePct > 0 && (
            <div
              className="bg-sa-primary flex items-center justify-center text-xs font-medium text-sa-accent transition-opacity hover:opacity-90"
              style={{ width: `${activePct}%` }}
            >
              {activePct > 8 ? `${activePct}%` : null}
            </div>
          )}
          {pendingPct > 0 && (
            <div
              className="bg-sa-muted-foreground/30 flex items-center justify-center text-xs font-medium text-sa-muted-foreground transition-opacity hover:opacity-90"
              style={{ width: `${pendingPct}%` }}
            >
              {pendingPct > 8 ? `${pendingPct}%` : null}
            </div>
          )}
          {remainingPct > 0 && (
            <div className="bg-sa-muted flex-1" style={{ width: `${remainingPct}%` }} />
          )}
        </div>

        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sa-accent" />
            <span className="text-sa-muted-foreground">Completed</span>
            <span className="font-medium text-sa-foreground tabular-nums">{completedPlacements}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sa-primary" />
            <span className="text-sa-muted-foreground">Active</span>
            <span className="font-medium text-sa-foreground tabular-nums">{activePlacements}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sa-muted-foreground/40" />
            <span className="text-sa-muted-foreground">Pending</span>
            <span className="font-medium text-sa-foreground tabular-nums">{pendingApprovals}</span>
          </div>
        </div>
      </div>

      {/* Action Queue panel — absolute, starts just below the legend, fills to bottom */}
      <section className="absolute left-[5px] right-[5px] bottom-[5px] top-[115px] z-10 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#134675]">
        {/* Queue header */}
        <div className="flex items-center justify-between shrink-0 px-4 pt-3 pb-2 border-b border-white/10">
          <h4 className="text-sm font-semibold text-white">Action Queue</h4>
          <span
            className="text-[22px] text-white/60 tabular-nums font-semibold"
            aria-label={`${completedCount} of ${totalCount} actions completed`}
          >
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Scrollable queue items */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {sorted.length > 0 ? (
            <div className="px-2 py-1.5 space-y-0.5">
              {sorted.map((item) => {
                const isClicked = clickedId === item.id;

                const StatusIcon =
                  item.status === "completed"
                    ? CheckCircle2
                    : item.status === "warning"
                      ? AlertCircle
                      : CircleDot;

                const statusLabel =
                  item.status === "completed"
                    ? "Completed"
                    : item.status === "warning"
                      ? "Needs attention"
                      : "Pending";

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setClickedId(item.id);
                      if (item.action) {
                        window.location.href = item.action;
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl transition-all duration-200",
                      isClicked
                        ? "bg-white/10"
                        : "hover:bg-white/5 active:bg-white/8",
                    )}
                    aria-label={`${item.title}: ${item.subtitle}`}
                  >
                    {/* Icon container */}
                    <div className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      item.status === "completed" && "bg-white/15",
                      item.status === "warning" && "bg-white/15",
                      item.status === "pending" && "bg-white/10",
                    )}>
                      <StatusIcon className={cn(
                        "size-4",
                        item.status === "completed" && "text-sa-accent",
                        item.status === "warning" && "text-white",
                        item.status === "pending" && "text-white/60",
                      )} />
                    </div>

                    {/* Title + subtitle */}
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-sm truncate",
                        item.status === "completed" ? "text-white/60" : "text-white",
                      )}>
                        {item.title}
                      </p>
                      <p className="text-[11px] truncate mt-0.5 text-white/50">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <span className="sr-only">{statusLabel}</span>
                    {item.action && <ChevronRight className="w-4 h-4 shrink-0 text-white/30" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <CircleDot className="w-8 h-8 text-white/30 mb-2" />
              <p className="text-sm font-medium text-white">No actions pending</p>
              <p className="text-xs text-white/50 mt-1">
                Placement-related actions will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
