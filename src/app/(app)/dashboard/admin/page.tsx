import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  Users,
  Building,
  Building2,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  UserCheck,
  ArrowRight,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import {
  getSuperAdminDashboardStats,
  getUsers,
  getRecentActivity,
  getFacilities,
} from "@/lib/data-access";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  "social-worker": "Social Worker",
  social_worker: "Social Worker",
  "discharge-planner": "Discharge Planner",
  discharge_planner: "Discharge Planner",
  administrator: "Administrator",
  "facility-coordinator": "Facility Coordinator",
  facility_coordinator: "Facility Coordinator",
  superadmin: "Super Admin",
  customer: "Customer",
};

const roleBadgeStyles: Record<string, string> = {
  "social-worker": "bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]",
  social_worker: "bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]",
  "discharge-planner": "bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]",
  discharge_planner: "bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]",
  administrator: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  "facility-coordinator": "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]",
  facility_coordinator: "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]",
  superadmin: "bg-[#0D1B17] text-white border border-[#0D1B17]",
  customer: "bg-muted text-muted-foreground border border-border",
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
  return formatDate(isoString);
}

export default async function AdminDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const org = await getServerOrganization();
  if (!org?.organizationId) redirect("/onboarding");

  const role = org.role ?? "customer";
  if (!roleHasPermission(role, "dashboard:admin")) {
    redirect("/dashboard");
  }

  const [stats, users, recentActivity, facilities] = await Promise.all([
    getSuperAdminDashboardStats(),
    getUsers(org.organizationId, role),
    getRecentActivity(org.organizationId, role),
    getFacilities(org.organizationId, role),
  ]);

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const maxMonthCount = Math.max(1, ...stats.placementsByMonth.map((m) => m.count));
  const maxRoleCount = Math.max(1, ...Object.values(stats.usersByRole));

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
        title="Platform Administration"
        description="System-wide governance, cross-facility telemetry, and network user authorization."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Platform Administration" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98]"
            render={<Link href="/dashboard/users" />}
          >
            <Users className="size-3.5 text-[#53665E]" />
            Manage Users
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98]"
            render={<Link href="/dashboard/facility-network" />}
          >
            <Building2 className="size-3.5" />
            Facility Network
          </Button>
        </div>
      </PageHeader>

      {/* ── Operational Scope & Live Telemetry Pills ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <span className="size-1.5 rounded-full bg-[#245C52] animate-pulse" />
          {todayFormatted}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Platform Administrator Scope
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20">
          All Network Regions
        </span>
      </div>

      {/* ── Top Key Metric KPI Cards ── */}
      <section aria-labelledby="admin-telemetry-heading" className="flex flex-col gap-3">
        <h2 id="admin-telemetry-heading" className="sr-only">
          Platform Key Performance Indicators
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total Accounts"
            value={stats.totalUsers}
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Partner Hospitals"
            value={stats.totalHospitals}
            icon={Building}
            variant="info"
          />
          <StatCard
            title="Care Facilities"
            value={stats.totalFacilities}
            icon={Building2}
            variant="facility"
          />
          <StatCard
            title="Total Placements"
            value={stats.totalPlacements}
            icon={ClipboardList}
            variant="health"
          />
          <StatCard
            title="Completed"
            value={stats.completedPlacements}
            icon={CheckCircle2}
            variant="health"
            trend={{ value: `${stats.activePlacements} active`, positive: true }}
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={AlertTriangle}
            variant="orange"
          />
        </div>
      </section>

      {/* ── Main Two-Column Operational Surface ── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Placement Velocity + Recent Users */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Monthly Placement Velocity */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#DCE5DE]/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl sm:text-2xl font-normal text-[#0D1B17]">
                    Placement Volume Velocity
                  </CardTitle>
                  <CardDescription className="text-xs text-[#53665E] mt-0.5">
                    Rolling 6-month placement distribution across licensed network facilities
                  </CardDescription>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#53665E]">
                  <BarChart3 className="size-3.5 text-[#245C52]" />
                  <span>Avg {stats.averagePlacementTimeDays}d turnaround</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {stats.placementsByMonth.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#53665E]">
                  No placement trajectory data available.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {stats.placementsByMonth.map((item) => {
                    const percentage = Math.round((item.count / maxMonthCount) * 100);
                    return (
                      <div key={item.month} className="flex items-center gap-3">
                        <span className="w-12 text-xs font-medium text-[#203E39] shrink-0">
                          {item.month}
                        </span>
                        <div className="flex-1 bg-[#EDF2EC] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#245C52] h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(4, percentage)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold tabular-nums text-[#0D1B17]">
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Accounts */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#DCE5DE]/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl sm:text-2xl font-normal text-[#0D1B17]">
                    Recent System Accounts
                  </CardTitle>
                  <CardDescription className="text-xs text-[#53665E] mt-0.5">
                    Newly provisioned clinical coordinators and care teams
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold text-[#245C52] hover:text-[#19473F] hover:bg-[#EDF2EC] rounded-full px-3"
                  render={<Link href="/dashboard/users" />}
                >
                  View all <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[#DCE5DE]/60">
              {recentUsers.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#53665E]">
                  No user accounts registered.
                </div>
              ) : (
                recentUsers.map((account) => {
                  const initials = `${account.firstName?.[0] ?? ""}${account.lastName?.[0] ?? ""}`.toUpperCase() || "U";
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 transition-colors hover:bg-[#FAFBF8]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="size-9 rounded-full bg-[#EDF2EC] text-[#245C52] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#DCE5DE]">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#0D1B17] truncate">
                            {account.firstName} {account.lastName}
                          </p>
                          <p className="text-xs text-[#53665E] truncate">{account.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium",
                            roleBadgeStyles[account.role] ?? "bg-muted text-muted-foreground",
                          )}
                        >
                          {roleLabels[account.role] ?? account.role}
                        </span>
                        <span className="text-xs text-[#53665E] tabular-nums hidden sm:inline-block">
                          {formatRelativeTime(account.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Roles Breakdown + Platform Health + Audit Timeline */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Users by Role Breakdown */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#DCE5DE]/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl sm:text-2xl font-normal text-[#0D1B17]">
                    Users by Role
                  </CardTitle>
                  <CardDescription className="text-xs text-[#53665E] mt-0.5">
                    {stats.totalUsers} total provisioned identities
                  </CardDescription>
                </div>
                <UserCheck className="size-4 text-[#245C52]" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col gap-3.5">
                {Object.entries(stats.usersByRole).map(([userRole, count]) => {
                  const pct = Math.round((count / maxRoleCount) * 100);
                  return (
                    <div key={userRole} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex w-36 shrink-0 items-center justify-start rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          roleBadgeStyles[userRole] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {roleLabels[userRole] ?? userRole}
                      </span>
                      <div className="flex-1 bg-[#EDF2EC] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#255DCE] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-semibold tabular-nums text-[#0D1B17]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Platform Health & Capacity */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#245C52]" />
                <h3 className="font-serif text-lg font-medium text-[#0D1B17]">
                  Platform Health &amp; Capacity
                </h3>
              </div>
              <span className="text-xs text-[#53665E]">Live telemetry</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]">
                <p className="text-xs text-[#53665E]">Facility Utilization</p>
                <p className="font-serif text-2xl font-normal text-[#0D1B17] tabular-nums">
                  {stats.facilityUtilizationRate}%
                </p>
                <div className="bg-[#EDF2EC] h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-[#245C52] h-full rounded-full"
                    style={{ width: `${Math.min(100, stats.facilityUtilizationRate)}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]">
                <p className="text-xs text-[#53665E]">Avg Turnaround</p>
                <p className="font-serif text-2xl font-normal text-[#0D1B17] tabular-nums">
                  {stats.averagePlacementTimeDays}d
                </p>
                <div className="bg-[#EDF2EC] h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-[#255DCE] h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (stats.averagePlacementTimeDays / 14) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-4 bg-[#DCE5DE]" />

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-[#EDF2EC]/60">
                <p className="text-base font-semibold text-[#0D1B17] tabular-nums">
                  {stats.totalHospitals}
                </p>
                <p className="text-[11px] text-[#53665E]">Hospitals</p>
              </div>
              <div className="p-2 rounded-lg bg-[#EDF2EC]/60">
                <p className="text-base font-semibold text-[#0D1B17] tabular-nums">
                  {facilities.length}
                </p>
                <p className="text-[11px] text-[#53665E]">Facilities</p>
              </div>
              <div className="p-2 rounded-lg bg-[#EDF2EC]/60">
                <p className="text-base font-semibold text-[#0D1B17] tabular-nums">
                  {stats.totalPlacements}
                </p>
                <p className="text-[11px] text-[#53665E]">Placements</p>
              </div>
            </div>
          </Card>

          {/* Recent Platform Audit Activity */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#DCE5DE]/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl sm:text-2xl font-normal text-[#0D1B17]">
                    Recent System Activity
                  </CardTitle>
                  <CardDescription className="text-xs text-[#53665E] mt-0.5">
                    Live operational audit stream across facilities
                  </CardDescription>
                </div>
                <Activity className="size-4 text-[#245C52]" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {recentActivity.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#53665E]">
                  No recent system activity recorded.
                </div>
              ) : (
                <div className="relative flex flex-col pl-2">
                  <div className="absolute left-[17px] top-3 h-[calc(100%-20px)] w-px bg-[#DCE5DE]" />
                  {recentActivity.slice(0, 5).map((event) => (
                    <div key={event.id} className="relative flex items-start gap-3.5 pb-4 last:pb-0">
                      <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[#245C52] border border-[#DCE5DE] ring-4 ring-white">
                        <Activity className="size-3" />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-xs font-semibold text-[#0D1B17] truncate">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-[#53665E]">
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
