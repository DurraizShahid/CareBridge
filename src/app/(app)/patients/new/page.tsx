import { redirect } from "next/navigation";
import { roleHasPermission } from "@/lib/permissions";
import { getServerOrganization } from "@/lib/server-organization";
import { PageHeader } from "@/components/ui/page-header";
import { PatientForm } from "@/components/forms/patient-form";

export const dynamic = "force-dynamic";

export default async function NewPatientPage() {
  const org = await getServerOrganization();
  if (!org) redirect("/sign-in");
  if (!roleHasPermission(org.role, "patients:create"))
    redirect("/patients");

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Register New Patient"
        description="Record patient demographics, medical history, clinical requirements, and discharge timeline."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Patients", href: "/patients" },
          { label: "New Patient" },
        ]}
      />
      <div className="max-w-4xl">
        <PatientForm />
      </div>
    </div>
  );
}
