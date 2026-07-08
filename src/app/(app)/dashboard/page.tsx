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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

function statusBadgeClass(status: string): string {
  switch (status) {
    case "assessment":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "searching":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";
    case "pending-approval":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "approved":
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "assessment":
      return "Assessment";
    case "searching":
      return "Searching";
    case "pending-approval":
      return "Pending Approval";
    case "approved":
      return "Approved";
    case "in-progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

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
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's your organization's overview."
      />

      {/* Stats Grid */}
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

      {/* Two-column layout: Active Placements + Recent Activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Active Placements */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
            Active Placements
          </h2>
          <div className="space-y-3">
            {scopedPlacements.map((plc) => {
              const patient = scopedPatients.find((p) => p.id === plc.patientId);
              const facility = plc.selectedFacilityId
                ? scopedFacilities.find((f) => f.id === plc.selectedFacilityId)
                : null;
              return (
                <Card
                  key={plc.id}
                  className="transition-all hover:shadow-md"
                >
                  <CardContent className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-card-foreground">
                          {patient?.firstName} {patient?.lastName}
                        </span>
                        <Badge className={statusBadgeClass(plc.status)}>
                          {statusLabel(plc.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {plc.careLevel.replace("-", " ")} &middot;{" "}
                        {facility ? facility.name : "Matching in progress"}
                      </p>
                    </div>
                    <Badge
                      className={
                        plc.priority === "high" || plc.priority === "emergency"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {plc.priority}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
            Recent Activity
          </h2>
          <div className="space-y-1">
            {scopedActivity.map((event) => {
              const Icon = activityIcons[event.type] ?? ClipboardList;
              return (
                <Card
                  key={event.id}
                  size="sm"
                  className="border-transparent bg-transparent shadow-none transition-colors hover:bg-muted/50"
                >
                  <CardContent className="flex items-start gap-4">
                    <Badge
                      variant="secondary"
                      className="h-8 w-8 rounded-full bg-health/10 p-0 text-health"
                    >
                      <Icon className="h-4 w-4" />
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/60">
                        {event.patientName} &middot;{" "}
                        {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
