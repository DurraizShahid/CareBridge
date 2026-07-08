import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { roleHasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getPatients } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";

const statusStyles: Record<string, string> = {
  admitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "assessment-in-progress":
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "assessment_in_progress":
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "ready-for-discharge":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "ready_for_discharge":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  placed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  discharged: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  admitted: "Admitted",
  "assessment-in-progress": "Assessment",
  "assessment_in_progress": "Assessment",
  "ready-for-discharge": "Ready for Discharge",
  "ready_for_discharge": "Ready for Discharge",
  placed: "Placed",
  discharged: "Discharged",
};

export default async function PatientsPage() {
  const org = await getServerOrganization();
  const organizationId = org?.organizationId ?? "org-001";
  const role = org?.role ?? "customer";
  const patients = await getPatients(organizationId, role);

  const canCreate = org ? roleHasPermission(role, "patients:create") : false;

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" description="Manage and view all patients under your care.">
        {canCreate && (
          <Button render={<Link href="/patients/new" />}>
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        )}
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search patients by name, MRN, or diagnosis..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Patient
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                MRN
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Age / Gender
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Primary Diagnosis
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Care Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((patient) => (
              <tr key={patient.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="block text-sm font-medium text-card-foreground"
                  >
                    {patient.firstName} {patient.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="block text-sm text-muted-foreground"
                  >
                    {patient.mrn}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="block text-sm text-muted-foreground"
                  >
                    {patient.age} / {patient.gender}
                  </Link>
                </td>
                <td className="max-w-xs truncate px-4 py-3">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="block text-sm text-muted-foreground"
                  >
                    {patient.primaryDiagnosis}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="block text-sm capitalize text-muted-foreground"
                  >
                    {patient.careLevelRequired.replace("-", " ").replace("_", " ")}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/patients/${patient.id}`} className="block">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[patient.status] ?? ""}`}
                    >
                      {statusLabels[patient.status] ?? patient.status}
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {patients.length} patients
      </p>
    </div>
  );
}
