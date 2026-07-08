import {
  Users,
  ClipboardList,
  FileSearch,
  Building2,
  CalendarCheck,
  Clock,
  Plus,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  dashboardStats,
  recentActivity,
  placements,
  patients,
  facilities,
  currentUser,
} from "@/lib/data";
import Link from "next/link";

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
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "pending-approval":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "approved":
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "in-progress":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
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

export default function HospitalStaffDashboard() {
  const myPatients = patients.filter((p) => p.socialWorkerId === currentUser.id);
  const pendingPlacements = placements.filter((p) => p.status === "pending-approval");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hospital Staff Dashboard"
        description={`Welcome back, ${currentUser.firstName}. ${currentUser.title} at ${currentUser.department}.`}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/patients"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:translate-y-px"
          >
            <UserPlus className="h-4 w-4" />
            Add Patient
          </Link>
          <Link
            href="/placements"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted active:translate-y-px"
          >
            <Plus className="h-4 w-4" />
            New Placement
          </Link>
        </div>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="My Caseload"
          value={myPatients.length}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Active Placements"
          value={dashboardStats.activePlacements}
          icon={ClipboardList}
          variant="health"
          trend={{ value: `${pendingPlacements.length} pending`, positive: false }}
        />
        <StatCard
          title="Pending Assessments"
          value={dashboardStats.pendingAssessments}
          icon={FileSearch}
          variant="warmth"
        />
        <StatCard
          title="Available Facilities"
          value={dashboardStats.facilitiesAvailable}
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Placements This Month"
          value={dashboardStats.placementsThisMonth}
          icon={CalendarCheck}
          variant="health"
        />
        <StatCard
          title="Avg. Placement Time"
          value={`${dashboardStats.averagePlacementTimeDays}d`}
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* My Caseload */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">
              My Caseload
            </h2>
            <Link
              href="/patients"
              className="flex items-center gap-1 text-sm font-medium text-health hover:text-health/80"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {myPatients.map((patient) => {
              const patientPlacement = placements.find((p) => p.patientId === patient.id);
              return (
                <div
                  key={patient.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-card-foreground">
                          {patient.firstName} {patient.lastName}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {patient.age}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {patient.primaryDiagnosis}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {patient.careLevelRequired.replace(/-/g, " ")}
                        </span>
                        <span>&middot;</span>
                        <span>
                          Admitted {formatRelativeTime(patient.admissionDate)}
                        </span>
                        {patientPlacement && (
                          <>
                            <span>&middot;</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(patientPlacement.status)}`}>
                              {statusLabel(patientPlacement.status)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pending Approvals & Recent Activity */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
            Pending Approvals
          </h2>
          {pendingPlacements.length > 0 ? (
            <div className="space-y-3">
              {pendingPlacements.map((plc) => {
                const patient = patients.find((p) => p.id === plc.patientId);
                const facility = plc.selectedFacilityId
                  ? facilities.find((f) => f.id === plc.selectedFacilityId)
                  : null;
                return (
                  <div
                    key={plc.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-card-foreground">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {facility ? facility.name : "Matching in progress"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {plc.careLevel.replace(/-/g, " ")} &middot;{" "}
                          {plc.priority} priority
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Pending
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            </div>
          )}

          {/* Recent Activity */}
          <h2 className="mb-4 mt-8 font-heading text-lg font-bold text-foreground">
            Recent Activity
          </h2>
          <div className="space-y-1">
            {recentActivity.slice(0, 4).map((event) => {
              const Icon = activityIcons[event.type] ?? ClipboardList;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-health/10">
                    <Icon className="h-4 w-4 text-health" />
                  </div>
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
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
