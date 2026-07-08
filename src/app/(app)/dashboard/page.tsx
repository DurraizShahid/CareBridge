import {
  Users,
  ClipboardList,
  FileSearch,
  Building2,
  CalendarCheck,
  Clock,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  getDashboardStats,
  getRecentActivity,
  getPlacements,
  getPatients,
  getFacilities,
} from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMinutes = Math.floor((now - then) / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString();
}

const statusConfig: Record<string, { label: string; className: string }> = {
  assessment: {
    label: "Assessment",
    className: "bg-health/10 text-health",
  },
  searching: {
    label: "Searching",
    className: "bg-primary/10 text-primary",
  },
  "pending-approval": {
    label: "Pending Approval",
    className: "bg-warmth/10 text-warmth",
  },
  approved: {
    label: "Approved",
    className: "bg-health/10 text-health",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-primary/10 text-primary",
  },
  completed: {
    label: "Completed",
    className: "bg-muted text-muted-foreground",
  },
};

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  placement: ClipboardList,
  assessment: FileSearch,
  admission: Users,
  discharge: Users,
  note: ClipboardList,
  milestone: CalendarCheck,
};

export default async function DashboardPage() {
  const org = await getServerOrganization();
  const organizationId = org?.organizationId ?? "org-001";
  const role = org?.role ?? "customer";

  const [scopedStats, scopedPlacements, scopedPatients, scopedFacilities, scopedActivity] = await Promise.all([
    getDashboardStats(organizationId, role),
    getPlacements(organizationId, role),
    getPatients(organizationId, role),
    getFacilities(organizationId, role),
    getRecentActivity(organizationId, role),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's your organization's overview."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Active Patients"
          value={scopedStats.activePatients}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Active Placements"
          value={scopedStats.activePlacements}
          icon={ClipboardList}
          variant="health"
          trend={{ value: "2 new today", positive: true }}
        />
        <StatCard
          title="Pending Assessments"
          value={scopedStats.pendingAssessments}
          icon={FileSearch}
          variant="info"
        />
        <StatCard
          title="Available Facilities"
          value={scopedStats.facilitiesAvailable}
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Placements This Month"
          value={scopedStats.placementsThisMonth}
          icon={CalendarCheck}
          variant="health"
        />
        <StatCard
          title="Avg. Placement Time"
          value={`${scopedStats.averagePlacementTimeDays}d`}
          icon={Clock}
          variant="default"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
            Active Placements
          </h2>
          <div className="flex flex-col gap-3">
            {scopedPlacements.map((plc) => {
              const patient = scopedPatients.find((p) => p.id === plc.patientId);
              const facility = plc.selectedFacilityId
                ? scopedFacilities.find((f) => f.id === plc.selectedFacilityId)
                : null;
              const status = statusConfig[plc.status] ?? statusConfig.completed;
              return (
                <div
                  key={plc.id}
                  className="group rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-card-foreground">
                          {patient?.firstName} {patient?.lastName}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            status.className,
                          ].join(" ")}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {plc.careLevel.replace("-", " ")} &middot;{" "}
                        {facility ? facility.name : "Matching in progress"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-warmth/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-warmth">
                      {plc.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
            Recent Activity
          </h2>
          <div className="relative flex flex-col">
            <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-border" />
            {scopedActivity.map((event) => {
              const Icon = activityIcons[event.type] ?? ClipboardList;
              return (
                <div key={event.id} className="group relative flex items-start gap-4 pb-5 last:pb-0">
                  <span className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-health/10 text-health ring-4 ring-background transition-colors group-hover:bg-health/20">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.description}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                      {event.patientName} &middot;{" "}
                      {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
