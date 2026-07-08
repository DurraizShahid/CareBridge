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
  health: "bg-health/5 text-health border-health/20",
  info: "bg-primary/5 text-primary border-primary/20",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        variantStyles[variant],
      )}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <Badge
            variant="secondary"
            className={cn(
              "h-9 w-9 rounded-lg p-0",
              variant === "default" && "bg-muted text-foreground",
              variant === "health" && "bg-health/10 text-health",
              variant === "info" && "bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-5 w-5" />
          </Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-3xl font-bold tracking-tight">{value}</span>
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
