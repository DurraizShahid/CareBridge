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
import { Button } from "@/components/ui/button";
import {
  getDashboardStats,
  getRecentActivity,
  getPlacements,
  getPatients,
  getFacilities,
} from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { currentUser } from "@/lib/data";
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

const statusConfig: Record<string, { label: string; className: string }> = {
  assessment: { label: "Assessment", className: "bg-health/10 text-health" },
  searching: { label: "Searching", className: "bg-primary/10 text-primary" },
  "pending-approval": { label: "Pending Approval", className: "bg-warmth/10 text-warmth" },
  approved: { label: "Approved", className: "bg-health/10 text-health" },
  "in-progress": { label: "In Progress", className: "bg-primary/10 text-primary" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
};

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  placement: ClipboardList,
  assessment: FileSearch,
  admission: Users,
  discharge: Users,
  note: ClipboardList,
  milestone: CalendarCheck,
};

export default async function HospitalStaffDashboard() {
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

  const myPatients = scopedPatients.filter((p) => p.socialWorkerId === currentUser.id);
  const pendingPlacements = scopedPlacements.filter((p) => p.status === "pending-approval");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Staff Dashboard"
        description={`Welcome back, ${currentUser.firstName}. ${currentUser.title} at ${currentUser.department}.`}
      >
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/patients" />}
          >
            <UserPlus data-icon="inline-start" />
            Add Patient
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/placements" />}
          >
            <Plus data-icon="inline-start" />
            New Placement
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="My Caseload"
          value={myPatients.length}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Active Placements"
          value={scopedStats.activePlacements}
          icon={ClipboardList}
          variant="health"
          trend={{ value: `${pendingPlacements.length} pending`, positive: false }}
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
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              My Caseload
            </h2>
            <Button
              variant="link"
              size="sm"
              nativeButton={false}
              render={<Link href="/patients" />}
              className="h-auto p-0 text-health hover:text-health/80"
            >
              View all <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {myPatients.map((patient) => {
              const patientPlacement = scopedPlacements.find((p) => p.patientId === patient.id);
              return (
                <div
                  key={patient.id}
                  className="group rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-card-foreground">
                          {patient.firstName} {patient.lastName}
                        </span>
                        <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
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
                        <span className="text-border">&middot;</span>
                        <span>
                          Admitted {formatRelativeTime(patient.admissionDate)}
                        </span>
                        {patientPlacement && (
                          <>
                            <span className="text-border">&middot;</span>
                            <span
                              className={[
                                "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                statusConfig[patientPlacement.status]?.className ?? "bg-muted text-muted-foreground",
                              ].join(" ")}
                            >
                              {statusConfig[patientPlacement.status]?.label ?? patientPlacement.status}
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

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              Pending Approvals
            </h2>
            {pendingPlacements.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pendingPlacements.map((plc) => {
                  const patient = scopedPatients.find((p) => p.id === plc.patientId);
                  const facility = plc.selectedFacilityId
                    ? scopedFacilities.find((f) => f.id === plc.selectedFacilityId)
                    : null;
                  return (
                    <div
                      key={plc.id}
                      className="group rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-card-foreground">
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
                        <span className="shrink-0 rounded-md bg-warmth/10 px-2 py-0.5 text-[11px] font-semibold text-warmth">
                          Pending
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed bg-card/50 p-8">
                <p className="text-sm text-muted-foreground">No pending approvals</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              Recent Activity
            </h2>
            <div className="relative flex flex-col">
              <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-border" />
              {scopedActivity.slice(0, 4).map((event) => {
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
          </div>
        </section>
      </div>
    </div>
  );
}
