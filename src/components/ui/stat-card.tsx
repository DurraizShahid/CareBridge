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
  variant?: "default" | "health" | "info";
}

const variantStyles = {
  default: "border-border",
  health: "border-l-2 border-l-health/60 border-border",
  info: "border-l-2 border-l-primary/60 border-border",
};

const iconContainerStyles = {
  default: "bg-muted/80 text-muted-foreground",
  health: "bg-health/12 text-health",
  info: "bg-primary/12 text-primary",
};

const trendStyles = {
  positive: "text-health",
  negative: "text-destructive",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        variantStyles[variant],
      )}
    >
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium leading-none text-muted-foreground">{title}</span>
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
              iconContainerStyles[variant],
            )}
          >
            <Icon className="size-[18px]" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-3xl font-bold tracking-tight text-foreground tabular-nums">
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
