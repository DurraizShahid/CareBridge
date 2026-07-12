import { getSuperAdminDashboardStats, getUsers, getFacilities, getRecentActivity } from "@/lib/data-access";
import UsersByRoleCard from "./users-by-role-card";
import PlacementsDotMatrix from "./placements-dot-matrix";
import RecentUsersCard from "./recent-users-card";
import PlatformHealthChart from "./platform-health-chart";
import QuickActionsCard from "./quick-actions-card";
import RecentPlacementsCard from "./recent-placements-card";
import NetworkOverviewCard from "./network-overview-card";
import PlacementPipelineCard from "./placement-pipeline-card";
import RecentActivityCard from "./recent-activity-card";
import type { SectionProps } from "./shared";

export default async function AdminOverview({ organizationId, role }: SectionProps) {
  const [stats, users, facilities, activities] = await Promise.all([
    getSuperAdminDashboardStats(),
    getUsers(organizationId, role),
    getFacilities(organizationId, role),
    getRecentActivity(organizationId, role),
  ]);

  const recentUsers = users.slice(0, 4);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 grid-auto-flow-dense">

      {/* Row 1: three perfect squares */}
      <div className="aspect-square card-enter card-enter-1">
        <NetworkOverviewCard
          totalHospitals={stats.totalHospitals}
          totalFacilities={facilities.length}
        />
      </div>

      <div className="aspect-square card-enter card-enter-2">
        <PlacementsDotMatrix
          completedPlacements={stats.completedPlacements}
          pendingApprovals={stats.pendingApprovals}
        />
      </div>

      <div className="aspect-square card-enter card-enter-3">
        <RecentActivityCard activities={activities} />
      </div>

      {/* remaining cards */}
      <div className="card-enter card-enter-4">
        <PlatformHealthChart
          facilityUtilizationRate={stats.facilityUtilizationRate}
          averagePlacementTimeDays={stats.averagePlacementTimeDays}
          totalHospitals={stats.totalHospitals}
          totalFacilities={facilities.length}
          totalPlacements={stats.totalPlacements}
        />
      </div>

      <div className="card-enter card-enter-5">
        <UsersByRoleCard
          totalUsers={stats.totalUsers}
          usersByRole={stats.usersByRole}
          allUsers={users.map((u) => ({
            id: u.id,
            firstName: u.firstName ?? "",
            lastName: u.lastName ?? "",
            email: u.email,
            role: u.role,
          }))}
        />
      </div>

      <div className="card-enter card-enter-6">
        <QuickActionsCard />
      </div>

      <div className="col-span-2 card-enter card-enter-7">
        <RecentPlacementsCard />
      </div>

      <div className="card-enter card-enter-8">
        <PlacementPipelineCard
          placementsByStatus={stats.placementsByStatus}
          totalPlacements={stats.totalPlacements}
        />
      </div>

      <div className="col-span-2 card-enter card-enter-8">
        <RecentUsersCard
          users={recentUsers.map((u) => ({
            id: u.id,
            firstName: u.firstName ?? "",
            lastName: u.lastName ?? "",
            email: u.email,
            role: u.role,
          }))}
        />
      </div>
    </div>
  );
}
