import { notFound, redirect } from "next/navigation";
import { roleHasPermission } from "@/lib/permissions";
import { getPlacement, getPatients, getFacilities, getUsers } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { PlacementForm } from "@/components/forms/placement-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPlacementPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) redirect("/sign-in");
  if (!roleHasPermission(org.role, "placements:update"))
    redirect(`/placements/${id}`);

  const [placement, patients, facilities, users] = await Promise.all([
    getPlacement(id, org.organizationId, org.role),
    getPatients(org.organizationId, org.role),
    getFacilities(org.organizationId, org.role),
    getUsers(org.organizationId, org.role),
  ]);

  if (!placement) return notFound();

  const socialWorkers = users.filter(
    (u) => u.role === "social-worker" || u.role === "discharge-planner" || u.role === "administrator",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Placement</h1>
        <p className="text-sm text-muted-foreground">
          Update placement details.
        </p>
      </div>
      <PlacementForm
        initialData={placement}
        placementId={id}
        patients={patients}
        facilities={facilities}
        socialWorkers={socialWorkers}
      />
    </div>
  );
}
