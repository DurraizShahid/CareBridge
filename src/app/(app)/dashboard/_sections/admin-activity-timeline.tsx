import { formatRelativeTimeWithFallback } from "./shared";
import type { ActivityEvent } from "@/types";
import { ClipboardList, FileSearch, Users as UsersIcon, CalendarCheck } from "lucide-react";
import Link from "next/link";

interface AdminActivityTimelineProps {
  activities: ActivityEvent[];
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  placement: ClipboardList,
  assessment: FileSearch,
  admission: UsersIcon,
  discharge: UsersIcon,
  milestone: CalendarCheck,
  note: ClipboardList,
};

const colorMap: Record<string, string> = {
  placement: "bg-sa-subtle-primary text-sa-primary",
  assessment: "bg-sa-subtle-accent text-sa-accent",
  admission: "bg-sa-subtle-primary text-sa-primary",
  discharge: "bg-sa-muted text-sa-muted-foreground",
  milestone: "bg-sa-accent/10 text-sa-accent",
  note: "bg-sa-subtle-primary text-sa-primary",
};

const defaultIcon = ClipboardList;

export default function AdminActivityTimeline({
  activities,
  className = "",
}: AdminActivityTimelineProps) {
  const displayActivities = (activities ?? []).slice(0, 8);

  return (
    <div className={`admin-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-sa-foreground">Recent Platform Activity</h3>
        <Link
          href="/dashboard"
          className="text-xs text-sa-muted-foreground hover:text-sa-primary transition-colors"
        >
          View all
        </Link>
      </div>

      {displayActivities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayActivities.map((event) => {
            const Icon = iconMap[event.type] ?? defaultIcon;
            const colorClass = colorMap[event.type] ?? "bg-sa-muted text-sa-muted-foreground";
            const href = event.patientId
              ? `/patients/${event.patientId}`
              : "/dashboard";
            return (
              <Link
                key={event.id}
                href={href}
                className="flex items-start gap-3 p-3 rounded-2xl border border-sa-border/40 hover:border-sa-border hover:bg-sa-muted/50 transition-all group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sa-foreground truncate group-hover:text-sa-primary transition-colors">{event.title}</p>
                  <p className="text-xs text-sa-muted-foreground truncate mt-0.5">{event.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {event.patientName && (
                      <span className="text-[11px] text-sa-muted-foreground/70 truncate">{event.patientName}</span>
                    )}
                    <span className="text-[11px] text-sa-muted-foreground/50">
                      {formatRelativeTimeWithFallback(event.timestamp)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ActivityEmptyIcon />
          <p className="text-sm font-medium text-sa-muted-foreground mt-3">No recent activity</p>
          <p className="text-xs text-sa-muted-foreground mt-1">
            Platform activity will appear here as events occur
          </p>
        </div>
      )}
    </div>
  );
}

function ActivityEmptyIcon() {
  return (
    <div className="w-12 h-12 rounded-2xl bg-sa-muted flex items-center justify-center">
      <ClipboardList className="w-6 h-6 text-sa-muted-foreground" />
    </div>
  );
}
