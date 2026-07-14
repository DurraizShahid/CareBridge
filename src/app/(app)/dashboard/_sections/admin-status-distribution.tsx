import type { SuperAdminDashboardStats } from "@/types";

interface StatusCategory {
  label: string;
  count: number;
  pct: number;
  color: string;
  textColor: string;
}

export default function AdminStatusDistribution({
  stats,
}: {
  stats: SuperAdminDashboardStats;
}) {
  const { activePlacements, completedPlacements, pendingApprovals, totalPlacements } = stats;
  const total = totalPlacements || 1;

  const categories: StatusCategory[] = [
    {
      label: "Active",
      count: activePlacements,
      pct: Math.round((activePlacements / total) * 100),
      color: "bg-sa-primary",
      textColor: "text-sa-primary",
    },
    {
      label: "Completed",
      count: completedPlacements,
      pct: Math.round((completedPlacements / total) * 100),
      color: "bg-sa-accent",
      textColor: "text-sa-accent",
    },
    {
      label: "Pending Approval",
      count: pendingApprovals,
      pct: Math.round((pendingApprovals / total) * 100),
      color: "bg-sa-muted-foreground/40",
      textColor: "text-sa-muted-foreground",
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center gap-6 mb-3">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${cat.color}`} />
            <span className="text-xs text-sa-muted-foreground">{cat.label}</span>
            <span className="text-xs font-semibold text-sa-foreground tabular-nums">{cat.count}</span>
            <span className={`text-xs ${cat.textColor} tabular-nums`}>{cat.pct}%</span>
          </div>
        ))}
      </div>
      <div className="flex h-[36px] rounded-full overflow-hidden gap-0.5">
        {categories.map((cat) =>
          cat.pct > 0 ? (
            <div
              key={cat.label}
              className={`${cat.color} flex items-center justify-center text-xs font-medium transition-opacity hover:opacity-90`}
              style={{ width: `${cat.pct}%` }}
            >
              {cat.pct > 10 ? (
                <span className={cat.label === "Completed" ? "text-[#102A43]" : "text-[#44BEB1]"}>
                  {cat.pct}%
                </span>
              ) : null}
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
