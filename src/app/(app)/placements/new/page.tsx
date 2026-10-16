import { redirect } from "next/navigation";
import { roleHasPermission } from "@/lib/permissions";
import { getServerOrganization } from "@/lib/server-organization";
import { getPatients, getFacilities, getUsers } from "@/lib/data-access";
import { PageHeader } from "@/components/ui/page-header";
import { PlacementForm } from "@/components/forms/placement-form";

export const dynamic = "force-dynamic";

export default async function NewPlacementPage() {
  const org = await getServerOrganization();
  if (!org) redirect("/sign-in");
  if (!roleHasPermission(org.role, "placements:create"))
    redirect("/placements");

  const [patients, facilities, users] = await Promise.all([
    getPatients(org.organizationId, org.role),
    getFacilities(org.organizationId, org.role),
    getUsers(org.organizationId, org.role),
  ]);

  const socialWorkers = users.filter(
    (u) =>
      u.role === "social-worker" ||
      u.role === "discharge-planner" ||
      u.role === "administrator"
  );

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Initiate Patient Placement"
        description="Assign care facilities, establish payer pre-authorizations, and designate coordination contacts."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Placements", href: "/placements" },
          { label: "New Placement" },
        ]}
      />
      <div className="max-w-4xl">
        <PlacementForm
          patients={patients}
          facilities={facilities}
          socialWorkers={socialWorkers}
        />
      </div>
    </div>
  );
}
