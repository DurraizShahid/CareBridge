import { notFound } from "next/navigation";
import Link from "next/link";
import { roleHasPermission } from "@/lib/permissions";
import { getPatient, getPlacements } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import type { Placement } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DeletePatientDialog } from "./delete-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  admitted: "Admitted",
  "assessment-in-progress": "Assessment In Progress",
  "ready-for-discharge": "Ready for Discharge",
  placed: "Placed",
  discharged: "Discharged",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  admitted: "default",
  "assessment-in-progress": "secondary",
  "ready-for-discharge": "outline",
  placed: "secondary",
  discharged: "outline",
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

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) return notFound();

  const patient = await getPatient(id, org.organizationId, org.role);
  if (!patient) return notFound();

  const placements = await getPlacements(org.organizationId, org.role);
  const patientPlacements = placements.filter(
    (p: any) => p.patientId === id || p.selectedPatientId === id,
  );

  const canEdit = roleHasPermission(org.role, "patients:update");
  const canDelete = roleHasPermission(org.role, "patients:delete");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {patient.firstName} {patient.lastName}
            </h1>
            <Badge
              variant={STATUS_VARIANTS[patient.status] ?? "secondary"}
            >
              {STATUS_LABELS[patient.status] ?? patient.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            MRN: {patient.mrn} &middot; DOB:{" "}
            {new Date(patient.dateOfBirth).toLocaleDateString()} &middot; Age:{" "}
            {patient.age}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" render={<Link href={`/patients/${patient.id}/edit`} />}>
              Edit
            </Button>
          )}
          {canDelete && (
            <DeletePatientDialog
              patientId={patient.id}
              patientName={`${patient.firstName} ${patient.lastName}`}
              hasActivePlacements={patientPlacements.length > 0}
            />
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Phone:</span>{" "}
              {patient.phone}
            </div>
            <div>
              <span className="font-medium">Address:</span>
              <br />
              {patient.address.street}
              <br />
              {patient.address.city}, {patient.address.state}{" "}
              {patient.address.zipCode}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Name:</span>{" "}
              {patient.emergencyContact.name}
            </div>
            <div>
              <span className="font-medium">Relationship:</span>{" "}
              {patient.emergencyContact.role}
            </div>
            <div>
              <span className="font-medium">Phone:</span>{" "}
              {patient.emergencyContact.phone}
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              {patient.emergencyContact.email}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Primary Diagnosis:</span>{" "}
            {patient.primaryDiagnosis}
          </div>
          {patient.secondaryDiagnoses.length > 0 && (
            <div>
              <span className="font-medium">Secondary Diagnoses:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {patient.secondaryDiagnoses.map((d) => (
                  <Badge key={d} variant="outline">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="font-medium">Care Level Required:</span>{" "}
            {CARE_LEVEL_LABELS[patient.careLevelRequired] ??
              patient.careLevelRequired}
          </div>
          {patient.notes && (
            <div>
              <span className="font-medium">Notes:</span>
              <p className="mt-1 text-muted-foreground">
                {patient.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="font-medium">Admitted:</span>{" "}
              {new Date(patient.admissionDate).toLocaleDateString()}
            </div>
            {patient.estimatedDischargeDate && (
              <div>
                <span className="font-medium">Est. Discharge:</span>{" "}
                {new Date(
                  patient.estimatedDischargeDate,
                ).toLocaleDateString()}
              </div>
            )}
            <div>
              <span className="font-medium">Status:</span>{" "}
              {STATUS_LABELS[patient.status] ?? patient.status}
            </div>
          </div>
        </CardContent>
      </Card>

      {patientPlacements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Placements ({patientPlacements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patientPlacements.map((p: Placement) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {p.id.slice(0, 8)}...
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {p.careLevel?.replace(/-/g, " ")}
                    </span>
                  </div>
                  <Badge
                    variant={p.status === "in-progress" || p.status === "approved" ? "default" : "outline"}
                  >
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        {patient.createdAt && (
          <p>
            Created: {new Date(patient.createdAt).toLocaleDateString()}
          </p>
        )}
        {patient.updatedAt && (
          <p>
            Last Updated:{" "}
            {new Date(patient.updatedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
