import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerOrganization } from "@/lib/server-organization";
import { currentUser } from "@clerk/nextjs/server";
import { HOSPITAL_ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
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
import {
  StatsGridSkeleton,
} from "@/components/dashboard-skeletons";

export default async function DashboardPage() {
  const org = await getServerOrganization();
  const user = await currentUser();
  const organizationId = org?.organizationId ?? "";
  const role = org?.role ?? "customer";
  const userName = user?.firstName ?? user?.username ?? "Admin";

  // Hospital roles see the AI home page instead of the dashboard
  if (HOSPITAL_ROLES.includes(role as any)) {
    redirect("/dashboard/home");
  }

  const orgFilter = role === "superadmin" ? {} : { organizationId };
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [totalPlacements, completedPlacements, activePlacements, placementsThisMonth] =
    await Promise.all([
      prisma.placement.count({ where: orgFilter }),
      prisma.placement.count({ where: { ...orgFilter, status: "completed" } }),
      prisma.placement.count({ where: { ...orgFilter, status: "in_progress" } }),
      prisma.placement.count({ where: { ...orgFilter, createdAt: { gte: monthStart } } }),
    ]);

  return (
    <div className="flex flex-col gap-[27px]">
      <DashboardHeader
        userName={userName}
        totalPlacements={totalPlacements}
        completedPlacements={completedPlacements}
        activePlacements={activePlacements}
        placementsThisMonth={placementsThisMonth}
      />

      {role === "superadmin" && <AdminOverview />}

      {role !== "superadmin" && (
        <Suspense fallback={<StatsGridSkeleton />}>
          <StatsGrid organizationId={organizationId} role={role} />
        </Suspense>
      )}

      {role !== "superadmin" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[23px] auto-rows-min">
          <div className="md:col-span-5 md:row-span-2">
            <AppointmentsCard />
          </div>

          <div className="md:col-span-7">
            <TotalSpentCard />
          </div>

          <div className="md:col-span-4">
            <ActivityCard />
          </div>

          <div className="md:col-span-3">
            <ProgressCard />
          </div>

          <div className="md:col-span-4">
            <VirtualCardsCard />
          </div>

          <div className="md:col-span-4">
            <ContractTypeCard />
          </div>

          <div className="md:col-span-4">
            <AdvantagesCard />
          </div>
        </div>
      )}
    </div>
  );
}
