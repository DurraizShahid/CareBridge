import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Pencil,
  Users,
  ClipboardList,
  ImageIcon,
  Video,
  Box,
  CheckCircle2,
  XCircle,
  Rotate3d,
  Building2,
  Bed,
  Clock,
  ShieldCheck,
  ExternalLink,
  Award,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  getFacility,
  getPlacements,
  getFacilityUsers,
  getFacilityPatientMatches,
} from "@/lib/data-access";
import type { PatientMatchResult } from "@/types";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { DeleteFacilityDialog } from "./delete-dialog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const facilityTypeLabels: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing Facility",
  "skilled_nursing_facility": "Skilled Nursing Facility",
  "rehabilitation-center": "Rehabilitation Center",
  "rehabilitation_center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "assisted_living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "long_term_care": "Long-Term Care",
  "home-health-agency": "Home Health Agency",
  "home_health_agency": "Home Health Agency",
  hospice: "Hospice",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  assessment: {
    label: "Assessment",
    className: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  },
  searching: {
    label: "Searching",
    className: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  },
  matching: {
    label: "Matching",
    className: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  },
  "pending-approval": {
    label: "Pending Approval",
    className: "bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20",
  },
  pending_approval: {
    label: "Pending Approval",
    className: "bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20",
  },
  approved: {
    label: "Approved",
    className: "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  },
  completed: {
    label: "Completed",
    className: "bg-[#EDF2EC] text-[#53665E] border border-[#DCE5DE]",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[#A33632]/10 text-[#A33632] border border-[#A33632]/20",
  },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilityDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) redirect("/onboarding");
  if (org.organizationType === "hospital") {
    redirect(`/dashboard/facility-network/${id}`);
  }
  const organizationId = org.organizationId;
  const role = org.role;

  const facility = await getFacility(id, organizationId, role);
  if (!facility) notFound();

  const [placements, facilityUsers, matchedPatients] = await Promise.all([
    getPlacements(organizationId, role),
    getFacilityUsers(organizationId, role),
    getFacilityPatientMatches(id, organizationId, role),
  ]);

  const facilityPlacements = placements.filter(
    (p) => p.selectedFacilityId === id || p.facilityId === id,
  );

  const staff = facilityUsers.filter((u) => u.hospitalId === id);

  const canEdit = roleHasPermission(role, "facilities:update");
  const canDelete = roleHasPermission(role, "facilities:delete");

  const availableBeds = Math.max(
    0,
    facility.capacity - facility.currentOccupancy,
  );
  const occupancyPercent =
    facility.capacity > 0
      ? Math.round((facility.currentOccupancy / facility.capacity) * 100)
      : 0;

  const typeLabel = facilityTypeLabels[facility.type] ?? facility.type;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── 1. Page Header with Action Bar ── */}
      <PageHeader
        title={facility.name}
        description={typeLabel}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facilities", href: "/facilities" },
          { label: facility.name },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98]"
            render={<Link href="/facilities" />}
          >
            <ArrowLeft className="mr-1.5 size-3.5 text-[#53665E]" />
            All Facilities
          </Button>

          {/* 3D Tour Button (Always prominently visible if configured) */}
          {facility.tourConfig ? (
            <Button
              size="sm"
              className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
              render={<Link href={`/facilities/${id}/tour`} />}
            >
              <Rotate3d className="size-3.5" />
              Take 3D Tour
            </Button>
          ) : canEdit ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
              render={<Link href={`/facilities/${id}/tour/edit`} />}
            >
              <Rotate3d className="size-3.5 text-[#245C52]" />
              Set Up 3D Tour
            </Button>
          ) : null}

          {canEdit && (
            <>
              {facility.tourConfig && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
                  render={<Link href={`/facilities/${id}/tour/edit`} />}
                >
                  <Rotate3d className="size-3.5 text-[#53665E]" />
                  Edit Tour
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
                render={<Link href={`/facilities/${id}/edit`} />}
              >
                <Pencil className="size-3.5 text-[#53665E]" />
                Edit Facility
              </Button>
            </>
          )}

          {canDelete && (
            <DeleteFacilityDialog facilityId={id} facilityName={facility.name} />
          )}
        </div>
      </PageHeader>

      {/* ── 2. Scope & Status Pills ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge
          className={cn(
            "rounded-full px-3 py-1 font-medium text-xs border gap-1.5",
            facility.hasAvailability
              ? "bg-[#DCE8DA] text-[#203E39] border-[#C7D3CA]"
              : facility.waitlistDays
                ? "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE]"
                : "bg-[#A33632]/10 text-[#A33632] border-[#A33632]/20",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              facility.hasAvailability ? "bg-[#245C52] animate-pulse" : "bg-[#A33632]",
            )}
          />
          {facility.hasAvailability
            ? `${availableBeds} Open Beds Available`
            : facility.waitlistDays
              ? `Waitlist: ~${facility.waitlistDays} days`
              : "Currently at Capacity"}
        </Badge>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Verified CareBridge Network
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium bg-[#FAFBF8] text-[#0D1B17] border border-[#DCE5DE]">
          <Star className="size-3.5 fill-[#C05621] text-[#C05621]" />
          {facility.rating} / 5.0 ({facility.reviewsCount} reviews)
        </div>

        {facility.tourConfig && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20">
            <Rotate3d className="size-3.5 text-[#255DCE]" />
            3D Walkthrough Configured
          </div>
        )}
      </div>

      {/* ── 3. KPI Stat Cards Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Beds"
          value={availableBeds}
          icon={Bed}
          variant="health"
          trend={
            availableBeds > 0
              ? { value: `${availableBeds} open`, positive: true }
              : { value: "Full", positive: false }
          }
        />
        <StatCard
          title="Current Census"
          value={`${facility.currentOccupancy} / ${facility.capacity}`}
          icon={Building2}
          variant="default"
          trend={{
            value: `${occupancyPercent}% occupancy`,
            positive: occupancyPercent <= 85,
          }}
        />
        <StatCard
          title="Star Rating"
          value={`${facility.rating}`}
          icon={Star}
          variant="orange"
          trend={{
            value: `${facility.reviewsCount} reviews`,
            positive: true,
            neutral: true,
          }}
        />
        <StatCard
          title="Waitlist Timeline"
          value={facility.waitlistDays ? `~${facility.waitlistDays}d` : "Immediate"}
          icon={Clock}
          variant="info"
        />
      </div>

      {/* ── 4. Main Profile & Actions Grid ── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Photos, 3D Tour Showcase, Profile & Clinical Specs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Featured 3D Virtual Tour Showcase Banner */}
          {facility.tourConfig ? (
            <Card className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-gradient-to-br from-[#FAFBF8] to-white shadow-xs">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#245C52]/10 px-2.5 py-0.5 text-xs font-semibold text-[#245C52]">
                      <Rotate3d className="size-3.5" />
                      Interactive 3D Walkthrough Ready
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#0D1B17]">
                      {facility.tourConfig.title || facility.tourConfig.welcome || `Explore ${facility.name} in 3D`}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#53665E] max-w-xl leading-relaxed">
                      Experience patient rooms, admission lobbies, and care hallways with interactive spatial navigation and architectural floor plans.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {facility.tourConfig.stops?.slice(0, 4).map((s, idx) => (
                        <span
                          key={s.id || idx}
                          className="inline-flex items-center gap-1 rounded-full bg-white border border-[#DCE5DE] px-2.5 py-0.5 text-[11px] font-medium text-[#203E39]"
                        >
                          <span className="size-1.5 rounded-full bg-[#245C52]" />
                          {s.label || `Stop ${idx + 1}`}
                        </span>
                      ))}
                      {facility.tourConfig.stops && facility.tourConfig.stops.length > 4 && (
                        <span className="text-[11px] text-[#53665E] self-center">
                          +{facility.tourConfig.stops.length - 4} more stops
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="rounded-full bg-[#245C52] px-5 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs w-full sm:w-auto"
                      render={<Link href={`/facilities/${id}/tour`} />}
                    >
                      <Rotate3d className="size-3.5" />
                      Launch 3D Tour
                    </Button>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-[#DCE5DE] text-xs font-semibold text-[#203E39] hover:bg-[#FAFBF8] w-full sm:w-auto"
                        render={<Link href={`/facilities/${id}/tour/edit`} />}
                      >
                        Edit Tour Stops
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : canEdit ? (
            <Card className="rounded-2xl border border-dashed border-[#DCE5DE] bg-[#FAFBF8] p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-medium text-[#0D1B17] flex items-center gap-2">
                    <Rotate3d className="size-4 text-[#245C52]" />
                    Set Up 3D Virtual Tour
                  </h3>
                  <p className="text-xs sm:text-sm text-[#53665E] max-w-lg">
                    Add a virtual walkthrough for hospital social workers, discharge planners, and patient families to explore your room suites and amenities.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs shrink-0"
                  render={<Link href={`/facilities/${id}/tour/edit`} />}
                >
                  <Rotate3d className="size-3.5" />
                  Configure Tour
                </Button>
              </div>
            </Card>
          ) : null}

          {/* Photo Gallery Card */}
          <Card className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white">
            <CardHeader className="border-b border-[#DCE5DE]/70 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-[#0D1B17]">
                  <ImageIcon className="size-4 text-[#245C52]" />
                  Facility Media & Photography
                </CardTitle>
                <span className="text-xs text-[#53665E]">
                  {facility.media ? `${facility.media.length} media items` : "Standard profile"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#FAFBF8] rounded-xl p-2 border border-[#DCE5DE]/60">
                {facility.media && facility.media.length > 0 ? (
                  facility.media.map((m, i) => (
                    <div
                      key={m.id}
                      className={`group relative overflow-hidden rounded-xl border border-[#DCE5DE] bg-white ${
                        i === 0 ? "col-span-2 row-span-2 min-h-[220px]" : "aspect-video sm:aspect-square"
                      }`}
                    >
                      {m.type === "image" && (
                        <Image
                          src={m.url}
                          alt={facility.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      )}
                      {m.type === "gaussian_splat" && (
                        <Link
                          href={`/facilities/${id}/tour`}
                          className="flex h-full w-full flex-col items-center justify-center p-3 text-center transition-colors hover:bg-[#FAFBF8] focus:outline-none"
                        >
                          <div className="flex size-10 items-center justify-center rounded-full bg-[#245C52]/10 text-[#245C52] mb-1.5 group-hover:scale-110 transition-transform">
                            <Box className="size-5" />
                          </div>
                          <span className="text-xs font-semibold text-[#0D1B17]">3D Virtual Tour</span>
                          <span className="text-[10px] text-[#245C52] font-medium flex items-center gap-0.5 mt-0.5">
                            Launch Walkthrough <ArrowRight className="size-2.5" />
                          </span>
                        </Link>
                      )}
                      {m.type === "video" && (
                        <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-[#53665E]">
                          <Video className="size-6 text-[#245C52] mb-1" />
                          <span className="text-[11px] font-medium">Video Tour</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                        <span className="text-[10px] font-medium text-white capitalize">
                          {m.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex aspect-video items-center justify-center bg-[#FAFBF8] text-[#53665E]/30 p-12">
                    <Building2 className="size-16" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile & Clinical Specifications Card */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white">
            <CardHeader className="border-b border-[#DCE5DE]/70 pb-4">
              <CardTitle className="font-serif text-xl sm:text-2xl font-medium text-[#0D1B17]">
                Facility Specifications & Clinical Capabilities
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-[#53665E]">
                Operational contacts, licensing, payer coverage, and care levels.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {facility.description && (
                <div className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60 p-4">
                  <p className="text-xs sm:text-sm text-[#203E39] leading-relaxed">
                    {facility.description}
                  </p>
                </div>
              )}

              {/* Contact and address grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                    Contact & Address
                  </h3>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#203E39]">
                    <MapPin className="size-4 shrink-0 text-[#245C52] mt-0.5" />
                    <span>
                      {[
                        facility.address?.street,
                        facility.address?.city,
                        [facility.address?.state, facility.address?.zipCode].filter(Boolean).join(" "),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#203E39]">
                    <Phone className="size-4 shrink-0 text-[#245C52]" />
                    <a
                      href={`tel:${facility.phone}`}
                      className="hover:underline font-medium text-[#0D1B17]"
                    >
                      {facility.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#203E39]">
                    <Mail className="size-4 shrink-0 text-[#245C52]" />
                    <a
                      href={`mailto:${facility.email}`}
                      className="hover:underline text-[#245C52]"
                    >
                      {facility.email}
                    </a>
                  </div>
                  {facility.website && (
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#203E39]">
                      <Globe className="size-4 shrink-0 text-[#245C52]" />
                      <a
                        href={facility.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#255DCE] hover:underline inline-flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                    Government Programs & Payer Coverage
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[#53665E]">Medicare:</span>
                    <Badge
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        facility.acceptsMedicare
                          ? "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]"
                          : "bg-[#EDF2EC] text-[#53665E] border border-[#DCE5DE]",
                      )}
                    >
                      {facility.acceptsMedicare ? "Accepted" : "Not Accepted"}
                    </Badge>

                    <span className="ml-2 text-xs font-medium text-[#53665E]">Medicaid:</span>
                    <Badge
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        facility.acceptsMedicaid
                          ? "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]"
                          : "bg-[#EDF2EC] text-[#53665E] border border-[#DCE5DE]",
                      )}
                    >
                      {facility.acceptsMedicaid ? "Accepted" : "Not Accepted"}
                    </Badge>
                  </div>

                  {facility.licensure.length > 0 && (
                    <div className="pt-2">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                        Licensure
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {facility.licensure.map((l) => (
                          <Badge
                            key={l}
                            variant="outline"
                            className="rounded-full bg-[#FAFBF8] border-[#DCE5DE] text-xs text-[#203E39]"
                          >
                            {l}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {facility.accreditations.length > 0 && (
                    <div className="pt-1">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                        Accreditations
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {facility.accreditations.map((a) => (
                          <Badge
                            key={a}
                            variant="outline"
                            className="rounded-full bg-[#FAFBF8] border-[#DCE5DE] text-xs text-[#203E39]"
                          >
                            <Award className="size-3 mr-1 text-[#245C52]" />
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-[#DCE5DE]/70" />

              {/* Care Levels Offered */}
              <div>
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                  Care Levels Offered
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {facility.careLevelsOffered.map((level) => (
                    <Badge
                      key={level}
                      className="rounded-full bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE] px-3 py-1 text-xs font-medium capitalize"
                    >
                      {level.replace(/-/g, " ").replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              {facility.specialties.length > 0 && (
                <div>
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                    Clinical Specialties
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {facility.specialties.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="rounded-full bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE] px-3 py-1 text-xs font-medium"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Commercial Insurance Accepted */}
              <div>
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                  Commercial Insurance Accepted
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {facility.insuranceAccepted.map((ins) => (
                    <Badge
                      key={ins}
                      variant="outline"
                      className="rounded-full bg-[#FAFBF8] text-[#203E39] border-[#DCE5DE] px-2.5 py-0.5 text-xs"
                    >
                      {ins}
                    </Badge>
                  ))}
                  {facility.insuranceAccepted.length === 0 && (
                    <span className="text-xs text-[#53665E]">
                      No commercial insurance carriers listed
                    </span>
                  )}
                </div>
              </div>

              {/* Key Facility Contacts */}
              {Array.isArray(facility.contacts) && facility.contacts.length > 0 && (
                <>
                  <Separator className="bg-[#DCE5DE]/70" />
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                      Facility Key Contacts
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {facility.contacts.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] p-3 text-xs flex flex-col gap-1"
                        >
                          <p className="font-semibold text-sm text-[#0D1B17]">
                            {c.name}
                          </p>
                          <p className="font-medium text-[#245C52]">{c.role}</p>
                          {c.phone && (
                            <p className="text-[#53665E] flex items-center gap-1.5 pt-1">
                              <Phone className="size-3 text-[#53665E]" />
                              {c.phone}
                            </p>
                          )}
                          {c.email && (
                            <p className="text-[#53665E] flex items-center gap-1.5">
                              <Mail className="size-3 text-[#53665E]" />
                              {c.email}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Matched Patients Section */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white">
            <CardHeader className="border-b border-[#DCE5DE]/70 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-lg font-medium text-[#0D1B17] flex items-center gap-2">
                    <Users className="size-4 text-[#245C52]" />
                    Matched Patients ({matchedPatients.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-[#53665E]">
                    Hospital intake patients whose care criteria match this facility.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {matchedPatients.length === 0 ? (
                <Empty className="border border-[#DCE5DE] bg-[#FAFBF8] rounded-xl p-8">
                  <EmptyMedia variant="icon" className="bg-white border border-[#DCE5DE] size-10">
                    <Users className="size-5 text-[#53665E]" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-base font-medium text-[#0D1B17]">
                      No active patient matches
                    </EmptyTitle>
                    <EmptyDescription className="text-xs text-[#53665E]">
                      Currently no patients in the hospital queue meet this facility&apos;s care level and insurance criteria.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-4">
                  {matchedPatients.map((result: PatientMatchResult) => {
                    const { patient, breakdown } = result;
                    return (
                      <div
                        key={patient.id}
                        className="rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] p-4 text-xs transition-shadow hover:shadow-xs"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/patients/${patient.id}`}
                              className="font-serif text-base font-medium text-[#0D1B17] hover:text-[#245C52] transition-colors"
                            >
                              {patient.firstName} {patient.lastName}
                            </Link>
                            <p className="text-xs text-[#53665E]">
                              {patient.primaryDiagnosis} &middot;{" "}
                              <span className="capitalize">{patient.careLevelRequired.replace(/-/g, " ")}</span>
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              breakdown.totalScore >= 80
                                ? "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]"
                                : breakdown.totalScore >= 60
                                  ? "bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20"
                                  : "bg-[#A33632]/10 text-[#A33632] border border-[#A33632]/20",
                            )}
                          >
                            {breakdown.totalScore} pts
                          </Badge>
                        </div>

                        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                          <span className="flex items-center gap-1.5">
                            {breakdown.careLevelMatch ? (
                              <CheckCircle2 className="size-3.5 text-[#245C52]" />
                            ) : (
                              <XCircle className="size-3.5 text-[#A33632]" />
                            )}
                            <span className="text-[#203E39]">Care Level</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            {breakdown.insuranceAccepted ? (
                              <CheckCircle2 className="size-3.5 text-[#245C52]" />
                            ) : (
                              <XCircle className="size-3.5 text-[#A33632]" />
                            )}
                            <span className="text-[#203E39]">Insurance</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            {breakdown.hasAvailability ? (
                              <CheckCircle2 className="size-3.5 text-[#245C52]" />
                            ) : (
                              <XCircle className="size-3.5 text-[#A33632]" />
                            )}
                            <span className="text-[#203E39]">Availability</span>
                          </span>
                        </div>

                        <div className="rounded-lg bg-white border border-[#DCE5DE]/60 p-2.5 text-xs text-[#53665E]">
                          {result.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Capacity, Placements & Staff */}
        <div className="space-y-6">
          {/* Capacity Card */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white">
            <CardHeader className="border-b border-[#DCE5DE]/70 pb-4">
              <CardTitle className="font-serif text-lg font-medium text-[#0D1B17]">
                Bed Census & Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#53665E]">Intake Status</span>
                <Badge
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    facility.hasAvailability
                      ? "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]"
                      : "bg-[#A33632]/10 text-[#A33632] border border-[#A33632]/20",
                  )}
                >
                  {facility.hasAvailability ? "Available" : "At Capacity"}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#53665E]">Current Occupancy</span>
                  <span className="font-semibold text-[#0D1B17]">
                    {facility.currentOccupancy} / {facility.capacity} beds
                  </span>
                </div>
                <Progress
                  value={occupancyPercent}
                  className={cn(
                    "h-2 bg-[#FAFBF8] border border-[#DCE5DE]/60",
                    occupancyPercent >= 95
                      ? "[&>div]:bg-[#A33632]"
                      : occupancyPercent >= 80
                        ? "[&>div]:bg-[#C05621]"
                        : "[&>div]:bg-[#245C52]",
                  )}
                />
                <p className="text-right text-[11px] text-[#53665E]">
                  {occupancyPercent}% capacity utilized
                </p>
              </div>

              {facility.waitlistDays && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#53665E]">Estimated Waitlist</span>
                  <span className="font-medium text-[#0D1B17]">
                    ~{facility.waitlistDays} days
                  </span>
                </div>
              )}

              <Separator className="bg-[#DCE5DE]/70" />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-xl bg-[#FAFBF8] p-3 border border-[#DCE5DE]">
                  <p className="font-serif text-2xl font-medium text-[#0D1B17]">
                    {availableBeds}
                  </p>
                  <p className="text-[11px] text-[#53665E] font-medium mt-0.5">
                    Available Beds
                  </p>
                </div>
                <div className="rounded-xl bg-[#FAFBF8] p-3 border border-[#DCE5DE]">
                  <p className="font-serif text-2xl font-medium text-[#0D1B17]">
                    {facility.reviewsCount}
                  </p>
                  <p className="text-[11px] text-[#53665E] font-medium mt-0.5">
                    Verified Reviews
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full rounded-full bg-[#245C52] text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
                  render={<Link href={`/placements/new?facilityId=${facility.id}`} />}
                >
                  Initiate Patient Placement
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Placements Section */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white">
            <CardHeader className="border-b border-[#DCE5DE]/70 pb-4">
              <CardTitle className="font-serif text-lg font-medium text-[#0D1B17] flex items-center gap-2">
                <ClipboardList className="size-4 text-[#245C52]" />
                Active Placements ({facilityPlacements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {facilityPlacements.length === 0 ? (
                <Empty className="border border-[#DCE5DE] bg-[#FAFBF8] rounded-xl p-6">
                  <EmptyMedia variant="icon" className="bg-white border border-[#DCE5DE] size-9">
                    <ClipboardList className="size-4 text-[#53665E]" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-sm font-medium text-[#0D1B17]">
                      No active placements
                    </EmptyTitle>
                    <EmptyDescription className="text-xs text-[#53665E]">
                      No placement workflows currently underway for this care home.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-3">
                  {facilityPlacements.map((plc) => {
                    const cfg = statusConfig[plc.status] ?? {
                      label: plc.status,
                      className: "bg-[#EDF2EC] text-[#53665E] border border-[#DCE5DE]",
                    };
                    return (
                      <Link
                        key={plc.id}
                        href={`/placements/${plc.id}`}
                        className="flex items-center justify-between rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] p-3 text-xs transition-colors hover:bg-white focus:outline-none"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-[#0D1B17]">
                            {plc.id}
                          </p>
                          <p className="text-[#53665E] capitalize">
                            {plc.careLevel.replace(/-/g, " ").replace(/_/g, " ")} &middot;{" "}
                            {plc.priority} priority
                          </p>
                        </div>
                        <Badge className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", cfg.className)}>
                          {cfg.label}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staff Card */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white">
            <CardHeader className="border-b border-[#DCE5DE]/70 pb-4">
              <CardTitle className="font-serif text-lg font-medium text-[#0D1B17] flex items-center gap-2">
                <Users className="size-4 text-[#245C52]" />
                Facility Staff ({staff.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {staff.length === 0 ? (
                <Empty className="border border-[#DCE5DE] bg-[#FAFBF8] rounded-xl p-6">
                  <EmptyMedia variant="icon" className="bg-white border border-[#DCE5DE] size-9">
                    <Users className="size-4 text-[#53665E]" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-sm font-medium text-[#0D1B17]">
                      No staff assigned
                    </EmptyTitle>
                    <EmptyDescription className="text-xs text-[#53665E]">
                      No care coordinators or administrators assigned to this site yet.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-3">
                  {staff.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] p-3 text-xs space-y-1"
                    >
                      <p className="font-semibold text-sm text-[#0D1B17]">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="font-medium text-[#245C52]">{u.title || "Facility Staff"}</p>
                      <p className="text-[#53665E] flex items-center gap-1.5 pt-0.5">
                        <Mail className="size-3 text-[#53665E]" />
                        {u.email}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
