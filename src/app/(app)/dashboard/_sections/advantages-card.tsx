"use client";

import { Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdvantagesCardProps {
  loading?: boolean;
  error?: boolean;
  data?: {
    averagePlacementTimeDays: number;
    successRate: number;
    partnerFacilities: number;
  };
}

export function AdvantagesCard({ error, data }: AdvantagesCardProps) {
  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Performance data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const avgDays = data?.averagePlacementTimeDays ?? 0;
  const successRate = data?.successRate ?? 0;
  const partnerFacilities = data?.partnerFacilities ?? 0;

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Platform Performance</h3>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
            <Sparkles className="size-3" />
            {avgDays}d avg
          </div>
        </div>

        <p className="text-[13px] text-muted-foreground mb-5">
          Average time to place patients
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-[30px] font-medium tracking-tight text-foreground tabular-nums">
              {successRate}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Placement success rate</p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-[30px] font-medium tracking-tight text-foreground tabular-nums">
              {partnerFacilities}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Partner facilities</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-3.5">
          <TrendingUp className="size-4 shrink-0 text-primary" />
          <span className="text-xs font-medium text-primary">
            {avgDays > 0
              ? `Average placement completes in ${avgDays} days`
              : "Complete placements to unlock timing insights"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
