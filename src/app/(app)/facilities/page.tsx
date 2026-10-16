import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Building2, ExternalLink } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { getFacilities } from "@/lib/data-access";
import { FacilitiesDirectoryClient } from "./facilities-directory-client";

export const dynamic = "force-dynamic";

export default async function FacilitiesPage() {
  const org = await getServerOrganization();
  const user = await currentUser();
  if (!org) redirect("/onboarding");
  const organizationId = org.organizationId;
  const role = org.role;
  const userName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user?.username ?? "Care Coordinator");

  if (!roleHasPermission(role, "facilities:read")) redirect("/dashboard");
  const canCreate = roleHasPermission(role, "facilities:create");
  const facilities = await getFacilities(organizationId, role);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Facilities Directory"
        description="Explore accredited care settings, live bed census, clinical specialties, and interactive 3D virtual walkthroughs."
        userName={userName}
        welcomePrefix="Explore"
        welcomeName="Facilities"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facilities" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98]"
            render={<Link href="/dashboard/facility-network" />}
          >
            <Building2 className="size-3.5 text-[#53665E]" />
            Network Analytics
          </Button>
          {canCreate && (
            <Button
              size="sm"
              className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
              render={<Link href="/facilities/new" />}
            >
              <Plus className="size-3.5" />
              New Facility
            </Button>
          )}
        </div>
      </PageHeader>

      <FacilitiesDirectoryClient
        facilities={facilities}
        canCreate={canCreate}
      />
    </div>
  );
}
