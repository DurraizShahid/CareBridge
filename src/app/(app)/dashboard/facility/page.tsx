import {
  Building2,
  Users,
  ClipboardList,
  UserPlus,
  CalendarCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
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
  getFacilityDashboardStats,
  getFacilityUsers,
  getReferrals,
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

const referralStatusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  new: {
    label: "New",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: AlertCircle,
  },
  reviewing: {
    label: "Reviewing",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    icon: Eye,
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
};

const facilityTypeLabels: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing Facility",
  "rehabilitation-center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "home-health-agency": "Home Health Agency",
  hospice: "Hospice",
};

export default async function FacilityOperatorsDashboard() {
  const org = await getServerOrganization();
  const organizationId = org?.organizationId ?? "org-001";
  const role = org?.role ?? "customer";

  const [scopedStats, scopedFacilities, scopedReferrals, scopedUsers] = await Promise.all([
    getFacilityDashboardStats(organizationId, role),
    getFacilities(organizationId, role),
    getReferrals(organizationId, role),
    getFacilityUsers(organizationId, role),
  ]);

  const currentOperator = scopedUsers[0];
  const operatorFacility = scopedFacilities.find((f) => f.id === currentOperator?.hospitalId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Facility Dashboard"
        description={
          operatorFacility
            ? `${operatorFacility.name} — ${currentOperator?.title}`
            : "Manage referrals, admissions, and facility operations."
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Current Occupancy"
          value={scopedStats.currentOccupancy}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Available Beds"
          value={scopedStats.availableBeds}
          icon={Building2}
          variant="health"
          trend={{ value: `${scopedStats.occupancyRate}% full`, positive: scopedStats.availableBeds > 5 }}
        />
        <StatCard
          title="Pending Referrals"
          value={scopedStats.pendingReferrals}
          icon={ClipboardList}
          variant="info"
        />
        <StatCard
          title="Pending Admissions"
          value={scopedStats.pendingAdmissions}
          icon={UserPlus}
          variant="default"
        />
        <StatCard
          title="Placements This Month"
          value={scopedStats.placementsThisMonth}
          icon={CalendarCheck}
          variant="health"
        />
        <StatCard
          title="Avg. Stay Duration"
          value={`${scopedStats.averageStayDays}d`}
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* New Referrals */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">
              Referral Requests
            </h2>
            <span className="text-xs text-muted-foreground">
              {scopedReferrals.length} total
            </span>
          </div>
          <div className="space-y-3">
            {scopedReferrals.map((ref) => {
              const config = referralStatusConfig[ref.status];
              const StatusIcon = config.icon;
              return (
                <Card
                  key={ref.id}
                  className="transition-all hover:shadow-md"
                >
                  <CardContent className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-card-foreground">
                          {ref.patientName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ref.patientAge} yrs
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ref.diagnosis}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {ref.referringHospital}
                        </span>
                        <span>&middot;</span>
                        <span className="capitalize">
                          {ref.careLevel.replace(/-/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge
                          className={cn(
                            config.color,
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(ref.referredAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Facility Overview & Upcoming */}
        <section className="space-y-6">
          {/* My Facility Card */}
          {operatorFacility && (
            <div>
              <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
                My Facility
              </h2>
              <Card>
                <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-base font-bold text-card-foreground">
                      {operatorFacility.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {facilityTypeLabels[operatorFacility.type] ?? operatorFacility.type}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {operatorFacility.address.city}, {operatorFacility.address.state}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "gap-1.5 py-1",
                      operatorFacility.hasAvailability
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        operatorFacility.hasAvailability ? "bg-green-500" : "bg-red-500",
                      )}
                    />
                    {operatorFacility.hasAvailability ? "Accepting referrals" : "At capacity"}
                  </Badge>
                </div>

                {/* Occupancy bar */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="font-medium text-foreground">
                      {scopedStats.currentOccupancy} / {scopedStats.totalCapacity} beds
                    </span>
                  </div>
                  <Progress
                    value={scopedStats.occupancyRate}
                    className={cn(
                      "[&_[data-slot=progress-track]]:h-2",
                        scopedStats.occupancyRate > 90
                          ? "[&_[data-slot=progress-indicator]]:bg-chart-5"
                          : scopedStats.occupancyRate > 75
                            ? "[&_[data-slot=progress-indicator]]:bg-health"
                            : "[&_[data-slot=progress-indicator]]:bg-primary",
                    )}
                  />
                </div>

                {/* Quick stats */}
                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{operatorFacility.rating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{scopedStats.upcomingDischarges}</p>
                    <p className="text-xs text-muted-foreground">Discharges</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{scopedStats.pendingAdmissions}</p>
                    <p className="text-xs text-muted-foreground">Admissions</p>
                  </div>
                </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Available Facilities Network */}
          <div>
            <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
              Facility Network
            </h2>
            <div className="space-y-2">
              {scopedFacilities.slice(0, 4).map((fac) => (
                <Card
                  key={fac.id}
                  size="sm"
                  className="shadow-sm"
                >
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {fac.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fac.currentOccupancy}/{fac.capacity} beds &middot;{" "}
                        {facilityTypeLabels[fac.type] ?? fac.type}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0",
                        fac.hasAvailability
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      )}
                    >
                      {fac.hasAvailability ? "Available" : "Full"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-3 text-right">
              <Button
                variant="link"
                size="sm"
                nativeButton={false}
                render={<Link href="/facilities" />}
                className="h-auto p-0 text-health hover:text-health/80"
              >
                View all facilities <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
