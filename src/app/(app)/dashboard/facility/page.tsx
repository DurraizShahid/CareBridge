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
import { Button } from "@/components/ui/button";
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

const referralStatusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  new: { label: "New", icon: AlertCircle, className: "bg-health/10 text-health" },
  reviewing: { label: "Reviewing", icon: Eye, className: "bg-primary/10 text-primary" },
  accepted: { label: "Accepted", icon: CheckCircle2, className: "bg-health/10 text-health" },
  declined: { label: "Declined", icon: XCircle, className: "bg-destructive/10 text-destructive" },
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
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Facility Dashboard"
        description={
          operatorFacility
            ? `${operatorFacility.name} — ${currentOperator?.title}`
            : "Manage referrals, admissions, and facility operations."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Current Occupancy" value={scopedStats.currentOccupancy} icon={Users} variant="default" />
        <StatCard
          title="Available Beds"
          value={scopedStats.availableBeds}
          icon={Building2}
          variant="health"
          trend={{ value: `${scopedStats.occupancyRate}% full`, positive: scopedStats.availableBeds > 5 }}
        />
        <StatCard title="Pending Referrals" value={scopedStats.pendingReferrals} icon={ClipboardList} variant="info" />
        <StatCard title="Pending Admissions" value={scopedStats.pendingAdmissions} icon={UserPlus} variant="default" />
        <StatCard title="Placements This Month" value={scopedStats.placementsThisMonth} icon={CalendarCheck} variant="health" />
        <StatCard title="Avg. Stay Duration" value={`${scopedStats.averageStayDays}d`} icon={Clock} variant="default" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              Referral Requests
            </h2>
            <span className="text-xs text-muted-foreground">
              {scopedReferrals.length} total
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {scopedReferrals.map((ref) => {
              const config = referralStatusConfig[ref.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={ref.id}
                  className="group rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-card-foreground">
                        {ref.patientName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ref.patientAge} yrs
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ref.diagnosis}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{ref.referringHospital}</span>
                      <span className="text-border">&middot;</span>
                      <span className="capitalize">
                        {ref.careLevel.replace(/-/g, " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          config.className,
                        ].join(" ")}
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
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          {operatorFacility && (
            <div className="flex flex-col gap-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
                My Facility
              </h2>
              <div className="rounded-xl border bg-gradient-to-br from-card to-health/[0.02] p-5 shadow-sm">
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
                      "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold",
                      operatorFacility.hasAvailability
                        ? "bg-health/10 text-health"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        operatorFacility.hasAvailability ? "bg-health" : "bg-destructive",
                      )}
                    />
                    {operatorFacility.hasAvailability ? "Accepting referrals" : "At capacity"}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-2">
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
                        ? "[&_[data-slot=progress-indicator]]:bg-warmth"
                        : scopedStats.occupancyRate > 75
                          ? "[&_[data-slot=progress-indicator]]:bg-health"
                          : "[&_[data-slot=progress-indicator]]:bg-primary",
                    )}
                  />
                </div>

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
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
              Facility Network
            </h2>
            <div className="flex flex-col gap-2">
              {scopedFacilities.slice(0, 4).map((fac) => (
                <div
                  key={fac.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
                      "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      fac.hasAvailability
                        ? "bg-health/10 text-health"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {fac.hasAvailability ? "Available" : "Full"}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-right">
              <Button
                variant="link"
                size="sm"
                nativeButton={false}
                render={<Link href="/facilities" />}
                className="h-auto p-0 text-health hover:text-health/80"
              >
                View all facilities <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
