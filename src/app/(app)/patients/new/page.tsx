import { redirect } from "next/navigation";
import { roleHasPermission } from "@/lib/permissions";
import { getServerOrganization } from "@/lib/server-organization";
import { PatientForm } from "@/components/forms/patient-form";

export default async function NewPatientPage() {
  const org = await getServerOrganization();
  if (!org) redirect("/sign-in");
  if (!roleHasPermission(org.role, "patients:create"))
    redirect("/patients");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Patient</h1>
        <p className="text-sm text-muted-foreground">
          Register a new patient for placement.
        </p>
      </div>
      <PatientForm />
    </div>
  );
}
