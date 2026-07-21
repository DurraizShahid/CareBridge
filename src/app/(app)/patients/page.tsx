import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { roleHasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const user = await currentUser();
  if (!org) redirect("/onboarding");
  const organizationId = org.organizationId;
  const role = org.role;
  const userName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user?.username ?? "Admin");
  const patients = await getPatients(organizationId, role);

  const canCreate = org ? roleHasPermission(role, "patients:create") : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title=""
        description="Manage and view all patients under your care."
        userName={userName}
        welcomePrefix="Manage"
        welcomeName="Patients"
        breadcrumbs={[{ label: "Patients" }]}
      >
        {canCreate && (
          <Button render={<Link href="/patients/new" />}>
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        )}
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search patients by name, MRN, or diagnosis..."
          className="pl-10"
        />
      </div>

      <Card className="p-0">
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
                    <Badge variant="secondary" className={statusStyles[patient.status] ?? ""}>
                      {statusLabels[patient.status] ?? patient.status}
                    </Badge>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {patients.length} patients
      </p>
    </div>
  );
}
