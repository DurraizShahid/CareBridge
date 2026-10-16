import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Rotate3d,
  Compass,
  Info,
  Pencil,
  Building2,
  Sliders,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { FacilityTour } from "@/components/facility-tour/facility-tour";
import { getFacility } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilityTourPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) redirect("/onboarding");

  const facility = await getFacility(id, org.organizationId, org.role);
  if (!facility) notFound();

  const canEdit = roleHasPermission(org.role, "facilities:update");

  if (!facility.tourConfig) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <PageHeader
          title={`${facility.name} — 3D Virtual Tour`}
          description={`${facility.address.street}, ${facility.address.city}, ${facility.address.state}`}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Facilities", href: "/facilities" },
            { label: facility.name, href: `/facilities/${id}` },
            { label: "3D Tour" },
          ]}
        >
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
            render={<Link href={`/facilities/${id}`} />}
          >
            <ArrowLeft className="size-3.5" />
            Back to Facility
          </Button>
        </PageHeader>

        <Empty className="rounded-2xl border border-[#DCE5DE] bg-white p-12 shadow-xs">
          <EmptyMedia variant="icon" className="bg-[#FAFBF8] border border-[#DCE5DE] size-14">
            <Rotate3d className="size-7 text-[#245C52]" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="font-serif text-2xl font-medium text-[#0D1B17]">
              3D Tour Not Yet Configured
            </EmptyTitle>
            <EmptyDescription className="text-xs sm:text-sm text-[#53665E] max-w-md">
              An interactive 3D virtual walkthrough has not yet been set up for {facility.name}.
              {canEdit
                ? " As an authorized administrator, you can configure arrival stops, corridors, and patient room suites now."
                : " Please check back later or contact the facility administration team."}
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-[#DCE5DE] text-xs font-semibold text-[#203E39] hover:bg-[#FAFBF8]"
              render={<Link href={`/facilities/${id}`} />}
            >
              Return to Profile
            </Button>
            {canEdit && (
              <Button
                size="sm"
                className="rounded-full bg-[#245C52] text-xs font-semibold text-white hover:bg-[#19473F] gap-1.5 shadow-xs"
                render={<Link href={`/facilities/${id}/tour/edit`} />}
              >
                <Rotate3d className="size-3.5" />
                Configure 3D Tour
              </Button>
            )}
          </div>
        </Empty>
      </div>
    );
  }

  const stopCount = facility.tourConfig.stops?.length ?? 0;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* ── 1. Page Header with Breadcrumbs & Actions ── */}
      <PageHeader
        title={`${facility.name} — 3D Walkthrough`}
        description={`${facility.address.street}, ${facility.address.city}, ${facility.address.state}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facilities", href: "/facilities" },
          { label: facility.name, href: `/facilities/${id}` },
          { label: "3D Tour" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
            render={<Link href={`/facilities/${id}`} />}
          >
            <ArrowLeft className="size-3.5" />
            Back to Facility
          </Button>

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
              render={<Link href={`/facilities/${id}/tour/edit`} />}
            >
              <Pencil className="size-3.5 text-[#53665E]" />
              Edit Tour
            </Button>
          )}
        </div>
      </PageHeader>

      {/* ── 2. Telemetry & Navigation Guide Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
            <Rotate3d className="size-3.5 text-[#245C52]" />
            {stopCount} Guided Architectural Stops
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
            <ShieldCheck className="size-3.5 text-[#245C52]" />
            Interactive 3D Scene
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-[#53665E]">
          <Compass className="size-3.5 text-[#245C52] shrink-0" />
          Stylized architectural walkthrough for orientation. Layouts and furnishings are representative.
        </p>
      </div>

      {/* ── 3. 3D Tour Interactive Viewer Container ── */}
      <div className="rounded-3xl border border-[#DCE5DE] bg-white p-3 sm:p-5 shadow-xs">
        <FacilityTour
          config={facility.tourConfig}
          facilityName={facility.name}
        />
      </div>

      {/* ── 4. Spatial Navigation Helper Footer ── */}
      <div className="grid gap-4 sm:grid-cols-3 text-xs">
        <div className="rounded-2xl border border-[#DCE5DE] bg-[#FAFBF8] p-4 space-y-1">
          <p className="font-semibold text-[#0D1B17]">Orbit & Free-Look</p>
          <p className="text-[#53665E]">
            Click and drag with mouse or swipe with touch to freely rotate and examine the room angles.
          </p>
        </div>
        <div className="rounded-2xl border border-[#DCE5DE] bg-[#FAFBF8] p-4 space-y-1">
          <p className="font-semibold text-[#0D1B17]">Interactive Zoom</p>
          <p className="text-[#53665E]">
            Use your mouse scroll wheel or pinch on touch displays to inspect details and furnishings.
          </p>
        </div>
        <div className="rounded-2xl border border-[#DCE5DE] bg-[#FAFBF8] p-4 space-y-1">
          <p className="font-semibold text-[#0D1B17]">Floor Plan Waypoints</p>
          <p className="text-[#53665E]">
            Click any numbered waypoint on the 2D floor plan to teleport directly between facility areas.
          </p>
        </div>
      </div>
    </div>
  );
}
