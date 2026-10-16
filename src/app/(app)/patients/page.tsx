import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { roleHasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getPatients } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { PatientsDirectoryClient } from "./patients-directory-client";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const org = await getServerOrganization();
  const user = await currentUser();
  if (!org) redirect("/onboarding");
  const organizationId = org.organizationId;
  const role = org.role;
  const userName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user?.username ?? "Care Coordinator");

  if (!roleHasPermission(role, "patients:read")) redirect("/dashboard");
  const canCreate = roleHasPermission(role, "patients:create");
  const patients = await getPatients(organizationId, role);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Patients Directory"
        description="Comprehensive clinical registry of patients, admission diagnoses, care levels, and transfer readiness."
        userName={userName}
        welcomePrefix="Manage"
        welcomeName="Patients"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Patients" },
        ]}
      >
        {canCreate && (
          <Button
            size="sm"
            className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
            render={<Link href="/patients/new" />}
          >
            <Plus className="size-3.5" />
            Add Patient
          </Button>
        )}
      </PageHeader>

      <PatientsDirectoryClient
        patients={patients}
        canCreate={canCreate}
      />
    </div>
  );
}
