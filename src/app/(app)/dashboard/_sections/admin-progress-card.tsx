import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { SuperAdminDashboardStats } from "@/types";

interface AdminProgressCardProps {
  stats: SuperAdminDashboardStats;
  className?: string;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export default function AdminProgressCard({
  stats,
  className = "",
}: AdminProgressCardProps) {
  const data = stats.placementsByMonth ?? [];
  const values = data.map((d) => d.count);
  const maxVal = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className={`admin-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-sa-foreground">Activity Growth</h3>
        <Link
          href="/placements"
          className="text-xs text-sa-muted-foreground hover:text-sa-primary transition-colors flex items-center gap-1"
        >
          Details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[40px] font-semibold text-sa-foreground leading-none tabular-nums tracking-tight">
          {total}
        </span>
        <span className="text-xs text-sa-muted-foreground">total placements (6mo)</span>
      </div>

      <div className="mt-5">
        <div className="flex items-end gap-2 h-[120px]">
          {data.map((d, i) => {
            const h = (d.count / maxVal) * 100;
            const isHighlighted = i === data.length - 1;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-medium text-sa-foreground tabular-nums">
                  {d.count}
                </span>
                <div
                  className={`w-full rounded-full transition-all duration-300 ${
                    isHighlighted ? "bg-sa-primary" : "bg-sa-subtle-primary"
                  }`}
                  style={{ height: `${Math.max(h, 4)}%` }}
                  title={`${d.month}: ${d.count} placements`}
                />
                <span className="text-[10px] text-sa-muted-foreground">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div role="img" aria-label={`Bar chart showing ${total} total placements over 6 months`} className="sr-only">
        {data.map((d) => `${d.month}: ${d.count} placements`).join(", ")}
      </div>
    </div>
  );
}
