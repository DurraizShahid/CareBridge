import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  Building2,
  Bed,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  XCircle,
  Star,
  Activity,
  Calendar,
  MapPin,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import {
  getFacilities,
  getReferrals,
  getFacilityUsers,
  getRecentActivity,
  getFacilityDashboardStats,
} from "@/lib/data-access";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMinutes = Math.floor((now - then) / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const referralStatusConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  new: {
    label: "New Referral",
    icon: AlertCircle,
    className: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  },
  reviewing: {
    label: "Under Review",
    icon: Eye,
    className: "bg-[#C05621]/10 text-[#C05621] border border-[#C05621]/20",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    className: "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    className: "bg-[#A33632]/10 text-[#A33632] border border-[#A33632]/20",
  },
};

const facilityTypeLabels: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing Facility",
  "rehabilitation-center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "home-health-agency": "Home Health Agency",
  hospice: "Hospice",
};

export default async function FacilityDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const org = await getServerOrganization();
  if (!org?.organizationId) redirect("/onboarding");

  const role = org.role ?? "customer";
  if (!roleHasPermission(role, "dashboard:facility") && role !== "superadmin") {
    redirect("/dashboard");
  }

  const [scopedFacilities, scopedReferrals, scopedUsers, recentActivity] =
    await Promise.all([
      getFacilities(org.organizationId, role),
      getReferrals(org.organizationId, role),
      getFacilityUsers(org.organizationId, role),
      getRecentActivity(org.organizationId, role),
    ]);

  const currentOperator = scopedUsers.find((u) => u.id === user.id);
  const operatorFacility =
    scopedFacilities.find((f) => f.id === currentOperator?.hospitalId) ||
    scopedFacilities[0];

  const scopedStats = await getFacilityDashboardStats(
    org.organizationId,
    role,
    operatorFacility?.id,
  );

  const userName = user.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user.username ?? "Operator");

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const availableBeds = Math.max(
    0,
    scopedStats.totalCapacity - scopedStats.currentOccupancy,
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="Facility Operations"
        description="Bed census tracking, referral intake queue, admission authorizations, and capacity management."
        userName={userName}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facility Operations" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98]"
            render={<Link href="/facilities" />}
          >
            <Building2 className="size-3.5 text-[#53665E]" />
            All Facilities
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98]"
            render={<Link href="/dashboard/facility-network" />}
          >
            <ExternalLink className="size-3.5" />
            Facility Network
          </Button>
        </div>
      </PageHeader>

      {/* ── 2. Operational Scope & Live Telemetry Pills ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <span className="size-1.5 rounded-full bg-[#245C52] animate-pulse" />
          {todayFormatted}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
          <ShieldCheck className="size-3.5 text-[#245C52]" />
          Facility Operations Scope
        </div>
        {operatorFacility && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20">
            {operatorFacility.name}
          </span>
        )}
      </div>

      {/* ── 3. Key Metric KPI Stat Cards ── */}
      <section
        aria-labelledby="facility-kpi-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="facility-kpi-heading" className="sr-only">
          Facility Key Performance Indicators
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Bed Occupancy"
            value={`${scopedStats.currentOccupancy} / ${scopedStats.totalCapacity}`}
            icon={Bed}
            variant="default"
            trend={{
              value: `${scopedStats.occupancyRate}% rate`,
              positive: scopedStats.occupancyRate <= 85,
            }}
          />
          <StatCard
            title="Available Beds"
            value={availableBeds}
            icon={Bed}
            variant="health"
            trend={
              availableBeds > 0
                ? { value: `${availableBeds} ready`, positive: true }
                : { value: "At capacity", positive: false }
            }
          />
          <StatCard
            title="Incoming Referrals"
            value={scopedStats.pendingReferrals}
            icon={ClipboardList}
            variant="info"
            trend={
              scopedStats.pendingReferrals > 0
                ? {
                    value: `${scopedStats.pendingReferrals} to review`,
                    positive: false,
                  }
                : { value: "Queue clear", positive: true }
            }
          />
          <StatCard
            title="Admissions"
            value={scopedStats.pendingAdmissions}
            icon={Users}
            variant="orange"
          />
          <StatCard
            title="Discharges"
            value={scopedStats.upcomingDischarges}
            icon={Clock}
            variant="purple"
          />
          <StatCard
            title="Monthly Placements"
            value={scopedStats.placementsThisMonth}
            icon={CheckCircle2}
            variant="health"
          />
        </div>
      </section>

      {/* ── 4. Main Operations Grid ── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Referrals Intake Queue */}
        <section
          aria-labelledby="intake-queue-heading"
          className="lg:col-span-2 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between border-b border-[#DCE5DE] pb-3">
            <div>
              <h2
                id="intake-queue-heading"
                className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-[#0D1B17]"
              >
                Incoming Referral Requests
              </h2>
              <p className="text-xs sm:text-sm text-[#53665E]">
                Patient placement transfers requiring triage and bed acceptance.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full bg-[#EDF2EC] px-3 py-1 text-xs font-semibold text-[#203E39] border border-[#DCE5DE]"
            >
              {scopedReferrals.length} Total
            </Badge>
          </div>

          {scopedReferrals.length === 0 ? (
            <Empty className="py-14 border border-dashed border-[#DCE5DE] bg-white/60">
              <EmptyMedia
                variant="icon"
                className="bg-[#EDF2EC] text-[#245C52]"
              >
                <ClipboardList className="size-5" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle className="text-base text-[#0D1B17]">
                  No pending referral requests
                </EmptyTitle>
                <EmptyDescription className="text-xs text-[#53665E]">
                  When regional hospitals or care coordinators refer patients to
                  this facility, their medical requirements and transfer orders
                  will appear here.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full mt-2"
                render={<Link href="/dashboard/facility-network" />}
              >
                Explore Care Network
              </Button>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {scopedReferrals.map((ref) => {
                const config =
                  referralStatusConfig[ref.status] ||
                  referralStatusConfig.reviewing;
                const StatusIcon = config.icon;
                return (
                  <Card
                    key={ref.id}
                    className="border border-[#DCE5DE] bg-white transition-all duration-200 hover:shadow-xs"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif text-base sm:text-lg font-medium text-[#0D1B17] truncate">
                              {ref.patientName}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#EDF2EC] text-[#53665E]">
                              {ref.patientAge} yrs old
                            </span>
                          </div>
                          <p className="text-sm text-[#53665E]">
                            <span className="font-medium text-[#0D1B17]">
                              Diagnosis:
                            </span>{" "}
                            {ref.diagnosis}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#53665E]">
                            <span className="flex items-center gap-1">
                              <Building2 className="size-3 text-[#245C52]" />
                              {ref.referringHospital}
                            </span>
                            <span className="text-[#DCE5DE]">&bull;</span>
                            <span className="capitalize font-medium text-[#203E39]">
                              {ref.careLevel.replace(/-/g, " ")}
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                          <Badge
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                              config.className,
                            )}
                          >
                            <StatusIcon className="size-3.5" />
                            {config.label}
                          </Badge>
                          <span className="text-xs text-[#53665E]">
                            {formatRelativeTime(ref.referredAt)}
                          </span>
                        </div>
                      </div>

                      <Separator className="my-3 bg-[#DCE5DE]/70" />

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-[#53665E]">
                          Referral ID:{" "}
                          <span className="font-mono text-[11px] text-[#0D1B17]">
                            {ref.id}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-full px-3 text-xs font-medium text-[#245C52] hover:bg-[#EDF2EC]"
                          render={<Link href="/referrals" />}
                        >
                          Review Referral
                          <ArrowRight className="ml-1 size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Facility Profile & Network Directory */}
        <div className="flex flex-col gap-6">
          {/* Operator Facility Overview Card */}
          {operatorFacility && (
            <Card className="border border-[#DCE5DE] bg-white">
              <CardHeader className="pb-3 border-b border-[#DCE5DE]/70">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                    <Building2 className="size-3.5 text-[#245C52]" />
                    Designated Facility
                  </div>
                  <Badge
                    className={cn(
                      "gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full",
                      operatorFacility.hasAvailability
                        ? "bg-[#DCE8DA] text-[#203E39] border border-[#C7D3CA]"
                        : "bg-[#A33632]/10 text-[#A33632] border border-[#A33632]/20",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        operatorFacility.hasAvailability
                          ? "bg-[#245C52] animate-pulse"
                          : "bg-[#A33632]",
                      )}
                    />
                    {operatorFacility.hasAvailability
                      ? "Accepting Referrals"
                      : "At Capacity"}
                  </Badge>
                </div>
                <CardTitle className="font-serif text-xl font-medium text-[#0D1B17] mt-1">
                  {operatorFacility.name}
                </CardTitle>
                <CardDescription className="text-xs text-[#53665E]">
                  {facilityTypeLabels[operatorFacility.type] ??
                    operatorFacility.type}{" "}
                  &bull; {operatorFacility.address.city},{" "}
                  {operatorFacility.address.state}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-4">
                {/* Occupancy gauge */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#53665E]">
                      Current Census Occupancy
                    </span>
                    <span className="font-semibold text-[#0D1B17]">
                      {scopedStats.currentOccupancy} /{" "}
                      {scopedStats.totalCapacity} beds
                    </span>
                  </div>
                  <Progress
                    value={scopedStats.occupancyRate}
                    className="h-2.5 bg-[#EDF2EC] [&_[data-slot=progress-indicator]]:bg-[#245C52]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#53665E]">
                    <span>{scopedStats.occupancyRate}% Capacity</span>
                    <span>{availableBeds} beds available</span>
                  </div>
                </div>

                <Separator className="bg-[#DCE5DE]/70" />

                {/* Metrics 3-box */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60">
                    <div className="flex items-center justify-center gap-1 text-sm font-bold text-[#0D1B17]">
                      {operatorFacility.rating}
                      <Star className="size-3.5 fill-[#C05621] text-[#C05621]" />
                    </div>
                    <span className="text-[11px] text-[#53665E]">Rating</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60">
                    <span className="text-sm font-bold text-[#0D1B17]">
                      {scopedStats.upcomingDischarges}
                    </span>
                    <p className="text-[11px] text-[#53665E]">Discharges</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60">
                    <span className="text-sm font-bold text-[#0D1B17]">
                      {scopedStats.pendingAdmissions}
                    </span>
                    <p className="text-[11px] text-[#53665E]">Admissions</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full border-[#DCE5DE] text-xs font-medium text-[#203E39] hover:bg-[#EDF2EC]"
                  render={
                    <Link
                      href={`/dashboard/facility-network/${operatorFacility.id}`}
                    />
                  }
                >
                  View Facility Profile
                  <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Regional Network Capacity Summary */}
          <Card className="border border-[#DCE5DE] bg-white">
            <CardHeader className="pb-3 border-b border-[#DCE5DE]/70">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg font-medium text-[#0D1B17]">
                  Partner Care Network
                </CardTitle>
                <span className="text-xs text-[#53665E]">
                  {scopedFacilities.length} Facilities
                </span>
              </div>
              <CardDescription className="text-xs text-[#53665E]">
                Sibling facility census and regional bed availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-3">
              {scopedFacilities.slice(0, 4).map((fac) => (
                <div
                  key={fac.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#DCE5DE]/60 bg-[#FAFBF8] transition-colors hover:bg-[#EDF2EC]/50"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <Link
                      href={`/dashboard/facility-network/${fac.id}`}
                      className="font-medium text-xs sm:text-sm text-[#0D1B17] hover:underline truncate block"
                    >
                      {fac.name}
                    </Link>
                    <p className="text-[11px] text-[#53665E]">
                      {fac.currentOccupancy}/{fac.capacity} beds &bull;{" "}
                      {fac.address.city}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      fac.hasAvailability
                        ? "bg-[#DCE8DA] text-[#203E39] border-[#C7D3CA]"
                        : "bg-[#A33632]/10 text-[#A33632] border-[#A33632]/20",
                    )}
                  >
                    {fac.hasAvailability ? "Available" : "Full"}
                  </Badge>
                </div>
              ))}

              <div className="pt-2 text-center">
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs font-semibold text-[#245C52] hover:text-[#19473F] p-0"
                  render={<Link href="/dashboard/facility-network" />}
                >
                  Browse Full Network Directory &rarr;
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Operations Activity */}
          {recentActivity && recentActivity.length > 0 && (
            <Card className="border border-[#DCE5DE] bg-white">
              <CardHeader className="pb-3 border-b border-[#DCE5DE]/70">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-[#245C52]" />
                  <CardTitle className="font-serif text-lg font-medium text-[#0D1B17]">
                    Recent Activity
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-2.5">
                {recentActivity.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-2.5 text-xs text-[#53665E]"
                  >
                    <span className="size-1.5 rounded-full bg-[#245C52] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0D1B17] truncate">
                        {act.title}
                      </p>
                      <p className="text-[11px] text-[#53665E] line-clamp-1">
                        {act.description}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#53665E] shrink-0">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
