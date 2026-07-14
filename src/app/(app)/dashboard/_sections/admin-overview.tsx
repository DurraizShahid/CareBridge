"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlacementsByMonthCard } from "./placements-by-month-card";

interface BentoCardProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

function BentoCard({ title, className, children }: BentoCardProps) {
  return (
    <Card className={cn("rounded-2xl border-border/40 shadow-none bg-white h-full", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-medium text-foreground/90">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center p-5 pt-3">
        {children ?? (
          <div className="flex items-center justify-center h-full min-h-[120px] text-muted-foreground/50 text-sm">
            Coming soon
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
      {/* Pro Version — tall, spans 2 rows */}
      <div className="lg:row-span-2">
        <BentoCard title="Pro Version" className="h-full bg-[#E5E9F2]" />
      </div>

      {/* Activity — square */}
      <div className="aspect-square">
        <BentoCard title="Activity" className="h-full" />
      </div>

      {/* Virtual Cards — square */}
      <div className="aspect-square">
        <BentoCard title="Virtual Cards" className="h-full" />
      </div>

      {/* VISA Card — square */}
      <div className="aspect-square">
        <BentoCard title="VISA" className="h-full bg-[#048A81]" />
      </div>

      {/* Contract Type — square */}
      <div className="aspect-square">
        <BentoCard title="Contract Type" className="h-full" />
      </div>

      {/* Placements by Month — free width, fills remaining space */}
      <div className="lg:col-span-2">
        <PlacementsByMonthCard className="h-full" />
      </div>
    </div>
  );
}
