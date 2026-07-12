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
  getSuperAdminDashboardStats,
} from "@/lib/data-access";
import type { SectionProps } from "./shared";

export default async function StatsGrid({ organizationId, role }: SectionProps) {
  if (role === "facility-coordinator") {
    return <FacilityStatsGrid organizationId={organizationId} role={role} />;
  }

  if (role === "superadmin") {
    return <AdminStatsGrid />;
  }

  return <DefaultStatsGrid organizationId={organizationId} role={role} />;
}

async function DefaultStatsGrid({ organizationId, role }: SectionProps) {
  const scopedStats = await getDashboardStats(organizationId, role);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Active Patients" value={scopedStats.activePatients} icon={Users} variant="default" />
      <StatCard
        title="Active Placements"
        value={scopedStats.activePlacements}
        icon={ClipboardList}
        variant="health"
        trend={{ value: "2 new today", positive: true }}
      />
      <StatCard title="Pending Assessments" value={scopedStats.pendingAssessments} icon={FileSearch} variant="info" />
      <StatCard title="Available Facilities" value={scopedStats.facilitiesAvailable} icon={Building2} variant="default" />
      <StatCard title="Placements This Month" value={scopedStats.placementsThisMonth} icon={CalendarCheck} variant="health" />
      <StatCard title="Avg. Placement Time" value={`${scopedStats.averagePlacementTimeDays}d`} icon={Clock} variant="default" />
    </div>
  );
}

async function FacilityStatsGrid({ organizationId, role }: SectionProps) {
  const scopedStats = await getFacilityDashboardStats(organizationId, role);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

async function AdminStatsGrid() {
  const stats = await getSuperAdminDashboardStats();
  const totalPlacements = 142;
  const completedPlacements = 87;
  const pendingApprovals = 24;

  const total = totalPlacements + completedPlacements + pendingApprovals;
  const placementsPct = Math.round((totalPlacements / total) * 100);
  const completedPct = Math.round((completedPlacements / total) * 100);
  const pendingPct = Math.round((pendingApprovals / total) * 100);

  const segments = [
    { label: "Total Placements", value: totalPlacements, pct: placementsPct, color: "bg-health/30 text-health", lined: false },
    { label: "Completed", value: completedPlacements, pct: completedPct, color: "bg-warmth/30 text-warmth", lined: true },
    { label: "Pending", value: pendingApprovals, pct: pendingPct, color: "bg-transparent text-muted-foreground border border-muted-foreground/30", lined: false },
  ];

  return (
    <div className="w-full flex items-start justify-between">
      <div className="flex-1 max-w-xl self-end">
        <div className="flex gap-2">
          {segments.map((seg) => (
            <span key={seg.label} className="text-[10px] font-medium text-muted-foreground text-left" style={{ width: `${seg.pct}%` }}>
              {seg.label}
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={`relative flex items-center justify-center h-[47px] rounded-full px-3 font-semibold text-[11px] ${seg.color} transition-all duration-200 hover:scale-105 cursor-default overflow-hidden`}
              style={{ width: `${seg.pct}%` }}
            >
              {seg.lined && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, currentColor 3px, currentColor 4px)",
                  }}
                />
              )}
              <span className="relative z-10">{seg.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-10 shrink-0 self-start">
        <div className="flex flex-col gap-1">
          <span className="text-[36px] font-light text-foreground leading-none tracking-tight">{stats.totalUsers}</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-[10px] text-muted-foreground">Employees</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[36px] font-light text-foreground leading-none tracking-tight">{stats.activePlacements}</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <p className="text-[10px] text-muted-foreground">Active Placements</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[36px] font-light text-foreground leading-none tracking-tight">{stats.totalFacilities}</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            <p className="text-[10px] text-muted-foreground">Facilities</p>
          </div>
        </div>
      </div>
    </div>
  );
}
