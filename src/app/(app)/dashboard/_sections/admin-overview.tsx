import { ArrowRight, BarChart3, UserCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getSuperAdminDashboardStats, getUsers, getFacilities } from "@/lib/data-access";
import { formatRelativeTimeWithFallback, roleLabels, roleColors } from "./shared";
import RecentActivity from "./recent-activity";
import type { SectionProps } from "./shared";

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

export default async function AdminOverview({ organizationId, role }: SectionProps) {
  const stats = await getSuperAdminDashboardStats();
  const users = await getUsers(organizationId, role);
  const facilities = await getFacilities(organizationId, role);
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              <BarChart3 className="h-3.5 w-3.5 text-health" />
              Placements by Month
            </h2>
            <span className="text-xs text-muted-foreground">Avg {stats.averagePlacementTimeDays}d placement time</span>
          </div>
          <Card className="shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5">
              {stats.placementsByMonth.map((item) => {
                const maxCount = Math.max(...stats.placementsByMonth.map((m) => m.count));
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="w-8 text-right text-xs font-medium text-foreground">{item.month}</span>
                    <div className="flex-1">
                      <SimpleBar value={item.count} max={maxCount} color="bg-health" />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-muted-foreground">{item.count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              <UserCheck className="h-3.5 w-3.5 text-health" />
              Users by Role
            </h2>
            <span className="text-xs text-muted-foreground">{stats.totalUsers} total</span>
          </div>
          <Card className="shadow-sm">
            <CardContent className="flex flex-col gap-3 p-5">
              {Object.entries(stats.usersByRole).map(([userRole, count]) => {
                const maxRoleCount = Math.max(...Object.values(stats.usersByRole));
                return (
                  <div key={userRole} className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
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
                    <span className="w-6 text-right text-xs font-medium text-foreground">{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
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
              <Card
                key={user.id}
                className="shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-card-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "shrink-0",
                      roleColors[user.role] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {roleLabels[user.role] ?? user.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTimeWithFallback(user.createdAt)}
                  </span>
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <RecentActivity organizationId={organizationId} role={role} />

          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              Platform Health
            </h2>
            <Card className="bg-gradient-to-br from-card to-primary/[0.02] shadow-sm">
              <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">Facility Utilization</p>
                  <p className="font-heading text-2xl font-bold text-foreground">{stats.facilityUtilizationRate}%</p>
                  <SimpleBar value={stats.facilityUtilizationRate} max={100} color="bg-health" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">Avg Placement Time</p>
                  <p className="font-heading text-2xl font-bold text-foreground">{stats.averagePlacementTimeDays}d</p>
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
    </>
  );
}
