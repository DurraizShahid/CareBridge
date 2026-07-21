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

const variantStyles: Record<string, string> = {
  default: "border-l-[var(--stat-default)]",
  health: "border-l-[var(--stat-health)]",
  info: "border-l-[var(--stat-info)]",
  purple: "border-l-[var(--stat-purple)]",
  pink: "border-l-[var(--stat-pink)]",
  orange: "border-l-[var(--stat-orange)]",
  facility: "border-l-[var(--stat-facility)]",
};

const bgStyles: Record<string, string> = {
  default: "bg-[var(--stat-default-bg)]",
  health: "bg-[var(--stat-health-bg)]",
  info: "bg-[var(--stat-info-bg)]",
  purple: "bg-[var(--stat-purple-bg)]",
  pink: "bg-[var(--stat-pink-bg)]",
  orange: "bg-[var(--stat-orange-bg)]",
  facility: "bg-[var(--stat-facility-bg)]",
};

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
      <Card
        className={cn(
          "group relative overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-card/70 backdrop-blur-xl border-l-2",
          bgStyles[variant],
          variantStyles[variant],
        )}
    >
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
              iconStyles[variant],
            )}
          >
            <Icon className="size-[18px]" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? trendStyles.positive : trendStyles.negative,
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
