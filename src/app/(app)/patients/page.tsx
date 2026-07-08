import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { patients } from "@/lib/data";

const statusStyles: Record<string, string> = {
  admitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "assessment-in-progress":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "ready-for-discharge":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  placed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  discharged: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  admitted: "Admitted",
  "assessment-in-progress": "Assessment",
  "ready-for-discharge": "Ready for Discharge",
  placed: "Placed",
  discharged: "Discharged",
};

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Patients" description="Manage and view all patients under your care.">
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:translate-y-px"
        >
          <Plus className="h-4 w-4" />
          Add Patient
        </button>
      </PageHeader>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search patients by name, MRN, or diagnosis..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Table */}
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
              <tr
                key={patient.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-card-foreground">
                    {patient.firstName} {patient.lastName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {patient.mrn}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {patient.age} / {patient.gender}
                  </span>
                </td>
                <td className="max-w-xs truncate px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {patient.primaryDiagnosis}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm capitalize text-muted-foreground">
                    {patient.careLevelRequired.replace(/-/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[patient.status] ?? ""}`}
                  >
                    {statusLabels[patient.status] ?? patient.status}
                  </span>
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
