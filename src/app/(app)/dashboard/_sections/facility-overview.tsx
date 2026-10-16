import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Building2,
  Star,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  getFacilityDashboardStats,
  getFacilityUsers,
  getReferrals,
  getFacilities,
} from "@/lib/data-access";
import { formatRelativeTime, facilityTypeLabels } from "./shared";
import type { SectionProps } from "./shared";

const referralStatusConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  new: {
    label: "New",
    icon: AlertCircle,
    className: "bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20",
  },
  reviewing: {
    label: "Reviewing",
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

type FacilityOverviewProps = SectionProps & {
  userId: string;
};

export default async function FacilityOverview({
  organizationId,
  role,
  userId,
}: FacilityOverviewProps) {
  const [scopedFacilities, scopedReferrals, scopedUsers] = await Promise.all([
    getFacilities(organizationId, role),
    getReferrals(organizationId, role),
    getFacilityUsers(organizationId, role),
  ]);

  const currentOperator = scopedUsers.find((user) => user.id === userId);
  const operatorFacility =
    scopedFacilities.find((f) => f.id === currentOperator?.hospitalId) ||
    scopedFacilities[0];
  const scopedStats = await getFacilityDashboardStats(
    organizationId,
    role,
    operatorFacility?.id,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Left Column: Referral Requests ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#DCE5DE] pb-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#245C52]" />
            <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
              Referral Requests
            </h2>
          </div>
          <span className="text-xs font-medium text-[#53665E]">
            {scopedReferrals.length} total
          </span>
        </div>

        {scopedReferrals.length === 0 ? (
          <Empty className="py-12 border border-dashed border-[#DCE5DE] bg-white/60">
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
                Incoming referrals routed to your facility will appear here for intake review.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {scopedReferrals.map((ref) => {
              const config =
                referralStatusConfig[ref.status] || referralStatusConfig.reviewing;
              const StatusIcon = config.icon;
              return (
                <Card
                  key={ref.id}
                  className="border border-[#DCE5DE] bg-white transition-all duration-200 hover:shadow-xs"
                >
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-serif text-base font-medium text-[#0D1B17] truncate">
                        {ref.patientName}
                      </span>
                      <span className="text-xs text-[#53665E]">
                        {ref.patientAge} yrs old
                      </span>
                    </div>
                    <p className="text-sm text-[#53665E]">{ref.diagnosis}</p>
                    <div className="flex items-center gap-3 text-xs text-[#53665E] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3 text-[#245C52]" />
                        {ref.referringHospital}
                      </span>
                      <span className="text-[#DCE5DE]">&middot;</span>
                      <span className="capitalize font-medium text-[#203E39]">
                        {ref.careLevel.replace(/-/g, " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[#DCE5DE]/60">
                      <Badge
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full",
                          config.className,
                        )}
                      >
                        <StatusIcon className="size-3" />
                        {config.label}
                      </Badge>
                      <span className="text-xs text-[#53665E]">
                        {formatRelativeTime(ref.referredAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Right Column: My Facility & Network ── */}
      <section className="flex flex-col gap-6">
        {operatorFacility && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#DCE5DE] pb-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#245C52]" />
                <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
                  Designated Facility
                </h2>
              </div>
            </div>

            <Card className="border border-[#DCE5DE] bg-white">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-xl font-medium text-[#0D1B17] truncate">
                      {operatorFacility.name}
                    </h3>
                    <p className="text-xs text-[#53665E] mt-0.5">
                      {facilityTypeLabels[operatorFacility.type] ??
                        operatorFacility.type}
                    </p>
                    <p className="text-xs text-[#53665E] mt-0.5">
                      {operatorFacility.address.city},{" "}
                      {operatorFacility.address.state}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full",
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
                    <span>{scopedStats.occupancyRate}% Occupied</span>
                    <span>
                      {Math.max(
                        0,
                        scopedStats.totalCapacity - scopedStats.currentOccupancy,
                      )}{" "}
                      beds available
                    </span>
                  </div>
                </div>

                <Separator className="bg-[#DCE5DE]/70" />

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60">
                    <div className="flex items-center justify-center gap-1 text-base font-bold text-[#0D1B17]">
                      {operatorFacility.rating}
                      <Star className="size-3.5 fill-[#C05621] text-[#C05621]" />
                    </div>
                    <p className="text-[11px] text-[#53665E] mt-0.5">Rating</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60">
                    <p className="text-base font-bold text-[#0D1B17]">
                      {scopedStats.upcomingDischarges}
                    </p>
                    <p className="text-[11px] text-[#53665E] mt-0.5">Discharges</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAFBF8] border border-[#DCE5DE]/60">
                    <p className="text-base font-bold text-[#0D1B17]">
                      {scopedStats.pendingAdmissions}
                    </p>
                    <p className="text-[11px] text-[#53665E] mt-0.5">Admissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#DCE5DE] pb-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#245C52]" />
              <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
                Facility Network
              </h2>
            </div>
            <span className="text-xs text-[#53665E]">
              {scopedFacilities.length} Facilities
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {scopedFacilities.slice(0, 4).map((fac) => (
              <div
                key={fac.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#DCE5DE] bg-white transition-colors hover:bg-[#FAFBF8]"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <Link
                    href={`/dashboard/facility-network/${fac.id}`}
                    className="font-medium text-xs sm:text-sm text-[#0D1B17] hover:underline truncate block"
                  >
                    {fac.name}
                  </Link>
                  <p className="text-[11px] text-[#53665E]">
                    {fac.currentOccupancy}/{fac.capacity} beds &middot;{" "}
                    {facilityTypeLabels[fac.type] ?? fac.type}
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
          </div>

          <div className="text-right">
            <Button
              variant="link"
              size="sm"
              nativeButton={false}
              render={<Link href="/facilities" />}
              className="h-auto p-0 text-xs font-semibold text-[#245C52] hover:text-[#19473F]"
            >
              View all facilities &rarr;
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
