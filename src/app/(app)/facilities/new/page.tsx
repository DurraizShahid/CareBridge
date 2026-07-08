import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { FacilityForm } from "@/components/forms/facility-form";

export default async function NewFacilityPage() {
  const org = await getServerOrganization();
  const role = org?.role ?? "customer";

  if (!roleHasPermission(role, "facilities:create")) {
    redirect("/facilities");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="New Facility"
        description="Add a new care facility to your network."
      />
      <FacilityForm />
    </div>
  );
}
