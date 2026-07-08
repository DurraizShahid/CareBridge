import {
  Users,
  Building2,
  ClipboardList,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Shield,
  BarChart3,
  Building,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getSuperAdminDashboardStats,
  getUsers,
  getRecentActivity,
  getFacilities,
} from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";

const roleLabels: Record<string, string> = {
  "social-worker": "Social Worker",
  "social_worker": "Social Worker",
  "discharge-planner": "Discharge Planner",
  "discharge_planner": "Discharge Planner",
  administrator: "Administrator",
  "facility-coordinator": "Facility Coordinator",
  "facility_coordinator": "Facility Coordinator",
  superadmin: "Super Admin",
  customer: "Customer",
};

const roleColors: Record<string, string> = {
  "social-worker": "bg-health/10 text-health",
  "social_worker": "bg-health/10 text-health",
  "discharge-planner": "bg-health/10 text-health",
  "discharge_planner": "bg-health/10 text-health",
  administrator: "bg-primary/10 text-primary",
  "facility-coordinator": "bg-warmth/10 text-warmth",
  "facility_coordinator": "bg-warmth/10 text-warmth",
  superadmin: "bg-destructive/10 text-destructive",
  customer: "bg-muted text-muted-foreground",
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

function SimpleBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <Progress
      value={pct}
      className={cn(
        "[&_[data-slot=progress-track]]:h-2.5",
        color === "bg-health" && "[&_[data-slot=progress-indicator]]:bg-health",
        color === "bg-primary" && "[&_[data-slot=progress-indicator]]:bg-primary",
      )}
    />
  );
}

export default async function SuperAdminDashboard() {
  const org = await getServerOrganization();
  const organizationId = org?.organizationId ?? "org-001";
  const role = org?.role ?? "customer";
  const stats = await getSuperAdminDashboardStats();
  const users = await getUsers(organizationId, role);
  const recentActivity = await getRecentActivity(organizationId, role);
  const facilities = await getFacilities(organizationId, role);
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Super Admin"
        description="Platform-wide overview, system metrics, and user management."
      >
        <Badge variant="outline" className="gap-2 text-muted-foreground">
          <Shield data-icon="inline-start" className="text-health" />
          Admin Access
        </Badge>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} variant="default" />
        <StatCard title="Hospitals" value={stats.totalHospitals} icon={Building} variant="default" />
        <StatCard title="Facilities" value={stats.totalFacilities} icon={Building2} variant="default" />
        <StatCard title="Total Placements" value={stats.totalPlacements} icon={ClipboardList} variant="health" />
        <StatCard
          title="Completed"
          value={stats.completedPlacements}
          icon={CheckCircle2}
          variant="health"
          trend={{ value: `${stats.activePlacements} active`, positive: true }}
        />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={AlertTriangle} variant="info" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              <BarChart3 className="h-3.5 w-3.5 text-health" />
              Placements by Month
            </h2>
            <span className="text-xs text-muted-foreground">
              Avg {stats.averagePlacementTimeDays}d placement time
            </span>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              {stats.placementsByMonth.map((item) => {
                const maxCount = Math.max(...stats.placementsByMonth.map((m) => m.count));
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="w-8 text-right text-xs font-medium text-foreground">
                      {item.month}
                    </span>
                    <div className="flex-1">
                      <SimpleBar value={item.count} max={maxCount} color="bg-health" />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-muted-foreground">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              <UserCheck className="h-3.5 w-3.5 text-health" />
              Users by Role
            </h2>
            <span className="text-xs text-muted-foreground">
              {stats.totalUsers} total
            </span>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              {Object.entries(stats.usersByRole).map(([userRole, count]) => {
                const maxRoleCount = Math.max(...Object.values(stats.usersByRole));
                return (
                  <div key={userRole} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex w-28 shrink-0 items-center justify-start rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        roleColors[userRole] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {roleLabels[userRole] ?? userRole}
                    </span>
                    <div className="flex-1">
                      <SimpleBar value={count} max={maxRoleCount} color="bg-primary" />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              Recent Users
            </h2>
            <Button
              variant="link"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/users" />}
              className="h-auto p-0 text-health hover:text-health/80"
            >
              View all <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-card-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      roleColors[user.role] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {roleLabels[user.role] ?? user.role}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(user.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              Recent Platform Activity
            </h2>
            <div className="relative flex flex-col">
              <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-border" />
              {recentActivity.slice(0, 4).map((event) => (
                <div key={event.id} className="group relative flex items-start gap-4 pb-5 last:pb-0">
                  <span className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-health/10 text-health ring-4 ring-background transition-colors group-hover:bg-health/20">
                    <Activity className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm text-foreground">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.patientName} &middot; {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              Platform Health
            </h2>
            <div className="rounded-xl border bg-gradient-to-br from-card to-primary/[0.02] p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">Facility Utilization</p>
                  <p className="font-heading text-2xl font-bold text-foreground">
                    {stats.facilityUtilizationRate}%
                  </p>
                  <SimpleBar value={stats.facilityUtilizationRate} max={100} color="bg-health" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">Avg Placement Time</p>
                  <p className="font-heading text-2xl font-bold text-foreground">
                    {stats.averagePlacementTimeDays}d
                  </p>
                  <SimpleBar value={stats.averagePlacementTimeDays * 20} max={100} color="bg-primary" />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{stats.totalHospitals}</p>
                  <p className="text-xs text-muted-foreground">Hospitals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{facilities.length}</p>
                  <p className="text-xs text-muted-foreground">Facilities</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{stats.totalPlacements}</p>
                  <p className="text-xs text-muted-foreground">Total Placements</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
