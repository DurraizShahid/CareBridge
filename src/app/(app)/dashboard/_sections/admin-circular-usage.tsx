"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import type { SuperAdminDashboardStats } from "@/types";

interface AdminCircularUsageProps {
  stats: SuperAdminDashboardStats;
  className?: string;
}

export default function AdminCircularUsage({
  stats,
  className = "",
}: AdminCircularUsageProps) {
  const router = useRouter();
  const rate = Math.min(Math.max(stats.facilityUtilizationRate, 0), 100);
  const avgDays = stats.averagePlacementTimeDays;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <div className={`admin-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-sa-foreground">Facility Utilization</h3>
        <button
          onClick={() => router.refresh()}
          className="text-xs text-sa-muted-foreground hover:text-sa-primary transition-colors"
          aria-label="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="relative w-[140px] h-[140px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#E8EEF3"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out stroke-[#44BEB1] dark:stroke-[#00b4d8]"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset > circumference * 0.25 ? offset : circumference}
              opacity={rate >= 75 ? 0 : 1}
              className="transition-all duration-700 ease-out stroke-[#134675] dark:stroke-[#00b4d8]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[36px] font-semibold text-sa-foreground leading-none tabular-nums tracking-tight">
              {rate}%
            </span>
            <span className="text-xs text-sa-muted-foreground mt-1">Utilized</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-sa-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-sa-muted-foreground">Avg. placement time</span>
          <span className="font-semibold text-sa-foreground tabular-nums">{avgDays} days</span>
        </div>
      </div>

      <div role="img" aria-label={`Facility utilization rate is ${rate}%. Average placement time is ${avgDays} days.`} className="sr-only" />
    </div>
  );
}
