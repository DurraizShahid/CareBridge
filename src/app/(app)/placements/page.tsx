import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { getPlacements, getPatients, getFacilities } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import type { Placement, Patient, Facility } from "@/types";

const statusConfig: Record<string, { label: string; color: string }> = {
  assessment: {
    label: "Assessment",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  searching: {
    label: "Searching",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  matching: {
    label: "Matching",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  "pending-approval": {
    label: "Pending Approval",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  "pending_approval": {
    label: "Pending Approval",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
  "in_progress": {
    label: "In Progress",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
  completed: {
    label: "Completed",
    color: "bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

const priorityOrder = ["emergency", "high", "medium", "low"];

export default async function PlacementsPage() {
  const org = await getServerOrganization();
  const user = await currentUser();
  if (!org) redirect("/onboarding");
  const organizationId = org.organizationId;
  const role = org.role;
  const userName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user?.username ?? "Admin");

  let placements: Placement[] = [];
  let patients: Patient[] = [];
  let facilities: Facility[] = [];
  try {
    const results = await Promise.all([
      getPlacements(organizationId, role),
      getPatients(organizationId, role),
      getFacilities(organizationId, role),
    ]);
    placements = results[0];
    patients = results[1];
    facilities = results[2];
  } catch {
    // If data fetching fails, show empty state below
  }

  const sorted = [...placements].sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority),
  );
  const isEmpty = sorted.length === 0;

  const canCreate = roleHasPermission(role, "placements:create");

  function getPatientName(patientId: string): string {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient";
  }

  function getFacilityName(facilityId?: string): string {
    if (!facilityId) return "TBD";
    const facility = facilities.find((f) => f.id === facilityId);
    return facility?.name ?? "Unknown Facility";
  }

  function getPatientDiagnosis(patientId: string): string {
    const patient = patients.find((p) => p.id === patientId);
    return patient?.primaryDiagnosis ?? "";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title=""
        description="Track and manage active patient placements."
        userName={userName}
        welcomePrefix="Track"
        welcomeName="Placements"
        breadcrumbs={[{ label: "Placements" }]}
      >
        {canCreate && (
          <Button render={<Link href="/placements/new" />}>
            <Plus className="h-4 w-4" />
            New Placement
          </Button>
        )}
      </PageHeader>

      {/* Placement cards */}
      {isEmpty && (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-lg font-semibold text-card-foreground">No placements yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a new placement to start tracking patient transfers.
            </p>
            {canCreate && (
              <Button render={<Link href="/placements/new" />} className="mt-4">
                <Plus className="h-4 w-4" />
                New Placement
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isEmpty && (
      <div className="space-y-4">
        {sorted.map((plc) => {
          const config = statusConfig[plc.status] ?? {
            label: plc.status,
            color: "bg-muted text-muted-foreground",
          };
          return (
            <Link
              key={plc.id}
              href={`/placements/${plc.id}`}
              className="block"
            >
              <Card>
              <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-lg font-bold text-card-foreground">
                      {getPatientName(plc.patientId)}
                    </h3>
                    <Badge variant="secondary" className={config.color}>
                      {config.label}
                    </Badge>
                    <Badge variant="secondary" className={
                      plc.priority === "high" || plc.priority === "emergency"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : plc.priority === "medium"
                        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                        : "bg-muted text-muted-foreground"
                    }>
                      {plc.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getPatientDiagnosis(plc.patientId)}
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      Care level:{" "}
                      <span className="font-medium text-foreground capitalize">
                        {plc.careLevel.replace("-", " ").replace("_", " ")}
                      </span>
                    </span>
                    <span>
                      Facility:{" "}
                      <span className="font-medium text-foreground">
                        {getFacilityName(plc.facilityId ?? plc.selectedFacilityId)}
                      </span>
                    </span>
                    {plc.insurancePreAuthorized && (
                      <span className="text-health">Insurance pre-authorized</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress dots for workflow */}
              {plc.status !== "completed" && plc.status !== "cancelled" && (
                <div className="mt-4 flex items-center gap-1.5">
                  {["assessment", "searching", "pending-approval", "in-progress", "completed"].map(
                    (step, idx) => {
                      const statusOrder = ["assessment", "searching", "pending-approval", "in-progress", "completed"];
                      const currentIdx = statusOrder.indexOf(plc.status);
                      const stepIdx = statusOrder.indexOf(step);
                      const isComplete = stepIdx <= currentIdx && plc.status !== "assessment";
                      const isCurrent = step === plc.status;

                      return (
                        <div key={step} className="flex items-center gap-1.5">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                              isComplete
                                ? "bg-health text-white"
                                : isCurrent
                                ? "border-2 border-health text-health"
                                : "border border-border text-muted-foreground"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span
                            className={`text-[11px] ${
                              isCurrent
                                ? "font-medium text-health"
                                : "text-muted-foreground"
                            }`}
                          >
                            {statusConfig[step]?.label ?? step}
                          </span>
                          {idx < 4 && (
                            <div
                              className={`mx-1 h-px w-4 ${
                                stepIdx < currentIdx
                                  ? "bg-health"
                                  : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}

              {/* Notes */}
              {plc.notes && (
                <p className="mt-3 text-xs italic text-muted-foreground">
                  {plc.notes}
                </p>
              )}
              </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      )}
    </div>
  );
}
