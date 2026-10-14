import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Rotate3d } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getFacility } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { TourEditor } from "./tour-editor";

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
    <div className="space-y-6">
      <PageHeader
        title={`Edit 3D tour — ${facility.name}`}
        description="Configure stops, room navigation, descriptions, and accent colors for this facility."
        breadcrumbs={[
          { label: "Facilities", href: "/facilities" },
          { label: facility.name, href: `/facilities/${id}` },
          { label: "3D tour", href: `/facilities/${id}/tour` },
          { label: "Edit tour" },
        ]}
      >
        {facility.tourConfig && (
          <Button variant="outline" render={<Link href={`/facilities/${id}/tour`} />}>
            <Rotate3d className="mr-1.5 h-4 w-4" />
            View tour
          </Button>
        )}
        <Button variant="outline" render={<Link href={`/facilities/${id}`} />}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to facility
        </Button>
      </PageHeader>

      <TourEditor
        facilityId={id}
        facilityName={facility.name}
        initialConfig={facility.tourConfig ?? null}
      />
    </div>
  );
}
