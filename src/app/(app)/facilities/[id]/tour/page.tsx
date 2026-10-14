import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FacilityTour } from "@/components/facility-tour/facility-tour";
import { getFacility } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilityTourPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) redirect("/onboarding");

  const facility = await getFacility(id, org.organizationId, org.role);
  if (!facility?.tourConfig) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${facility.name} — 3D tour`}
        description={`${facility.address.street}, ${facility.address.city}, ${facility.address.state}`}
        breadcrumbs={[
          { label: "Facilities", href: "/facilities" },
          { label: facility.name, href: `/facilities/${id}` },
          { label: "3D tour" },
        ]}
      >
        <Button variant="outline" render={<Link href={`/facilities/${id}`} />}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to facility
        </Button>
      </PageHeader>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        Stylized illustration for orientation — layouts and furnishings are representative, not to scale.
      </p>
      <FacilityTour config={facility.tourConfig} facilityName={facility.name} />
    </div>
  );
}
