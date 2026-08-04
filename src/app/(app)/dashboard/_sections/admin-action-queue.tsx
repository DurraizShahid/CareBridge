"use client";

import { useState } from "react";
import { Clock, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SuperAdminDashboardStats, ActivityEvent } from "@/types";

interface AdminActionQueueProps {
  stats: SuperAdminDashboardStats;
  activities: ActivityEvent[];
  className?: string;
}

export default function AdminActionQueue({
  stats,
  activities,
  className = "",
}: AdminActionQueueProps) {
  const recentEvents = (activities ?? []).slice(0, 6);
  const totalPending = stats.pendingApprovals;

  const items = [
    ...(totalPending > 0
      ? [
          {
            id: "pending-approvals",
            title: "Pending Approvals",
            subtitle: `${totalPending} placement${totalPending > 1 ? "s" : ""} require review`,
            status: "warning" as const,
            action: "/placements",
          },
        ]
      : []),
    ...recentEvents.map((event) => ({
      id: event.id,
      title: event.title,
      subtitle: event.patientName
        ? `${event.patientName} - ${event.type}`
        : event.type,
      status: (event.type === "discharge" ? "completed" : "pending") as "pending" | "completed" | "warning",
      action: undefined as string | undefined,
    })),
    ...(stats.completedPlacements > 0
      ? [
          {
            id: "completed-total",
            title: `${stats.completedPlacements} Completed`,
            subtitle: `${stats.activePlacements} still active`,
            status: "completed" as const,
            action: "/placements",
          },
        ]
      : []),
  ].slice(0, 10);

  const [clickedId, setClickedId] = useState<string | null>(null);

  return (
    <div className={cn("admin-card-dark", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Action Queue
        </h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/15">
            <Clock className="w-3 h-3" />
            {totalPending}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {items.length > 0 ? (
          items.map((item) => {
            const isClicked = clickedId === item.id;
            const StatusIcon =
              item.status === "completed"
                ? CheckCircle2
                : item.status === "warning"
                  ? AlertCircle
                  : Clock;

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
                  "flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200",
                  isClicked
                    ? "bg-white/10"
                    : "hover:bg-white/10 active:bg-white/5",
                )}
                aria-label={`${item.title}: ${item.subtitle}`}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/20">
                  <StatusIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] truncate mt-0.5 opacity-70">
                    {item.subtitle}
                  </p>
                </div>
                {item.action && (
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-40" />
                )}
              </button>
            );
          })
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm font-medium">
              No pending actions
            </p>
            <p className="text-xs mt-1 opacity-70">
              Everything is up to date
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
