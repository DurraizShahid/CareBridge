import { notFound } from "next/navigation";
import Link from "next/link";
import { roleHasPermission } from "@/lib/permissions";
import { getPlacement, getPatients, getFacilities, getUsers } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DeletePlacementDialog } from "./delete-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  assessment: "Assessment",
  searching: "Searching",
  matching: "Matching",
  "pending-approval": "Pending Approval",
  approved: "Approved",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  assessment: "secondary",
  searching: "secondary",
  matching: "secondary",
  "pending-approval": "outline",
  approved: "default",
  "in-progress": "default",
  completed: "outline",
  cancelled: "destructive",
};

const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  emergency: "destructive",
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

const INSURANCE_AUTH_LABELS: Record<string, string> = {
  pending: "Payer Clearance: Pending",
  approved: "Payer Cleared",
  denied: "Payer Denied",
  "not-required": "Payer Clearance: Not Required",
  not_required: "Payer Clearance: Not Required",
};

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
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient";
  const placementFacilityId = placement.facilityId ?? placement.selectedFacilityId;
  const facility = placementFacilityId
    ? facilities.find((f) => f.id === placementFacilityId)
    : null;
  const socialWorker = users.find((u) => u.id === placement.socialWorkerId);
  const socialWorkerName = socialWorker
    ? `${socialWorker.firstName} ${socialWorker.lastName}`
    : "Unknown";

  const canEdit = roleHasPermission(org.role, "placements:update");
  const canDelete = roleHasPermission(org.role, "placements:delete");

  const authStatus = placement.insuranceAuthStatus ?? (placement.insurancePreAuthorized ? "approved" : "pending");
  const isPayerClearancePending = authStatus === "pending";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {patientName}
            </h1>
            <Badge variant={STATUS_VARIANTS[placement.status] ?? "secondary"}>
              {STATUS_LABELS[placement.status] ?? placement.status} (Admin)
            </Badge>
            <Badge
              variant="outline"
              className={
                authStatus === "pending"
                  ? "border-amber-500/50 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  : authStatus === "approved"
                  ? "border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : authStatus === "denied"
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : ""
              }
            >
              {INSURANCE_AUTH_LABELS[authStatus] ?? "Insurance: " + authStatus}
            </Badge>
            <Badge variant={PRIORITY_VARIANTS[placement.priority] ?? "secondary"}>
              {placement.priority} priority
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placement &middot; {CARE_LEVEL_LABELS[placement.careLevel] ?? placement.careLevel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" render={<Link href={`/placements/${placement.id}/edit`} />}>
              Edit
            </Button>
          )}
          {canDelete && (
            <DeletePlacementDialog
              placementId={placement.id}
              patientName={patientName}
            />
          )}
        </div>
      </div>

      <Separator />

      {isPayerClearancePending && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          <p className="font-semibold">Payer Clearance Outstanding</p>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
            Administrative placement is {STATUS_LABELS[placement.status] ?? placement.status}, but insurance payer clearance is still pending.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Patient:</span>{" "}
              <Link href={`/patients/${placement.patientId}`} className="underline-offset-4 hover:underline">
                {patientName}
              </Link>
            </div>
            <div>
              <span className="font-medium">Social Worker:</span>{" "}
              {socialWorkerName}
            </div>
            <div>
              <span className="font-medium">Facility:</span>{" "}
              {facility ? (
                <Link href={`/facilities/${facility.id}`} className="underline-offset-4 hover:underline">
                  {facility.name}
                </Link>
              ) : (
                "TBD"
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Care Level:</span>{" "}
              {CARE_LEVEL_LABELS[placement.careLevel] ?? placement.careLevel}
            </div>
            <div>
              <span className="font-medium">Priority:</span>{" "}
              {placement.priority}
            </div>
            <div>
              <span className="font-medium">Placement Approval:</span>{" "}
              <span>{STATUS_LABELS[placement.status] ?? placement.status} (Administrative)</span>
            </div>
            <div>
              <span className="font-medium">Insurance Authorization:</span>{" "}
              {authStatus === "approved" ? (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Approved &middot; Payer cleared
                </span>
              ) : authStatus === "denied" ? (
                <span className="font-medium text-destructive">
                  Denied &middot; Payer authorization declined
                </span>
              ) : authStatus === "not-required" || authStatus === "not_required" ? (
                <span className="text-muted-foreground">Not required</span>
              ) : (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Pending &middot; Payer clearance still outstanding
                </span>
              )}
            </div>
            {placement.estimatedCost && (
              <div>
                <span className="font-medium">Estimated Cost:</span> $
                {placement.estimatedCost.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {placement.preferredLocation && (
        <Card>
          <CardHeader>
            <CardTitle>Preferred Location</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {placement.preferredLocation.city}, {placement.preferredLocation.state}
            {" "}&middot; Within {placement.preferredLocation.maxDistanceMiles} miles
          </CardContent>
        </Card>
      )}

      {placement.assessmentNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
            {placement.assessmentNotes}
          </CardContent>
        </Card>
      )}

      {placement.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
            {placement.notes}
          </CardContent>
        </Card>
      )}

      {placement.matchedFacilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matched Facilities ({placement.matchedFacilities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {placement.matchedFacilities.map((fid) => {
                const f = facilities.find((fac) => fac.id === fid);
                return (
                  <div key={fid} className="rounded-lg border p-3 text-sm">
                    {f ? (
                      <Link href={`/facilities/${f.id}`} className="font-medium underline-offset-4 hover:underline">
                        {f.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{fid}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {placement.cancellationReason && (
        <Card>
          <CardHeader>
            <CardTitle>Cancellation Reason</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
            {placement.cancellationReason}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {(placement.startDate || placement.completedDate || placement.approvalDate) && (
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                {placement.startDate && (
                  <div>
                    <span className="font-medium">Start Date:</span>{" "}
                    {new Date(placement.startDate).toLocaleDateString()}
                  </div>
                )}
                {placement.approvalDate && (
                  <div>
                    <span className="font-medium">Approved:</span>{" "}
                    {new Date(placement.approvalDate).toLocaleDateString()}
                  </div>
                )}
                {placement.completedDate && (
                  <div>
                    <span className="font-medium">Completed:</span>{" "}
                    {new Date(placement.completedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {placement.approvedBy && (
        <p className="text-xs text-muted-foreground">
          Approved by {placement.approvedBy}
        </p>
      )}

      <div className="text-sm text-muted-foreground">
        <p>Created: {new Date(placement.createdAt).toLocaleDateString()}</p>
        <p>Last Updated: {new Date(placement.updatedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
