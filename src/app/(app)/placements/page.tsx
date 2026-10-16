import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getPlacements, getPatients, getFacilities } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import type { Placement, Patient, Facility } from "@/types";
import { PlacementsDirectoryClient } from "./placements-directory-client";

export const dynamic = "force-dynamic";

export default async function PlacementsPage() {
  const org = await getServerOrganization();
  const user = await currentUser();
  if (!org) redirect("/onboarding");
  const organizationId = org.organizationId;
  const role = org.role;
  const userName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user?.username ?? "Care Coordinator");

  if (!roleHasPermission(role, "placements:read")) redirect("/dashboard");
  const canCreate = roleHasPermission(role, "placements:create");

  let placements: Placement[] = [];
  let patients: Patient[] = [];
  let facilities: Facility[] = [];
  try {
    const results = await Promise.all([
      getPlacements(organizationId, role),
      getPatients(organizationId, role),
      getFacilities(organizationId, role),
    ]);
    placements = results[0];
    patients = results[1];
    facilities = results[2];
  } catch {
    // Graceful fallback
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Patient Placements"
        description="Monitor active patient transitions, payer authorizations, care coordination, and bed admissions."
        userName={userName}
        welcomePrefix="Track"
        welcomeName="Placements"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Placements" },
        ]}
      >
        {canCreate && (
          <Button
            size="sm"
            className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
            render={<Link href="/placements/new" />}
          >
            <Plus className="size-3.5" />
            New Placement
          </Button>
        )}
      </PageHeader>

      <PlacementsDirectoryClient
        placements={placements}
        patients={patients}
        facilities={facilities}
        canCreate={canCreate}
      />
    </div>
  );
}
