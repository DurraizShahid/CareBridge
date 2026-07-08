import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getFacility } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { FacilityForm } from "@/components/forms/facility-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFacilityPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  const organizationId = org?.organizationId ?? "org-001";
  const role = org?.role ?? "customer";

  if (!roleHasPermission(role, "facilities:update")) {
    redirect(`/facilities/${id}`);
  }

  const facility = await getFacility(id, organizationId, role);
  if (!facility) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Edit: ${facility.name}`}
        description="Update facility information."
      />
      <FacilityForm initialData={facility} facilityId={id} />
    </div>
  );
}
