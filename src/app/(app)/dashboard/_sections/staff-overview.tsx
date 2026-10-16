import { ArrowRight, Users, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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

  const assignedPatients = scopedPatients.filter((p) => p.socialWorkerId === userId);
  const myPatients = assignedPatients.length > 0 ? assignedPatients : scopedPatients.slice(0, 8);
  const pendingPlacements = scopedPlacements.filter(
    (p) => p.status === "pending-approval",
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#245C52]" />
            <h2 className="font-serif text-xl font-normal text-[#0D1B17]">
              My Caseload
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
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-sm">
            <Empty>
              <EmptyHeader>
                <EmptyMedia>
                  <Users className="size-8 text-[#53665E]/50" />
                </EmptyMedia>
                <EmptyTitle className="font-serif text-base font-medium text-[#0D1B17]">
                  No patients in caseload
                </EmptyTitle>
                <EmptyDescription className="text-xs text-[#53665E]">
                  Patients assigned to your care will appear here.
                </EmptyDescription>
              </EmptyHeader>
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
                  <CardContent className="flex items-start justify-between gap-4 p-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-[#0D1B17]">
                          {patient.firstName} {patient.lastName}
                        </span>
                        <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
                          Age {patient.age}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#53665E]">{patient.primaryDiagnosis}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-[#53665E]">
                        <span className="capitalize font-medium text-[#203E39]">
                          {patient.careLevelRequired.replace(/-/g, " ")}
                        </span>
                        <span>&middot;</span>
                        <span>Admitted {formatRelativeTime(patient.admissionDate)}</span>
                        {patientPlacement && (
                          <>
                            <span>&middot;</span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "shrink-0 rounded-full",
                                statusConfig[patientPlacement.status]?.className ??
                                  "bg-[#EDF2EC] text-[#53665E]",
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
        )}
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#C05621]" />
              <h2 className="font-serif text-xl font-normal text-[#0D1B17]">
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
                    className="rounded-2xl border border-[#DCE5DE] bg-white p-4 shadow-sm hover:border-[#245C52]/50 hover:shadow-md transition-all"
                  >
                    <CardContent className="flex items-start justify-between gap-4 p-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0D1B17]">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="mt-0.5 text-xs text-[#53665E]">
                          {facility ? facility.name : "Matching in progress"}
                        </p>
                        <p className="mt-1 text-xs text-[#53665E]">
                          <span className="capitalize">{plc.careLevel.replace(/-/g, " ")}</span>
                          <span> &middot; </span>
                          <span className="capitalize font-medium text-[#203E39]">
                            {plc.priority} priority
                          </span>
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 rounded-full bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20"
                      >
                        Pending
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-[#EDF2EC] text-[#245C52] flex items-center justify-center shrink-0 border border-[#DCE5DE]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0D1B17]">Approvals queue clear</p>
                  <p className="text-xs text-[#53665E]">No pending placement referrals require review.</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <RecentActivity organizationId={organizationId} role={role} />
      </section>
    </div>
  );
}
