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
  positive: "text-health",
  negative: "text-destructive",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card hoverable className="bg-card">
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-105",
              iconStyles[variant],
            )}
          >
            <Icon className="size-6" />
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="font-heading text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-background/50",
                trend.positive ? trendStyles.positive : trendStyles.negative,
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
