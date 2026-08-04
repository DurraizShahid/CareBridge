import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerOrganization } from "@/lib/server-organization";
import { currentUser } from "@clerk/nextjs/server";
import { HOSPITAL_ROLES } from "@/lib/permissions";
import { getDashboardWidgetData } from "@/lib/data-access";
import DashboardHeader from "./_sections/dashboard-header";
import AdminOverview from "./_sections/admin-overview";
import StatsGrid from "./_sections/stats-grid";
import { AppointmentsCard } from "./_sections/appointments-card";
import { ActivityCard } from "./_sections/activity-card";
import { VirtualCardsCard } from "./_sections/virtual-cards-card";
import { ProgressCard } from "./_sections/progress-card";
import { AdvantagesCard } from "./_sections/advantages-card";
import { TotalSpentCard } from "./_sections/total-spent-card";
import { ContractTypeCard } from "./_sections/contract-type-card";
import { PlacementsByMonthCard } from "./_sections/placements-by-month-card";
import WelcomeCard from "./_sections/welcome-card";
import { StatsGridSkeleton } from "@/components/dashboard-skeletons";

export default async function DashboardPage() {
  const org = await getServerOrganization();
  const user = await currentUser();
  const organizationId = org?.organizationId ?? "";
  const role = org?.role ?? "customer";
  const userName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
    : (user?.username ?? "Admin");

  // Hospital roles see the AI home page instead of the dashboard
  if ((HOSPITAL_ROLES as string[]).includes(role)) {
    redirect("/dashboard/home");
  }

  const widgets = await getDashboardWidgetData(organizationId, role);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <DashboardHeader
          userName={userName}
          totalPlacements={widgets.header.totalPlacements}
          completedPlacements={widgets.header.completedPlacements}
          activePlacements={widgets.header.activePlacements}
          placementsThisMonth={widgets.header.placementsThisMonth}
        />
      </section>

      {role === "superadmin" && (
        <section>
          <AdminOverview widgets={widgets} />
        </section>
      )}

      {role !== "superadmin" && (
        <section>
          <Suspense fallback={<StatsGridSkeleton />}>
            <StatsGrid
              organizationId={organizationId}
              role={role}
              placementsCreatedToday={widgets.header.placementsCreatedToday}
            />
          </Suspense>
        </section>
      )}

      {role !== "superadmin" && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-min">
            <div className="md:col-span-5 md:row-span-2">
              <AppointmentsCard events={widgets.scheduleEvents} />
            </div>

            <div className="md:col-span-7">
              <TotalSpentCard data={widgets.priorityPlacements} />
            </div>

            <div className="md:col-span-4">
              <ActivityCard data={widgets.activity} />
            </div>

            <div className="md:col-span-3">
              <ProgressCard data={widgets.placementsThisWeek} />
            </div>

            <div className="md:col-span-4">
              <VirtualCardsCard categories={widgets.facilitiesByCategory} />
            </div>

            <div className="md:col-span-4">
              <ContractTypeCard data={widgets.careLevelBreakdown} />
            </div>

            <div className="md:col-span-4">
              <AdvantagesCard data={widgets.performance} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 min-h-[320px]">
              <PlacementsByMonthCard data={widgets.placementsByMonth} />
            </div>
            <div className="md:col-span-4">
              <WelcomeCard data={widgets.performance} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
