import { notFound, redirect } from "next/navigation";
import { roleHasPermission } from "@/lib/permissions";
import { getPatient } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { PageHeader } from "@/components/ui/page-header";
import { PatientForm } from "@/components/forms/patient-form";

export const dynamic = "force-dynamic";

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

  const patientName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title={`Edit: ${patientName}`}
        description="Update clinical records, care requirements, insurance, or discharge timeline."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Patients", href: "/patients" },
          { label: patientName, href: `/patients/${id}` },
          { label: "Edit" },
        ]}
      />
      <div className="max-w-4xl">
        <PatientForm
          initialData={patient}
          patientId={id}
          initialDocuments={patient.documents}
        />
      </div>
    </div>
  );
}
