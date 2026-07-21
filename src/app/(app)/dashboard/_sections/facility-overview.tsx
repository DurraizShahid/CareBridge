import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getFacilityDashboardStats,
  getFacilityUsers,
  getReferrals,
  getFacilities,
} from "@/lib/data-access";
import { formatRelativeTime, facilityTypeLabels } from "./shared";
import type { SectionProps } from "./shared";

const referralStatusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  new: { label: "New", icon: AlertCircle, className: "bg-health/10 text-health" },
  reviewing: { label: "Reviewing", icon: Eye, className: "bg-primary/10 text-primary" },
  accepted: { label: "Accepted", icon: CheckCircle2, className: "bg-health/10 text-health" },
  declined: { label: "Declined", icon: XCircle, className: "bg-destructive/10 text-destructive" },
};

type FacilityOverviewProps = SectionProps & {
  userId: string;
};

export default async function FacilityOverview({ organizationId, role, userId }: FacilityOverviewProps) {
  const [scopedFacilities, scopedReferrals, scopedUsers] = await Promise.all([
    getFacilities(organizationId, role),
    getReferrals(organizationId, role),
    getFacilityUsers(organizationId, role),
  ]);

  const currentOperator = scopedUsers.find((user) => user.id === userId);
  const operatorFacility = scopedFacilities.find((f) => f.id === currentOperator?.hospitalId);
  const scopedStats = await getFacilityDashboardStats(organizationId, role, operatorFacility?.id);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
            Referral Requests
          </h2>
          <span className="text-xs text-muted-foreground">{scopedReferrals.length} total</span>
        </div>
        <div className="flex flex-col gap-3">
          {scopedReferrals.map((ref) => {
            const config = referralStatusConfig[ref.status];
            const StatusIcon = config.icon;
            return (
              <Card
                key={ref.id}
                hoverable
              >
                <CardContent className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="truncate text-base font-semibold text-card-foreground">{ref.patientName}</span>
                    <span className="text-sm text-muted-foreground">{ref.patientAge} yrs</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{ref.diagnosis}</p>
                  <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span>{ref.referringHospital}</span>
                    <span className="text-border">&middot;</span>
                    <span className="capitalize">{ref.careLevel.replace(/-/g, " ")}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={cn("gap-1", config.className)}>
                      <StatusIcon className="h-4 w-4" />
                      {config.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{formatRelativeTime(ref.referredAt)}</span>
                  </div>
                </CardContent>
              </Card>
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
            <Card>
              <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-lg font-bold text-card-foreground truncate">{operatorFacility.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {facilityTypeLabels[operatorFacility.type] ?? operatorFacility.type}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {operatorFacility.address.city}, {operatorFacility.address.state}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 gap-1.5",
                    operatorFacility.hasAvailability
                      ? "bg-health/10 text-health"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", operatorFacility.hasAvailability ? "bg-health" : "bg-destructive")}
                  />
                  {operatorFacility.hasAvailability ? "Accepting referrals" : "At capacity"}
                </Badge>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-semibold text-foreground">
                    {scopedStats.currentOccupancy} / {scopedStats.totalCapacity} beds
                  </span>
                </div>
                <Progress
                  value={scopedStats.occupancyRate}
                  className={cn(
                    "[&_[data-slot=progress-track]]:h-3",
                    scopedStats.occupancyRate > 90
                      ? "[&_[data-slot=progress-indicator]]:bg-warmth"
                      : scopedStats.occupancyRate > 75
                        ? "[&_[data-slot=progress-indicator]]:bg-health"
                        : "[&_[data-slot=progress-indicator]]:bg-primary",
                  )}
                />
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{operatorFacility.rating}</p>
                  <p className="text-sm text-muted-foreground mt-1">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{scopedStats.upcomingDischarges}</p>
                  <p className="text-sm text-muted-foreground mt-1">Discharges</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{scopedStats.pendingAdmissions}</p>
                  <p className="text-sm text-muted-foreground mt-1">Admissions</p>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
            Facility Network
          </h2>
          <div className="flex flex-col gap-2">
            {scopedFacilities.slice(0, 4).map((fac) => (
              <Card
                key={fac.id}
                hoverable
              >
                <CardContent className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-card-foreground">{fac.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {fac.currentOccupancy}/{fac.capacity} beds &middot; {facilityTypeLabels[fac.type] ?? fac.type}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0",
                    fac.hasAvailability ? "bg-health/10 text-health" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {fac.hasAvailability ? "Available" : "Full"}
                </Badge>
                </CardContent>
              </Card>
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
  );
}
