import { redirect } from "next/navigation";
import { roleHasPermission } from "@/lib/permissions";
import { getServerOrganization } from "@/lib/server-organization";
import { getPatients, getFacilities, getUsers } from "@/lib/data-access";
import { PlacementForm } from "@/components/forms/placement-form";

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
    (u) => u.role === "social-worker" || u.role === "discharge-planner" || u.role === "administrator",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Placement</h1>
        <p className="text-sm text-muted-foreground">
          Initiate a new patient placement workflow.
        </p>
      </div>
      <PlacementForm
        patients={patients}
        facilities={facilities}
        socialWorkers={socialWorkers}
      />
    </div>
  );
}
