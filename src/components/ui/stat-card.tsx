import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "health" | "info" | "purple" | "pink" | "orange" | "facility";
}

const iconStyles: Record<string, string> = {
  default: "text-[var(--stat-default)] bg-[var(--stat-default-bg)]",
  health: "text-[var(--stat-health)] bg-[var(--stat-health-bg)]",
  info: "text-[var(--stat-info)] bg-[var(--stat-info-bg)]",
  purple: "text-[var(--stat-purple)] bg-[var(--stat-purple-bg)]",
  pink: "text-[var(--stat-pink)] bg-[var(--stat-pink-bg)]",
  orange: "text-[var(--stat-orange)] bg-[var(--stat-orange-bg)]",
  facility: "text-[var(--stat-facility)] bg-[var(--stat-facility-bg)]",
};

const trendStyles = {
  positive: "text-[var(--stat-health)] bg-[var(--stat-health-bg)]",
  negative: "text-destructive bg-destructive/10",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted-foreground">{title}</span>
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              iconStyles[variant],
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-[28px] font-medium tracking-tight tabular-nums text-foreground">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                trendStyles[trend.positive ? "positive" : "negative"],
              )}
            >
              {trend.positive ? "↑" : "↓"}
              {trend.value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
