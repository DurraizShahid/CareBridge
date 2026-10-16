import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  Users,
  ClipboardList,
  CalendarCheck,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import {
  getDashboardStats,
  getRecentActivity,
  getPlacements,
  getPatients,
  getFacilities,
} from "@/lib/data-access";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusConfig: Record<string, { label: string; className: string }> = {
  assessment: {
    label: "Assessment",
    className: "bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]",
  },
  searching: {
    label: "Searching",
    className: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  },
  "pending-approval": {
    label: "Pending Approval",
    className: "bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20",
  },
  pending_approval: {
    label: "Pending Approval",
    className: "bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20",
  },
  approved: {
    label: "Approved",
    className: "bg-[#245C52]/10 text-[#245C52] border border-[#245C52]/20",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  },
  completed: {
    label: "Completed",
    className: "bg-[#EDF2EC] text-[#53665E] border border-[#DCE5DE]",
  },
};

export default async function StaffDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const org = await getServerOrganization();
  if (!org?.organizationId) redirect("/onboarding");

  const role = org.role ?? "customer";
  if (!roleHasPermission(role, "dashboard:staff")) {
    redirect("/dashboard");
  }

  const [stats, scopedPlacements, scopedPatients, scopedFacilities, scopedActivity] =
    await Promise.all([
      getDashboardStats(org.organizationId, role),
      getPlacements(org.organizationId, role),
      getPatients(org.organizationId, role),
      getFacilities(org.organizationId, role),
      getRecentActivity(org.organizationId, role),
    ]);

  const assignedPatients = scopedPatients.filter((p) => p.socialWorkerId === user.id);
  const myPatients = assignedPatients.length > 0 ? assignedPatients : scopedPatients.slice(0, 8);
  const isAllOrgCaseload = assignedPatients.length === 0 && scopedPatients.length > 0;

  const pendingPlacements = scopedPlacements.filter(
    (p) => p.status === "pending-approval",
  );

  const userName = user.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user.username ?? "Staff Member");

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── Page Header ── */}
      <PageHeader
        title={`Welcome back, ${userName}.`}
        description="Active patient care pathways, incoming placement approvals, and daily clinical coordination tasks."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Staff Caseload" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98]"
            render={<Link href="/patients" />}
          >
            <Users className="size-3.5 text-[#53665E]" />
            Patient Directory
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98]"
            render={<Link href="/placements" />}
          >
            <Plus className="size-3.5" />
            New Placement
          </Button>
        </div>
      </PageHeader>

      {/* ── Status Pills ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <span className="size-1.5 rounded-full bg-[#245C52] animate-pulse" />
          {todayFormatted}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Care Coordination Active
        </div>
        {isAllOrgCaseload && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20">
            Organization Caseload View
          </span>
        )}
      </div>

      {/* ── Metric KPI Cards ── */}
      <section aria-labelledby="staff-metrics-heading" className="flex flex-col gap-3">
        <h2 id="staff-metrics-heading" className="sr-only">
          Staff Operational Metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Caseload"
            value={myPatients.length}
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Pending Approvals"
            value={pendingPlacements.length}
            icon={Clock}
            variant="orange"
          />
          <StatCard
            title="Placements This Month"
            value={stats.placementsThisMonth}
            icon={CalendarCheck}
            variant="health"
          />
          <StatCard
            title="Avg. Turnaround"
            value={`${stats.averagePlacementTimeDays}d`}
            icon={Clock}
            variant="default"
          />
        </div>
      </section>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: My Caseload */}
        <section aria-labelledby="caseload-heading" className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#245C52]" />
              <h2 id="caseload-heading" className="font-serif text-xl sm:text-2xl font-normal text-[#0D1B17]">
                Active Patient Caseload
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
                {myPatients.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-[#245C52] hover:text-[#19473F] hover:bg-[#EDF2EC] rounded-full px-3"
              render={<Link href="/patients" />}
            >
              View all <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          {myPatients.length === 0 ? (
            <Card className="rounded-2xl border border-[#DCE5DE] bg-white p-8 shadow-sm">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Users className="size-8 text-[#53665E]/50" />
                  </EmptyMedia>
                  <EmptyTitle className="font-serif text-lg font-medium text-[#0D1B17]">
                    No patients in active caseload
                  </EmptyTitle>
                  <EmptyDescription className="text-xs text-[#53665E] max-w-sm">
                    New patient referrals and intake assessments assigned to you will appear here.
                  </EmptyDescription>
                </EmptyHeader>
                <div className="mt-4 flex justify-center">
                  <Button
                    size="sm"
                    className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F]"
                    render={<Link href="/patients" />}
                  >
                    Open Patient Directory
                  </Button>
                </div>
              </Empty>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {myPatients.map((patient) => {
                const patientPlacement = scopedPlacements.find((p) => p.patientId === patient.id);
                return (
                  <Card
                    key={patient.id}
                    className="rounded-2xl border border-[#DCE5DE] bg-white p-4 shadow-sm hover:border-[#245C52]/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href="/patients"
                            className="truncate text-sm font-semibold text-[#0D1B17] hover:text-[#245C52] transition-colors"
                          >
                            {patient.firstName} {patient.lastName}
                          </Link>
                          <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
                            Age {patient.age}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#53665E]">
                          {patient.primaryDiagnosis}
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[#53665E]">
                          <span className="font-medium text-[#203E39] capitalize">
                            {patient.careLevelRequired.replace(/-/g, " ")}
                          </span>
                          <span>&middot;</span>
                          <span>Admitted {formatRelativeTime(patient.admissionDate)}</span>
                          {patientPlacement && (
                            <>
                              <span>&middot;</span>
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                                  statusConfig[patientPlacement.status]?.className ??
                                    "bg-muted text-muted-foreground",
                                )}
                              >
                                {statusConfig[patientPlacement.status]?.label ?? patientPlacement.status}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs font-medium text-[#245C52] hover:bg-[#EDF2EC]"
                        render={<Link href="/patients" />}
                      >
                        Chart
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Pending Approvals & Recent Clinical Activity */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Pending Approvals */}
          <section aria-labelledby="pending-heading" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#C05621]" />
                <h2 id="pending-heading" className="font-serif text-xl sm:text-2xl font-normal text-[#0D1B17]">
                  Pending Approvals
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20">
                  {pendingPlacements.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-[#245C52] hover:text-[#19473F] hover:bg-[#EDF2EC] rounded-full px-3"
                render={<Link href="/placements" />}
              >
                Review all
              </Button>
            </div>

            {pendingPlacements.length === 0 ? (
              <Card className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-[#EDF2EC] text-[#245C52] flex items-center justify-center shrink-0 border border-[#DCE5DE]">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#0D1B17]">
                      Approvals queue is clear
                    </h3>
                    <p className="text-xs text-[#53665E] mt-0.5">
                      No pending placement referrals requiring clinical sign-off at this time.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingPlacements.map((plc) => {
                  const patient = scopedPatients.find((p) => p.id === plc.patientId);
                  const placementFacilityId = plc.facilityId ?? plc.selectedFacilityId;
                  const facility = placementFacilityId
                    ? scopedFacilities.find((f) => f.id === placementFacilityId)
                    : null;
                  return (
                    <Card
                      key={plc.id}
                      className="rounded-2xl border border-[#DCE5DE] bg-white p-4 shadow-sm hover:border-[#245C52]/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#0D1B17]">
                            {patient ? `${patient.firstName} ${patient.lastName}` : "Patient Referral"}
                          </p>
                          <p className="mt-0.5 text-xs text-[#53665E]">
                            {facility ? facility.name : "Facility matching in progress"}
                          </p>
                          <p className="mt-1.5 text-xs text-[#53665E]">
                            <span className="capitalize">{plc.careLevel.replace(/-/g, " ")}</span>
                            <span> &middot; </span>
                            <span className="capitalize font-medium text-[#203E39]">
                              {plc.priority} priority
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#C05621]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#C05621] border border-[#C05621]/20">
                          Awaiting Review
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Clinical Timeline */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#DCE5DE]/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl sm:text-2xl font-normal text-[#0D1B17]">
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-xs text-[#53665E] mt-0.5">
                    Latest clinical notes, assessments, and patient milestones
                  </CardDescription>
                </div>
                <ClipboardList className="size-4 text-[#245C52]" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {scopedActivity.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#53665E]">
                  No recent clinical activity recorded.
                </div>
              ) : (
                <div className="relative flex flex-col pl-2">
                  <div className="absolute left-[17px] top-3 h-[calc(100%-20px)] w-px bg-[#DCE5DE]" />
                  {scopedActivity.slice(0, 5).map((event) => (
                    <div key={event.id} className="relative flex items-start gap-3.5 pb-4 last:pb-0">
                      <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[#245C52] border border-[#DCE5DE] ring-4 ring-white">
                        <FileText className="size-3" />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-xs font-semibold text-[#0D1B17]">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="text-xs text-[#53665E] line-clamp-1">
                            {event.description}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-[#53665E]">
                          {event.patientName ? `${event.patientName} · ` : ""}
                          {formatRelativeTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
