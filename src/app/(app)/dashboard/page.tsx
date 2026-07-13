import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerOrganization } from "@/lib/server-organization";
import { HOSPITAL_ROLES } from "@/lib/permissions";
import DashboardHeader from "./_sections/dashboard-header";
import StatsGrid from "./_sections/stats-grid";
import MainOverview from "./_sections/main-overview";
import StaffOverview from "./_sections/staff-overview";
import FacilityOverview from "./_sections/facility-overview";
import AdminOverview from "./_sections/admin-overview";
import SuperAdminDashboard from "./_sections/superadmin-dashboard";
import RecentActivity from "./_sections/recent-activity";
import {
  StatsGridSkeleton,
  ActivePlacementsSkeleton,
  MyCaseloadSkeleton,
  PendingApprovalsSkeleton,
  ReferralRequestsSkeleton,
  MyFacilitySkeleton,
  FacilityNetworkSkeleton,
  PlacementsByMonthSkeleton,
  UsersByRoleSkeleton,
  RecentUsersSkeleton,
  RecentActivitySkeleton,
  PlatformHealthSkeleton,
} from "@/components/dashboard-skeletons";

function getRole(
  org: Awaited<ReturnType<typeof getServerOrganization>>,
): string {
  if (!org || !org.role) return "customer";
  return org.role;
}

export default async function DashboardPage() {
  const org = await getServerOrganization();
  const organizationId = org?.organizationId ?? "";
  const userId = org?.userId ?? "";
  const role = getRole(org);

  // Hospital roles see the AI home page instead of the dashboard
  if (HOSPITAL_ROLES.includes(role as any)) {
    redirect("/dashboard/home");
  }

  const isStaff = role === "social-worker";
  const isFacility = role === "facility-coordinator";
  const isAdmin = role === "superadmin";
  const isDefault = !isStaff && !isFacility && !isAdmin;

  // Super Admin gets the custom dashboard
  if (isAdmin) {
    return <SuperAdminDashboard />;
  }

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader />

      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid organizationId={organizationId} role={role} />
      </Suspense>

      {isStaff && (
        <Suspense
          fallback={
            <div className="grid gap-8 lg:grid-cols-2">
              <MyCaseloadSkeleton count={3} />
              <div className="flex flex-col gap-6">
                <PendingApprovalsSkeleton count={2} />
                <RecentActivitySkeleton count={4} />
              </div>
            </div>
          }
        >
          <StaffOverview organizationId={organizationId} role={role} userId={userId} />
        </Suspense>
      )}

      {isFacility && (
        <Suspense
          fallback={
            <div className="grid gap-8 lg:grid-cols-2">
              <ReferralRequestsSkeleton count={3} />
              <div className="flex flex-col gap-6">
                <MyFacilitySkeleton />
                <FacilityNetworkSkeleton count={3} />
              </div>
            </div>
          }
        >
          <FacilityOverview organizationId={organizationId} role={role} userId={userId} />
        </Suspense>
      )}

      {isDefault && (
        <div className="grid gap-8 lg:grid-cols-2">
          <Suspense fallback={<ActivePlacementsSkeleton count={3} />}>
            <MainOverview organizationId={organizationId} role={role} />
          </Suspense>
          <Suspense fallback={<RecentActivitySkeleton count={4} />}>
            <RecentActivity organizationId={organizationId} role={role} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
