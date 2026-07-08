import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  default: "bg-card text-card-foreground",
  health:
    "bg-gradient-to-br from-card to-health/[0.03] text-card-foreground border-health/15",
  info:
    "bg-gradient-to-br from-card to-primary/[0.03] text-card-foreground border-primary/15",
};

const iconStyles = {
  default: "bg-muted text-foreground",
  health: "bg-health/10 text-health group-hover:bg-health/15",
  info: "bg-primary/10 text-primary group-hover:bg-primary/15",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        variantStyles[variant],
      )}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-[0.03]">
        <div className="h-full w-full rounded-full bg-foreground" />
      </div>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <Badge
            variant="secondary"
            className={cn(
              "h-9 w-9 rounded-lg p-0 transition-colors duration-200",
              iconStyles[variant],
            )}
          >
            <Icon className="h-5 w-5" />
          </Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-3xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {trend && (
            <Badge
              variant="ghost"
              className={cn(
                "h-auto px-0 text-sm font-medium hover:bg-transparent",
                trend.positive ? "text-health" : "text-destructive",
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
