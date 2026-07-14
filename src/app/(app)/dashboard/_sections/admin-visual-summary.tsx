import type { SuperAdminDashboardStats, User, Facility } from "@/types";

interface AdminVisualSummaryProps {
  stats: SuperAdminDashboardStats;
  users: User[];
  facilities: Facility[];
  adminName?: string | null;
  adminEmail?: string | null;
  adminImage?: string | null;
  className?: string;
}

export default function AdminVisualSummary({
  stats,
  facilities,
  adminName,
  adminEmail,
  adminImage: _adminImage,
  className = "",
}: AdminVisualSummaryProps) {
  const totalNetwork = stats.totalHospitals + stats.totalFacilities;
  const activeRatio = stats.totalPlacements > 0
    ? Math.round((stats.activePlacements / stats.totalPlacements) * 100)
    : 0;

  return (
    <div className={`admin-card overflow-hidden relative min-h-[320px] flex flex-col group/card ${className}`}>
      {/* Background image — no gradient overlay */}
      <img
        src="/images/dp-male.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        aria-hidden="true"
      />

      {/* Sliding info panel — name+active visible at rest, full content slides up on hover */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-[#134675] rounded-t-xl translate-y-[calc(100%-44px)] group-hover/card:translate-y-0 transition-transform duration-300 ease-in-out p-5 flex flex-col gap-2.5">
        {/* Name + Active dot always visible at bottom of card */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            {adminName ?? "Super Admin"}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
            <span className="text-[10px] font-medium text-green-300 tracking-wide uppercase">Active</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 shrink-0 text-[#44BEB1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-sm text-white/90">Platform Administrator</span>
        </div>
        {adminEmail && (
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 shrink-0 text-[#44BEB1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span className="text-xs text-white/70 break-all">{adminEmail}</span>
          </div>
        )}
        <div className="border-t border-white/10 pt-2.5 grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-white tabular-nums">{totalNetwork}</span>
            <span className="text-[9px] text-white/50 tracking-wide uppercase">Locations</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-white tabular-nums">{stats.totalHospitals}</span>
            <span className="text-[9px] text-white/50 tracking-wide uppercase">Hospitals</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-white tabular-nums">{facilities.length}</span>
            <span className="text-[9px] text-white/50 tracking-wide uppercase">Facilities</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">Active Placements</span>
          <span className="font-semibold text-white tabular-nums">{activeRatio}% active</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/70"
            style={{ width: `${activeRatio}%` }}
          />
        </div>
      </div>
    </div>
  );
}
