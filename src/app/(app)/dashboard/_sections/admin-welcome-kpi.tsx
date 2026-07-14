import { Building2, Users, ClipboardList } from "lucide-react";
import type { SuperAdminDashboardStats } from "@/types";

function fmt(n: number): string {
  return n.toLocaleString();
}

interface KpiItem {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function AdminWelcomeKpi({
  stats,
  adminName,
}: {
  stats: SuperAdminDashboardStats;
  adminName?: string | null;
}) {
  const kpis: KpiItem[] = [
    {
      value: fmt(stats.totalUsers),
      label: "Users on Platform",
      icon: Users,
    },
    {
      value: fmt(stats.totalHospitals + stats.totalFacilities),
      label: "Network Locations",
      icon: Building2,
    },
    {
      value: fmt(stats.totalPlacements),
      label: "Total Placements",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8 mb-8">
      <div className="lg:w-[60%]">
        <h1 className="text-[40px] font-semibold text-sa-foreground leading-tight tracking-tight">
          Welcome {adminName ?? "Super Admin"}
        </h1>
      </div>
      <div className="lg:w-[40%] flex items-stretch gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl bg-sa-subtle-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-sa-primary" />
                </div>
                <span className="text-[40px] font-semibold text-sa-foreground leading-none tabular-nums tracking-tight">
                  {kpi.value}
                </span>
              </div>
              <p className="text-xs text-sa-muted-foreground ml-[44px]">{kpi.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
