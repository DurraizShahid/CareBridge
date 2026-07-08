import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getPlacements, getPatients, getFacilities } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";

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
  const organizationId = org?.organizationId ?? "org-001";
  const role = org?.role ?? "customer";
  const [placements, patients, facilities] = await Promise.all([
    getPlacements(organizationId, role),
    getPatients(organizationId, role),
    getFacilities(organizationId, role),
  ]);

  const sorted = [...placements].sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority),
  );

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
        title="Placements"
        description="Track and manage active patient placements."
      >
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:translate-y-px"
        >
          <Plus className="h-4 w-4" />
          New Placement
        </button>
      </PageHeader>

      {/* Placement cards */}
      <div className="space-y-4">
        {sorted.map((plc) => {
          const config = statusConfig[plc.status] ?? {
            label: plc.status,
            color: "bg-muted text-muted-foreground",
          };
          return (
            <div
              key={plc.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-lg font-bold text-card-foreground">
                      {getPatientName(plc.patientId)}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
                    >
                      {config.label}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        plc.priority === "high" || plc.priority === "emergency"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : plc.priority === "medium"
                          ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {plc.priority} priority
                    </span>
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
                        {getFacilityName(plc.selectedFacilityId)}
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
                  {["assessment", "searching", "pending_approval", "in_progress", "completed"].map(
                    (step, idx) => {
                      const statusOrder = ["assessment", "searching", "pending_approval", "in_progress", "completed"];
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
