import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Rotate3d, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getFacility } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { TourEditor } from "./tour-editor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilityTourEditPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) redirect("/onboarding");

  if (!roleHasPermission(org.role, "facilities:update")) {
    redirect(`/facilities/${id}`);
  }

  const facility = await getFacility(id, org.organizationId, org.role);
  if (!facility) notFound();

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title={`Edit 3D Tour — ${facility.name}`}
        description="Configure architectural stops, room navigation, descriptions, amenity highlights, and accent colors for this facility."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facilities", href: "/facilities" },
          { label: facility.name, href: `/facilities/${id}` },
          { label: "3D Tour", href: `/facilities/${id}/tour` },
          { label: "Edit Tour" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          {facility.tourConfig && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
              render={<Link href={`/facilities/${id}/tour`} />}
            >
              <Rotate3d className="size-3.5 text-[#245C52]" />
              View 3D Tour
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
            render={<Link href={`/facilities/${id}`} />}
          >
            <ArrowLeft className="size-3.5" />
            Back to Facility
          </Button>
        </div>
      </PageHeader>

      <TourEditor
        facilityId={id}
        facilityName={facility.name}
        initialConfig={facility.tourConfig ?? null}
      />
    </div>
  );
}
