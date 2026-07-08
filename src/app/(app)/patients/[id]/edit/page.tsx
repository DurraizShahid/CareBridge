import { notFound, redirect } from "next/navigation";
import { roleHasPermission } from "@/lib/permissions";
import { getPatient } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { PatientForm } from "@/components/forms/patient-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPatientPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) redirect("/sign-in");
  if (!roleHasPermission(org.role, "patients:update"))
    redirect(`/patients/${id}`);

  const patient = await getPatient(id, org.organizationId, org.role);
  if (!patient) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Patient
        </h1>
        <p className="text-sm text-muted-foreground">
          Update details for {patient.firstName} {patient.lastName}.
        </p>
      </div>
      <PatientForm initialData={patient} patientId={id} />
    </div>
  );
}
