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
  variant?: "default" | "health" | "info" | "purple" | "pink" | "orange";
}

const variantStyles = {
  default: "border-border bg-[#29678d]/15 dark:bg-[#29678d]/25",
  health: "border-l-2 border-l-[#516ba1]/60 border-border bg-[#516ba1]/15 dark:bg-[#516ba1]/25",
  info: "border-l-2 border-l-[#269ab7]/60 border-border bg-[#269ab7]/15 dark:bg-[#269ab7]/25",
  purple: "border-border bg-[#195595]/15 dark:bg-[#195595]/25",
  pink: "border-border bg-[#569ad3]/15 dark:bg-[#569ad3]/25",
  orange: "border-border bg-[#83dfd3]/15 dark:bg-[#83dfd3]/25",
};

const iconContainerStyles = {
  default: "bg-[#29678d]/20 text-[#29678d] dark:bg-[#29678d]/30",
  health: "bg-[#516ba1]/20 text-[#516ba1] dark:bg-[#516ba1]/30",
  info: "bg-[#269ab7]/20 text-[#269ab7] dark:bg-[#269ab7]/30",
  purple: "bg-[#195595]/20 text-[#195595] dark:bg-[#195595]/30",
  pink: "bg-[#569ad3]/20 text-[#569ad3] dark:bg-[#569ad3]/30",
  orange: "bg-[#83dfd3]/20 text-[#83dfd3] dark:bg-[#83dfd3]/30",
};

const trendStyles = {
  positive: "text-health",
  negative: "text-destructive",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 bg-card/70 backdrop-blur-xl",
        variantStyles[variant],
      )}
    >
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <span className="text-[21px] font-medium leading-none text-muted-foreground">{title}</span>
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
