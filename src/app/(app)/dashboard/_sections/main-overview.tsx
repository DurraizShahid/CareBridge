import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getPlacements,
  getPatients,
  getFacilities,
} from "@/lib/data-access";
import { cn } from "@/lib/utils";
import { statusConfig } from "./shared";
import type { SectionProps } from "./shared";

export default async function MainOverview({ organizationId, role }: SectionProps) {
  const [scopedPlacements, scopedPatients, scopedFacilities] = await Promise.all([
    getPlacements(organizationId, role),
    getPatients(organizationId, role),
    getFacilities(organizationId, role),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
        Active Placements
      </h2>
      <div className="flex flex-col gap-3">
        {scopedPlacements.map((plc) => {
          const patient = scopedPatients.find((p) => p.id === plc.patientId);
          const placementFacilityId = plc.facilityId ?? plc.selectedFacilityId;
          const facility = placementFacilityId
            ? scopedFacilities.find((f) => f.id === placementFacilityId)
            : null;
          const status = statusConfig[plc.status] ?? statusConfig.completed;
          return (
            <Card
              key={plc.id}
              className="group rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-card-foreground">
                      {patient?.firstName} {patient?.lastName}
                    </span>
                    <Badge variant="secondary" className={cn(status.className)}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plc.careLevel.replace("-", " ")} &middot;{" "}
                    {facility ? facility.name : "Matching in progress"}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 bg-warmth/10 capitalize text-warmth">
                  {plc.priority}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
