import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPlacements, getPatients, getFacilities } from "@/lib/data-access";
import { cn } from "@/lib/utils";
import { formatRelativeTime, statusConfig } from "./shared";
import RecentActivity from "./recent-activity";
import type { SectionProps } from "./shared";

type StaffOverviewProps = SectionProps & {
  userId: string;
};

export default async function StaffOverview({ organizationId, role, userId }: StaffOverviewProps) {
  const [scopedPlacements, scopedPatients, scopedFacilities] = await Promise.all([
    getPlacements(organizationId, role),
    getPatients(organizationId, role),
    getFacilities(organizationId, role),
  ]);

  const myPatients = scopedPatients.filter((p) => p.socialWorkerId === userId);
  const pendingPlacements = scopedPlacements.filter((p) => p.status === "pending-approval");

  return (
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
              <Card
                key={patient.id}
                className="group rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-card-foreground">
                        {patient.firstName} {patient.lastName}
                      </span>
                      <Badge variant="secondary" className="shrink-0 bg-muted text-muted-foreground">
                        {patient.age}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{patient.primaryDiagnosis}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{patient.careLevelRequired.replace(/-/g, " ")}</span>
                      <span className="text-border">&middot;</span>
                      <span>Admitted {formatRelativeTime(patient.admissionDate)}</span>
                      {patientPlacement && (
                        <>
                          <span className="text-border">&middot;</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "shrink-0",
                              statusConfig[patientPlacement.status]?.className ??
                                "bg-muted text-muted-foreground",
                            )}
                          >
                            {statusConfig[patientPlacement.status]?.label ?? patientPlacement.status}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                const placementFacilityId = plc.facilityId ?? plc.selectedFacilityId;
                const facility = placementFacilityId
                  ? scopedFacilities.find((f) => f.id === placementFacilityId)
                  : null;
                return (
                  <Card
                    key={plc.id}
                    className="group rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CardContent className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-card-foreground">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {facility ? facility.name : "Matching in progress"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {plc.careLevel.replace(/-/g, " ")} &middot; {plc.priority} priority
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 bg-warmth/10 text-warmth">
                        Pending
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed bg-card/50">
              <CardContent className="flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground">No pending approvals</p>
              </CardContent>
            </Card>
          )}
        </div>

        <RecentActivity organizationId={organizationId} role={role} />
      </section>
    </div>
  );
}
