import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ClipboardList,
  FileSearch,
  Users,
  Building,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import {
  getDashboardStats,
  getFacilityDashboardStats,
} from "@/lib/data-access";
import type { SectionProps } from "./shared";

export default async function StatsGrid({ organizationId, role }: SectionProps) {
  if (role === "facility-coordinator") {
    return <FacilityStatsGrid organizationId={organizationId} role={role} />;
  }

  return <DefaultStatsGrid organizationId={organizationId} role={role} />;
}

async function DefaultStatsGrid({ organizationId, role }: SectionProps) {
  const scopedStats = await getDashboardStats(organizationId, role);

  return (
    <div className="grid gap-[19px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Active Patients" value={scopedStats.activePatients} icon={Users} variant="default" />
      <StatCard
        title="Active Placements"
        value={scopedStats.activePlacements}
        icon={ClipboardList}
        variant="health"
        trend={{ value: "2 new today", positive: true }}
      />
      <StatCard title="Pending Assessments" value={scopedStats.pendingAssessments} icon={FileSearch} variant="info" />
      <StatCard title="Available Facilities" value={scopedStats.facilitiesAvailable} icon={Building2} variant="purple" />
      <StatCard title="Placements This Month" value={scopedStats.placementsThisMonth} icon={CalendarCheck} variant="pink" />
      <StatCard title="Avg. Placement Time" value={`${scopedStats.averagePlacementTimeDays}d`} icon={Clock} variant="orange" />
    </div>
  );
}

async function FacilityStatsGrid({ organizationId, role }: SectionProps) {
  const scopedStats = await getFacilityDashboardStats(organizationId, role);

  return (
    <div className="grid gap-[19px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Current Occupancy" value={scopedStats.currentOccupancy} icon={Users} variant="default" />
      <StatCard
        title="Available Beds"
        value={scopedStats.availableBeds}
        icon={Building2}
        variant="health"
        trend={{ value: `${scopedStats.occupancyRate}% full`, positive: scopedStats.availableBeds > 5 }}
      />
      <StatCard title="Pending Referrals" value={scopedStats.pendingReferrals} icon={ClipboardList} variant="info" />
      <StatCard title="Pending Admissions" value={scopedStats.pendingAdmissions} icon={Activity} variant="default" />
      <StatCard title="Placements This Month" value={scopedStats.placementsThisMonth} icon={CalendarCheck} variant="health" />
      <StatCard title="Avg. Stay Duration" value={`${scopedStats.averageStayDays}d`} icon={Clock} variant="default" />
    </div>
  );
}
