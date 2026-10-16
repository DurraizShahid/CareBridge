import { notFound, redirect } from "next/navigation";
import { roleHasPermission } from "@/lib/permissions";
import {
  getPlacement,
  getPatients,
  getFacilities,
  getUsers,
} from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { PageHeader } from "@/components/ui/page-header";
import { PlacementForm } from "@/components/forms/placement-form";

export const dynamic = "force-dynamic";

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
    (u) =>
      u.role === "social-worker" ||
      u.role === "discharge-planner" ||
      u.role === "administrator"
  );

  const patient = patients.find((p) => p.id === placement.patientId);
  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : `Placement #${id.slice(0, 8)}`;

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title={`Edit Placement: ${patientName}`}
        description="Update facility assignment, payer clearance status, priority level, or transfer schedule."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Placements", href: "/placements" },
          { label: patientName, href: `/placements/${id}` },
          { label: "Edit" },
        ]}
      />
      <div className="max-w-4xl">
        <PlacementForm
          initialData={placement}
          placementId={id}
          patients={patients}
          facilities={facilities}
          socialWorkers={socialWorkers}
        />
      </div>
    </div>
  );
}
