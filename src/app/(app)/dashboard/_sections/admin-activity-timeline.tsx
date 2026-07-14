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

interface DummyActivity extends ActivityEvent {
  href: string;
}

const dummyActivities: DummyActivity[] = [
  { id: "dummy-1", type: "placement", title: "New placement initiated", description: "Placement request created by intake team", patientName: "Sarah Johnson", patientId: "p-001", timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), userId: "u-001", organizationId: "org-1", href: "/placements/dummy-1" },
  { id: "dummy-2", type: "assessment", title: "Quarterly assessment completed", description: "Routine assessment finalized — all clear", patientName: "James Miller", patientId: "p-002", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), userId: "u-002", organizationId: "org-1", href: "/patients/p-002" },
  { id: "dummy-3", type: "admission", title: "Patient admitted to facility", description: "Admission processed at Oakwood Health", patientName: "Emma Davis", patientId: "p-003", timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), userId: "u-003", organizationId: "org-1", href: "/placements/dummy-3" },
  { id: "dummy-4", type: "milestone", title: "Care plan milestone reached", description: "30-day milestone achieved — on track", patientName: "Robert Chen", patientId: "p-004", timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(), userId: "u-002", organizationId: "org-1", href: "/patients/p-004" },
  { id: "dummy-5", type: "discharge", title: "Discharge summary signed", description: "Discharge documentation completed by Dr. Adams", patientName: "Maria Garcia", patientId: "p-005", timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(), userId: "u-001", organizationId: "org-1", href: "/patients/p-005" },
  { id: "dummy-6", type: "note", title: "Clinical note added", description: "Care note recorded — shift change update", patientName: "David Kim", patientId: "p-006", timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), userId: "u-003", organizationId: "org-1", href: "/patients/p-006" },
  { id: "dummy-7", type: "placement", title: "Bed assignment confirmed", description: "Bed allocation completed at Valley View", patientName: "Olivia Brown", patientId: "p-007", timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(), userId: "u-002", organizationId: "org-1", href: "/placements/dummy-7" },
  { id: "dummy-8", type: "assessment", title: "Initial intake assessment", description: "New patient intake evaluation scheduled", patientName: "William Taylor", patientId: "p-008", timestamp: new Date(Date.now() - 1000 * 60 * 550).toISOString(), userId: "u-003", organizationId: "org-1", href: "/patients/p-008" },
];

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminActivityTimeline({
  activities,
  className = "",
}: AdminActivityTimelineProps) {
  const merged: (ActivityEvent | DummyActivity)[] = [...dummyActivities, ...((activities ?? []) as ActivityEvent[])];
  const displayActivities = merged.slice(0, 8);

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
            const href = "href" in event ? (event as DummyActivity).href : `/patients/${event.patientId}`;
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
                      {formatTimestamp(event.timestamp)}
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
