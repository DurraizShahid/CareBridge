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
import { Card, CardContent } from "@/components/ui/card";
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
  "social-worker": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "social_worker": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "discharge-planner": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "discharge_planner": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  administrator: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "facility-coordinator": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  "facility_coordinator": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  superadmin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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
        "[&_[data-slot=progress-track]]:h-2",
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
  const recentUsers = [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Super Admin Dashboard"
        description="Platform-wide overview, system metrics, and user management."
      >
        <Badge variant="outline" className="gap-2 text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-health" />
          Admin Access
        </Badge>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} variant="default" />
        <StatCard title="Hospitals" value={stats.totalHospitals} icon={Building} variant="default" />
        <StatCard title="Facilities" value={stats.totalFacilities} icon={Building2} variant="default" />
        <StatCard title="Total Placements" value={stats.totalPlacements} icon={ClipboardList} variant="health" />
        <StatCard title="Completed" value={stats.completedPlacements} icon={CheckCircle2} variant="health" trend={{ value: `${stats.activePlacements} active`, positive: true }} />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={AlertTriangle} variant="info" />
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Placements by Month */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-health" />
                Placements by Month
              </span>
            </h2>
            <span className="text-xs text-muted-foreground">
              Avg {stats.averagePlacementTimeDays}d placement time
            </span>
          </div>
          <Card>
            <CardContent className="space-y-4">
              {stats.placementsByMonth.map((item) => {
                const maxCount = Math.max(...stats.placementsByMonth.map((m) => m.count));
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="w-8 text-right text-xs font-medium text-foreground">
                      {item.month}
                    </span>
                    <div className="flex-1">
                      <SimpleBar
                        value={item.count}
                        max={maxCount}
                        color="bg-health"
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-muted-foreground">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* Users by Role */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">
              <span className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-health" />
                Users by Role
              </span>
            </h2>
            <span className="text-xs text-muted-foreground">
              {stats.totalUsers} total
            </span>
          </div>
          <Card>
            <CardContent className="space-y-3">
              {Object.entries(stats.usersByRole).map(([userRole, count]) => {
                const maxRoleCount = Math.max(...Object.values(stats.usersByRole));
                return (
                  <div key={userRole} className="flex items-center gap-3">
                    <Badge
                      className={cn(
                        "w-28 shrink-0 justify-start",
                        roleColors[userRole] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {roleLabels[userRole] ?? userRole}
                    </Badge>
                    <div className="flex-1">
                      <SimpleBar value={count} max={maxRoleCount} color="bg-primary" />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Platform Overview */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Users */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">
              Recent Users
            </h2>
            <Button
              variant="link"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/users" />}
              className="h-auto p-0 text-health hover:text-health/80"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {recentUsers.map((user) => (
              <Card
                key={user.id}
                size="sm"
                className="shadow-sm"
              >
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                    className={cn(
                      roleColors[user.role] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {roleLabels[user.role] ?? user.role}
                  </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(user.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Activity & System Health */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
              Recent Platform Activity
            </h2>
            <div className="space-y-1">
              {recentActivity.slice(0, 4).map((event) => (
                <Card
                  key={event.id}
                  size="sm"
                  className="border-transparent bg-transparent shadow-none transition-colors hover:bg-muted/50"
                >
                  <CardContent className="flex items-start gap-3">
                    <Badge
                      variant="secondary"
                      className="h-7 w-7 rounded-full bg-health/10 p-0 text-health"
                    >
                      <Activity className="h-3.5 w-3.5" />
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.patientName} &middot; {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* System Health Card */}
          <div>
            <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
              Platform Health
            </h2>
            <Card>
              <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Facility Utilization</p>
                  <p className="font-heading text-2xl font-bold text-foreground">
                    {stats.facilityUtilizationRate}%
                  </p>
                  <SimpleBar value={stats.facilityUtilizationRate} max={100} color="bg-health" />
                </div>
                <div className="space-y-1">
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
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
