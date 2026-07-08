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
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import {
  facilities,
  referrals,
  facilityDashboardStats,
  facilityUsers,
} from "@/lib/data";

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
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
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

export default function FacilityOperatorsDashboard() {
  const currentOperator = facilityUsers[0];
  const operatorFacility = facilities.find((f) => f.id === currentOperator?.hospitalId);

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
          value={facilityDashboardStats.currentOccupancy}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Available Beds"
          value={facilityDashboardStats.availableBeds}
          icon={Building2}
          variant="health"
          trend={{ value: `${facilityDashboardStats.occupancyRate}% full`, positive: facilityDashboardStats.availableBeds > 5 }}
        />
        <StatCard
          title="Pending Referrals"
          value={facilityDashboardStats.pendingReferrals}
          icon={ClipboardList}
          variant="warmth"
        />
        <StatCard
          title="Pending Admissions"
          value={facilityDashboardStats.pendingAdmissions}
          icon={UserPlus}
          variant="default"
        />
        <StatCard
          title="Placements This Month"
          value={facilityDashboardStats.placementsThisMonth}
          icon={CalendarCheck}
          variant="health"
        />
        <StatCard
          title="Avg. Stay Duration"
          value={`${facilityDashboardStats.averageStayDays}d`}
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
              {referrals.length} total
            </span>
          </div>
          <div className="space-y-3">
            {referrals.map((ref) => {
              const config = referralStatusConfig[ref.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={ref.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
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
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            config.color,
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(ref.referredAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
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
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
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
                  </span>
                </div>

                {/* Occupancy bar */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="font-medium text-foreground">
                      {facilityDashboardStats.currentOccupancy} / {facilityDashboardStats.totalCapacity} beds
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        facilityDashboardStats.occupancyRate > 90
                          ? "bg-warmth"
                          : facilityDashboardStats.occupancyRate > 75
                            ? "bg-health"
                            : "bg-primary",
                      )}
                      style={{ width: `${facilityDashboardStats.occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Quick stats */}
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{operatorFacility.rating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{facilityDashboardStats.upcomingDischarges}</p>
                    <p className="text-xs text-muted-foreground">Discharges</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{facilityDashboardStats.pendingAdmissions}</p>
                    <p className="text-xs text-muted-foreground">Admissions</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Available Facilities Network */}
          <div>
            <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
              Facility Network
            </h2>
            <div className="space-y-2">
              {facilities.slice(0, 4).map((fac) => (
                <div
                  key={fac.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {fac.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fac.currentOccupancy}/{fac.capacity} beds &middot;{" "}
                      {facilityTypeLabels[fac.type] ?? fac.type}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      fac.hasAvailability
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    )}
                  >
                    {fac.hasAvailability ? "Available" : "Full"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <a
                href="/facilities"
                className="inline-flex items-center gap-1 text-sm font-medium text-health hover:text-health/80"
              >
                View all facilities <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
