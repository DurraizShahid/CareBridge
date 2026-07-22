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
    <Card glass className="bg-card">
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <span className="text-sm font-semibold text-muted-foreground">{title}</span>
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-2xl",
              iconStyles[variant],
            )}
          >
            <Icon className="size-7" />
          </div>
        </div>
        <div className="flex items-baseline gap-4">
          <span className="font-heading text-4xl font-bold tracking-tight tabular-nums">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full",
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
