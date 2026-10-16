import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { AuthorizationError, getServerOrganization } from "@/lib/server-organization";
import { currentUser } from "@clerk/nextjs/server";
import { getDashboardWidgetData } from "@/lib/data-access";
import StatsGrid from "./_sections/stats-grid";
import { AppointmentsCard } from "./_sections/appointments-card";
import { ActivityCard } from "./_sections/activity-card";
import { ProgressCard } from "./_sections/progress-card";
import { AdvantagesCard } from "./_sections/advantages-card";
import { ContractTypeCard } from "./_sections/contract-type-card";
import { PlacementsByMonthCard } from "./_sections/placements-by-month-card";
import WelcomeCard from "./_sections/welcome-card";
import { PipelineBar } from "./_sections/pipeline-bar";
import { StatsGridSkeleton } from "@/components/dashboard-skeletons";
import {
  Building2,
  Users,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  // Fail closed: no verified membership means no dashboard, but send the
  // user to onboarding instead of surfacing the AuthorizationError as a 500.
  const org = await getServerOrganization().catch((err) => {
    if (err instanceof AuthorizationError) redirect("/onboarding");
    throw err;
  });
  const user = await currentUser();
  const organizationId = org?.organizationId ?? "";
  if (!organizationId) {
    redirect("/onboarding");
  }
  const role = org?.role ?? "customer";
  const userName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user?.username ?? "Admin");

  const widgets = await getDashboardWidgetData(organizationId, role);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const roleDisplayLabel =
    role === "superadmin"
      ? "Platform Administrator"
      : role === "facility-coordinator"
      ? "Facility Coordinator"
      : role === "administrator"
      ? "Hospital Administrator"
      : role === "discharge-planner"
      ? "Discharge Planner"
      : role === "social-worker"
      ? "Social Worker"
      : "Care Coordinator";

  const hasZeroPlacements = widgets.header.totalPlacements === 0;

  return (
    <div className="flex flex-col gap-8 sm:gap-10 pb-8">
      {/* ── 1. Hero Workspace Overview ── */}
      <section aria-labelledby="dashboard-heading" className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
              <span className="size-1.5 rounded-full bg-[#245C52] animate-pulse" />
              {todayFormatted}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#DCE8DA]/70 text-[#203E39] border border-[#C7D3CA]">
              <ShieldCheck className="size-3.5 text-[#245C52]" />
              {roleDisplayLabel}
            </div>

            {role === "superadmin" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#255DCE]/10 text-[#255DCE] border border-[#255DCE]/20">
                System-Wide Scope
              </span>
            )}
          </div>

          {/* Heading & Subtitle */}
          <div className="flex flex-col gap-2 max-w-3xl">
            <h1
              id="dashboard-heading"
              className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.08] font-normal tracking-tight text-[#0D1B17]"
            >
              Welcome back, {userName}.
            </h1>
            <p className="text-sm sm:text-base text-[#53665E] leading-relaxed">
              Real-time placement pipeline, care setting coordination, and regional partner network availability.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              href="/dashboard/facility-network"
              className="inline-flex items-center gap-2 rounded-full bg-[#245C52] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#19473F] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Building2 className="size-3.5" />
              Browse Facility Network
            </Link>
            <Link
              href="/patients"
              className="inline-flex items-center gap-2 rounded-full bg-[#EDF2EC] px-4 py-2 text-xs font-semibold text-[#203E39] border border-[#DCE5DE] transition-all hover:bg-[#DCE8DA] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Users className="size-3.5 text-[#245C52]" />
              Patient Directory
            </Link>
            <Link
              href="/dashboard/documents"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#203E39] border border-[#DCE5DE] transition-all hover:bg-[#EDF2EC] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <FileText className="size-3.5 text-[#53665E]" />
              Clinical Documents
            </Link>
          </div>
        </div>

        {/* Pipeline Bar Surface */}
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-5 shadow-sm max-w-3xl">
          <div className="flex items-center justify-between mb-3 text-xs font-medium">
            <span className="text-[#0D1B17] font-semibold">Active Placement Pipeline</span>
            <span className="text-[#53665E] tabular-nums">
              {widgets.header.totalPlacements} total placements tracked
            </span>
          </div>
          <PipelineBar
            total={widgets.header.totalPlacements}
            completed={widgets.header.completedPlacements}
            active={widgets.header.activePlacements}
            thisMonth={widgets.header.placementsThisMonth}
          />
        </div>

        {/* First-run empty state helper when organization has 0 placements */}
        {hasZeroPlacements && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#DCE5DE] bg-white p-5 shadow-sm max-w-3xl">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[#245C52]">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#0D1B17]">
                  Welcome to your CareBridge workspace
                </h4>
                <p className="text-xs text-[#53665E] mt-0.5 max-w-xl leading-relaxed">
                  Your organization is connected. You can start by reviewing patients, browsing regional care facilities, or preparing incoming placement referrals.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/facility-network"
              className="inline-flex items-center gap-2 rounded-full bg-[#245C52] px-4 py-2 text-xs font-semibold text-white shrink-0 hover:bg-[#19473F] active:scale-95"
            >
              Explore Network <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* ── 2. Key Operational Metrics ── */}
      <section aria-labelledby="section-telemetry" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#245C52]" />
            <h2 id="section-telemetry" className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
              Operational Telemetry
            </h2>
          </div>
          <span className="text-xs text-[#53665E]">
            {role === "superadmin"
              ? "All network organizations"
              : widgets.header.placementsCreatedToday > 0
              ? `${widgets.header.placementsCreatedToday} created today`
              : "Live capacity & caseload"}
          </span>
        </div>

        <Suspense fallback={<StatsGridSkeleton />}>
          <StatsGrid
            organizationId={organizationId}
            role={role}
            placementsCreatedToday={widgets.header.placementsCreatedToday}
          />
        </Suspense>
      </section>

      {/* ── 3. Placement Activity & Care Mix ── */}
      <section aria-labelledby="section-pipeline" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#255DCE]" />
            <h2 id="section-pipeline" className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
              Placement Pipeline &amp; Care Mix
            </h2>
          </div>
          <span className="text-xs text-[#53665E]">
            Active referral triage
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ActivityCard data={widgets.activity} />
          <ProgressCard data={widgets.placementsThisWeek} />
          <ContractTypeCard data={widgets.careLevelBreakdown} />
        </div>
      </section>

      {/* ── 4. Care Coordination & Facility Network ── */}
      <section aria-labelledby="section-coordination" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#3E796D]" />
            <h2 id="section-coordination" className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
              Care Coordination &amp; Facility Network
            </h2>
          </div>
          <span className="text-xs text-[#53665E]">
            Daily schedules and placement velocity
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 min-h-[520px]">
            <AppointmentsCard events={widgets.scheduleEvents} />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
            <div className="flex-1">
              <AdvantagesCard data={widgets.performance} />
            </div>
            <div className="flex-1">
              <WelcomeCard data={widgets.performance} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Placement Volume & Annual Trajectory ── */}
      <section aria-labelledby="section-trajectory" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#245C52]" />
            <h2 id="section-trajectory" className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
              Annual Placement Volume &amp; Trajectory
            </h2>
          </div>
          <span className="text-xs text-[#53665E]">
            Created vs. completed trends
          </span>
        </div>

        <div className="w-full min-h-[340px]">
          <PlacementsByMonthCard data={widgets.placementsByMonth} />
        </div>
      </section>
    </div>
  );
}
