import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Rotate3d,
  Compass,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FacilityTour } from "@/components/facility-tour/facility-tour";
import { getFacility, getFacilityById } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { isFacilityRecommendedForOrg } from "@/lib/recommended-facilities";
import { roleHasPermission } from "@/lib/permissions";
import { getDefaultTourConfig } from "@/lib/facility-tour";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilityTourPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) redirect("/onboarding");
  if (org.organizationType === "hospital" && !org.isSuperadmin &&
      !await isFacilityRecommendedForOrg(org.organizationId, id)) notFound();

  // Hospital staff tour network facilities owned by other organizations (read-only).
  const own = await getFacility(id, org.organizationId, org.role);
  const facility = own ?? (await getFacilityById(id));
  if (!facility) notFound();

  const canEdit = !!own && roleHasPermission(org.role, "facilities:update");
  const profileHref = own ? `/facilities/${id}` : `/dashboard/facility-network/${id}`;

  const tourConfig = facility.tourConfig ?? getDefaultTourConfig(facility.name);
  const stopCount = tourConfig.stops?.length ?? 0;


  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* ── 1. Page Header with Breadcrumbs & Actions ── */}
      <PageHeader
        title={`${facility.name} — 3D Walkthrough`}
        description={[facility.address?.street, facility.address?.city, facility.address?.state].filter(Boolean).join(", ")}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facilities", href: "/facilities" },
          { label: facility.name, href: profileHref },
          { label: "3D Tour" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
            render={<Link href={profileHref} />}
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
          config={tourConfig}
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
