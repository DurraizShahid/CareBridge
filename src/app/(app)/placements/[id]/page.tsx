import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  User,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  HeartPulse,
  Pencil,
  Rotate3d,
  ArrowRight,
} from "lucide-react";
import { roleHasPermission } from "@/lib/permissions";
import {
  getPlacement,
  getPatients,
  getFacilities,
  getUsers,
} from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeletePlacementDialog } from "./delete-dialog";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  assessment: {
    label: "Assessment",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  searching: {
    label: "Searching",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  matching: {
    label: "Matching",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  "pending-approval": {
    label: "Pending Approval",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
    dotClass: "bg-[#F59E0B]",
  },
  pending_approval: {
    label: "Pending Approval",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
    dotClass: "bg-[#F59E0B]",
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-[#EDF2EC] text-[#203E39] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  "in-progress": {
    label: "In Progress",
    badgeClass: "bg-[#EDF2EC] text-[#245C52] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-[#EDF2EC] text-[#245C52] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
    dotClass: "bg-[#9CA3AF]",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]",
    dotClass: "bg-[#DC2626]",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  emergency: {
    label: "Emergency Priority",
    badgeClass: "bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]",
  },
  high: {
    label: "High Priority",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
  },
  medium: {
    label: "Medium Priority",
    badgeClass: "bg-[#FAFBF8] text-[#203E39] border-[#DCE5DE]",
  },
  low: {
    label: "Low Priority",
    badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
  },
};

const CARE_LEVEL_LABELS: Record<string, string> = {
  "independent-living": "Independent Living",
  "assisted-living": "Assisted Living",
  "skilled-nursing": "Skilled Nursing",
  "long-term-care": "Long Term Care",
  rehabilitation: "Rehabilitation",
  "home-health": "Home Health",
  hospice: "Hospice",
  "memory-care": "Memory Care",
};

const workflowSteps = [
  { key: "assessment", label: "Assessment" },
  { key: "searching", label: "Searching" },
  { key: "pending-approval", label: "Pending Approval" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default async function PlacementDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) return notFound();

  const placement = await getPlacement(id, org.organizationId, org.role);
  if (!placement) return notFound();

  const [patients, facilities, users] = await Promise.all([
    getPatients(org.organizationId, org.role),
    getFacilities(org.organizationId, org.role),
    getUsers(org.organizationId, org.role),
  ]);

  const patient = patients.find((p) => p.id === placement.patientId);
  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : "Unknown Patient";
  const placementFacilityId =
    placement.facilityId ?? placement.selectedFacilityId;
  const facility = placementFacilityId
    ? facilities.find((f) => f.id === placementFacilityId)
    : null;
  const socialWorker = users.find((u) => u.id === placement.socialWorkerId);
  const socialWorkerName = socialWorker
    ? `${socialWorker.firstName} ${socialWorker.lastName}`
    : "Unassigned";

  const canEdit = roleHasPermission(org.role, "placements:update");
  const canDelete = roleHasPermission(org.role, "placements:delete");

  const authStatus =
    placement.insuranceAuthStatus ??
    (placement.insurancePreAuthorized ? "approved" : "pending");

  const statusInfo =
    STATUS_CONFIG[placement.status] ??
    STATUS_CONFIG[placement.status.replace(/_/g, "-")] ?? {
      label: placement.status,
      badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
      dotClass: "bg-[#9CA3AF]",
    };

  const prioInfo =
    PRIORITY_CONFIG[placement.priority] ?? {
      label: `${placement.priority} priority`,
      badgeClass: "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE]",
    };

  return (
    <div className="space-y-8 pb-10 max-w-5xl">
      <PageHeader
        title={`Placement: ${patientName}`}
        description={`Placement Case #${placement.id.slice(
          0,
          8
        )} · ${CARE_LEVEL_LABELS[placement.careLevel] ?? placement.careLevel}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Placements", href: "/placements" },
          { label: patientName },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
              render={<Link href={`/placements/${placement.id}/edit`} />}
            >
              <Pencil className="size-3.5 text-[#53665E]" />
              Edit Placement
            </Button>
          )}
          {canDelete && (
            <DeletePlacementDialog
              placementId={placement.id}
              patientName={patientName}
            />
          )}
        </div>
      </PageHeader>

      {/* Telemetry & Badges Row */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border",
            statusInfo.badgeClass
          )}
        >
          <span className={cn("size-1.5 rounded-full", statusInfo.dotClass)} />
          {statusInfo.label}
        </span>
        <span
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-full font-semibold border",
            prioInfo.badgeClass
          )}
        >
          {prioInfo.label}
        </span>
        {authStatus === "approved" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-[#EDF2EC] text-[#245C52] border border-[#DCE5DE]">
            <ShieldCheck className="size-3.5" />
            Payer Authorized
          </span>
        ) : authStatus === "pending" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-[#FFF4E5] text-[#9A5B00] border border-[#FFE2BF]">
            <Clock className="size-3.5" />
            Payer Clearance Pending
          </span>
        ) : authStatus === "denied" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]">
            <AlertCircle className="size-3.5" />
            Payer Clearance Denied
          </span>
        ) : null}
      </div>

      {/* Payer Clearance Notice Banner */}
      {authStatus === "pending" && (
        <div className="rounded-2xl border border-[#FFE2BF] bg-[#FFF4E5]/80 p-5 text-xs text-[#9A5B00] space-y-1">
          <p className="font-semibold text-sm flex items-center gap-1.5">
            <Clock className="size-4" />
            Payer Authorization In Review
          </p>
          <p className="leading-relaxed text-[#7A4900]">
            The case is currently in {statusInfo.label} status, but formal payer insurance
            pre-authorization remains pending confirmation. Coordinate with clinical discharge planning.
          </p>
        </div>
      )}

      {/* Workflow Progress Tracker Card */}
      {placement.status !== "completed" && placement.status !== "cancelled" && (
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
            Transition Workflow Milestones
          </h2>
          <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
            {workflowSteps.map((step, idx) => {
              const statusOrder = [
                "assessment",
                "searching",
                "pending-approval",
                "in-progress",
                "completed",
              ];
              const normCurrent = placement.status.replace(/_/g, "-");
              const currentIdx = statusOrder.indexOf(normCurrent);
              const stepIdx = statusOrder.indexOf(step.key);
              const isComplete =
                stepIdx < currentIdx ||
                (stepIdx === currentIdx && normCurrent === "completed");
              const isCurrent = step.key === normCurrent;

              return (
                <div key={step.key} className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                      isComplete
                        ? "bg-[#245C52] text-white"
                        : isCurrent
                        ? "border-2 border-[#245C52] bg-white text-[#245C52]"
                        : "border border-[#DCE5DE] bg-[#FAFBF8] text-[#53665E]"
                    )}
                  >
                    {isComplete ? "✓" : idx + 1}
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      isCurrent
                        ? "font-semibold text-[#245C52]"
                        : isComplete
                        ? "font-medium text-[#0D1B17]"
                        : "text-[#53665E]"
                    )}
                  >
                    {step.label}
                  </span>
                  {idx < workflowSteps.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-0.5 w-8 rounded-full transition-colors",
                        stepIdx < currentIdx ? "bg-[#245C52]" : "bg-[#DCE5DE]"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assignment & Facility */}
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5DE]/60 pb-3">
            <Building2 className="size-4 text-[#245C52]" />
            <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
              Care Setting Assignment
            </h2>
          </div>
          <dl className="space-y-3.5 text-xs md:text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="font-semibold text-[#53665E]">Assigned Patient:</dt>
              <dd>
                <Link
                  href={`/patients/${placement.patientId}`}
                  className="font-medium text-[#255DCE] hover:underline"
                >
                  {patientName} &rarr;
                </Link>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="font-semibold text-[#53665E]">Care Facility:</dt>
              <dd>
                {facility ? (
                  <Link
                    href={`/facilities/${facility.id}`}
                    className="font-medium text-[#0D1B17] hover:text-[#245C52]"
                  >
                    {facility.name} &rarr;
                  </Link>
                ) : (
                  <span className="text-[#53665E] italic">Pending Selection</span>
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="font-semibold text-[#53665E]">Social Worker / Coordinator:</dt>
              <dd className="font-medium text-[#0D1B17]">{socialWorkerName}</dd>
            </div>
          </dl>
          {facility?.tourConfig && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-full border-[#D0E0FF] text-[#255DCE] hover:bg-[#EBF2FF] text-xs font-semibold gap-1.5"
                render={<Link href={`/facilities/${facility.id}/tour`} />}
              >
                <Rotate3d className="size-3.5" />
                Launch 3D Virtual Facility Tour
              </Button>
            </div>
          )}
        </div>

        {/* Transition Details & Timeline */}
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5DE]/60 pb-3">
            <Calendar className="size-4 text-[#245C52]" />
            <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
              Care Level & Scheduling
            </h2>
          </div>
          <dl className="space-y-3.5 text-xs md:text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="font-semibold text-[#53665E]">Required Care Level:</dt>
              <dd className="font-medium text-[#0D1B17]">
                {CARE_LEVEL_LABELS[placement.careLevel] ?? placement.careLevel}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="font-semibold text-[#53665E]">Target Start Date:</dt>
              <dd className="font-medium text-[#0D1B17]">
                {placement.startDate
                  ? new Date(placement.startDate).toLocaleDateString()
                  : "Not set"}
              </dd>
            </div>
            {placement.completedDate && (
              <div className="flex items-start justify-between gap-3">
                <dt className="font-semibold text-[#53665E]">Completion Date:</dt>
                <dd className="font-medium text-[#0D1B17]">
                  {new Date(placement.completedDate).toLocaleDateString()}
                </dd>
              </div>
            )}
            {placement.estimatedCost != null && (
              <div className="flex items-start justify-between gap-3">
                <dt className="font-semibold text-[#53665E]">Estimated Monthly Rate:</dt>
                <dd className="font-medium text-[#0D1B17]">
                  ${placement.estimatedCost.toLocaleString("en-US")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Clinical Assessment Notes */}
      {(placement.assessmentNotes || placement.notes) && (
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5DE]/60 pb-3">
            <HeartPulse className="size-4 text-[#245C52]" />
            <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
              Clinical Assessment & Coordination Notes
            </h2>
          </div>
          {placement.assessmentNotes && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#53665E]">
                Assessment Summary
              </span>
              <p className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE] p-3.5 text-xs md:text-sm text-[#203E39] leading-relaxed">
                {placement.assessmentNotes}
              </p>
            </div>
          )}
          {placement.notes && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#53665E]">
                Administrative Directives
              </span>
              <p className="rounded-xl bg-[#EDF2EC]/40 border border-[#DCE5DE] p-3.5 text-xs text-[#203E39] leading-relaxed">
                {placement.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Metadata footer */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[#53665E] px-2">
        <span>Placement ID: {placement.id}</span>
        {placement.updatedAt && (
          <span>
            Last updated: {new Date(placement.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
