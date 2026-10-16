import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Building2,
  Video,
  Box,
  Bed,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Users,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getFacilityById } from "@/lib/data-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const facilityTypeLabels: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing Facility",
  "rehabilitation-center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "home-health-agency": "Home Health Agency",
  hospice: "Hospice",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilityNetworkDetailPage({ params }: Props) {
  const { id } = await params;

  const signedInUser = await currentUser();
  if (!signedInUser) redirect("/sign-in");

  const facility = await getFacilityById(id);
  if (!facility) notFound();

  const availableBeds = Math.max(
    0,
    facility.capacity - facility.currentOccupancy,
  );
  const occupancyPercent =
    facility.capacity > 0
      ? Math.round((facility.currentOccupancy / facility.capacity) * 100)
      : 0;

  const typeLabel =
    facilityTypeLabels[facility.type] ?? facility.type;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title={facility.name}
        description={`${typeLabel} • ${facility.address.city}, ${facility.address.state}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facility Network", href: "/dashboard/facility-network" },
          { label: facility.name },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98]"
            render={<Link href="/dashboard/facility-network" />}
          >
            <ArrowLeft className="size-3.5 text-[#53665E]" />
            Back to Network
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-[#245C52] px-5 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5"
            render={
              <Link href={`/placements/new?facilityId=${facility.id}`} />
            }
          >
            Initiate Placement
            <ArrowRight className="size-3.5" />
          </Button>
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
            ? "Accepting Patient Referrals"
            : facility.waitlistDays
              ? `Waitlist: ~${facility.waitlistDays} days`
              : "Currently at Capacity"}
        </Badge>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Verified Network Partner
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium bg-[#FAFBF8] text-[#0D1B17] border border-[#DCE5DE]">
          <Star className="size-3.5 fill-[#C05621] text-[#C05621]" />
          {facility.rating} / 5.0 Rating
        </div>
      </div>

      {/* ── 3. KPI Stat Cards ── */}
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
        {/* Left Column: Photos & Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Photo Gallery Card */}
          <Card className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 bg-[#FAFBF8]">
                {facility.media && facility.media.length > 0 ? (
                  facility.media
                    .filter((m) => m.type === "image")
                    .slice(0, 5)
                    .map((m, i) => (
                      <div
                        key={m.id}
                        className={`relative aspect-video sm:aspect-square overflow-hidden bg-[#FAFBF8] ${
                          i === 0 ? "col-span-2 row-span-2 aspect-auto min-h-[260px]" : ""
                        }`}
                      >
                        <Image
                          src={m.url}
                          alt={facility.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ))
                ) : (
                  <div className="col-span-full flex aspect-video items-center justify-center bg-[#FAFBF8] text-[#53665E]/30 p-12">
                    <Building2 className="size-20" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* About & Clinical Specifications Card */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white">
            <CardHeader className="border-b border-[#DCE5DE]/70 pb-4">
              <CardTitle className="font-serif text-xl sm:text-2xl font-medium text-[#0D1B17]">
                Facility Specifications & Clinical Capabilities
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-[#53665E]">
                Operational contacts, licensing, insurance coverage, and care levels.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Contact and address grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                    Contact & Address
                  </h3>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#203E39]">
                    <MapPin className="size-4 shrink-0 text-[#245C52] mt-0.5" />
                    <span>
                      {facility.address.street}, {facility.address.city},{" "}
                      {facility.address.state} {facility.address.zipCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#203E39]">
                    <Phone className="size-4 shrink-0 text-[#245C52]" />
                    <a
                      href={`tel:${facility.phone}`}
                      className="hover:underline font-medium"
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
                      {level.replace(/-/g, " ")}
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
              {facility.contacts && facility.contacts.length > 0 && (
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

              {/* Additional Media Assets */}
              {facility.media && facility.media.length > 0 && (
                <>
                  <Separator className="bg-[#DCE5DE]/70" />
                  <div>
                    <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                      Facility Media & Digital Assets ({facility.media.length})
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {facility.media.map((m) => (
                        <div
                          key={m.id}
                          className="relative aspect-square overflow-hidden rounded-xl border border-[#DCE5DE] bg-[#FAFBF8]"
                        >
                          {m.type === "image" && (
                            <Image
                              src={m.url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="120px"
                            />
                          )}
                          {m.type === "gaussian_splat" && (
                            <div className="flex h-full flex-col items-center justify-center p-2 text-center text-[#245C52]">
                              <Box className="size-5 mb-1" />
                              <span className="text-[10px] font-semibold">3D Tour</span>
                            </div>
                          )}
                          {m.type === "video" && (
                            <div className="flex h-full flex-col items-center justify-center p-2 text-center text-[#255DCE]">
                              <Video className="size-5 mb-1" />
                              <span className="text-[10px] font-semibold">Video</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Census & Actions */}
        <div className="space-y-6">
          {/* Census & Occupancy Card */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-white">
            <CardHeader className="border-b border-[#DCE5DE]/70 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg font-medium text-[#0D1B17]">
                  Bed Census & Capacity
                </CardTitle>
                <Badge
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    facility.hasAvailability
                      ? "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]"
                      : "bg-[#A33632]/10 text-[#A33632] border border-[#A33632]/20",
                  )}
                >
                  {facility.hasAvailability ? "Available" : "At Capacity"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#53665E]">Current Occupancy</span>
                  <span className="font-semibold text-[#0D1B17]">
                    {facility.currentOccupancy} / {facility.capacity} beds
                  </span>
                </div>
                <Progress
                  value={occupancyPercent}
                  className="h-2.5 bg-[#EDF2EC] [&_[data-slot=progress-indicator]]:bg-[#245C52]"
                />
                <div className="flex items-center justify-between text-[11px] text-[#53665E]">
                  <span>{occupancyPercent}% Occupied</span>
                  <span>{availableBeds} beds available</span>
                </div>
              </div>

              {facility.waitlistDays ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60 text-xs">
                  <span className="text-[#53665E]">Estimated Waitlist:</span>
                  <span className="font-semibold text-[#0D1B17]">
                    ~{facility.waitlistDays} days
                  </span>
                </div>
              ) : null}

              <Separator className="bg-[#DCE5DE]/70" />

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60">
                  <p className="text-2xl font-serif font-medium text-[#0D1B17]">
                    {availableBeds}
                  </p>
                  <p className="text-[11px] text-[#53665E] mt-0.5">
                    Available Beds
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60">
                  <div className="flex items-center justify-center gap-1 text-2xl font-serif font-medium text-[#0D1B17]">
                    {facility.rating}
                    <Star className="size-4 fill-[#C05621] text-[#C05621]" />
                  </div>
                  <p className="text-[11px] text-[#53665E] mt-0.5">
                    Verified Rating
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action CTA Card */}
          <Card className="rounded-2xl border border-[#DCE5DE] bg-gradient-to-br from-white to-[#FAFBF8] shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg font-medium text-[#0D1B17]">
                Initiate Placement
              </CardTitle>
              <CardDescription className="text-xs text-[#53665E]">
                Transfer an active patient to this facility with pre-populated clinical orders.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full rounded-xl bg-[#245C52] text-sm font-semibold text-white hover:bg-[#19473F] gap-2 active:scale-[0.98]"
                render={
                  <Link href={`/placements/new?facilityId=${facility.id}`} />
                }
              >
                Start Placement Order
                <ArrowRight className="size-4" />
              </Button>
              <p className="text-center text-[11px] text-[#53665E]">
                Requires clinical discharge or coordinator approval.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
