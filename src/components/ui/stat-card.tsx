import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "health" | "warmth";
}

const variantStyles = {
  default: "bg-card text-card-foreground",
  health: "bg-health/5 text-health border-health/20",
  warmth: "bg-warmth/5 text-warmth border-warmth/20",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-5 shadow-sm transition-all hover:shadow-md",
        variantStyles[variant],
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            variant === "default" && "bg-muted",
            variant === "health" && "bg-health/10",
            variant === "warmth" && "bg-warmth/10",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              variant === "default" && "text-foreground",
              variant === "health" && "text-health",
              variant === "warmth" && "text-warmth",
            )}
          />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-3xl font-bold tracking-tight">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium",
              trend.positive ? "text-health" : "text-destructive",
            )}
          >
            {trend.positive ? "+" : ""}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
