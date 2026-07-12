"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlacementPipelineCardProps {
  placementsByStatus: Record<string, number>;
  totalPlacements: number;
}

const stages = [
  { key: "assessment", label: "Assessment", color: "bg-muted-foreground/40" },
  { key: "searching", label: "Searching", color: "bg-health/60" },
  { key: "matching", label: "Matching", color: "bg-health" },
  { key: "pending-approval", label: "Pending", color: "bg-warmth/70" },
  { key: "approved", label: "Approved", color: "bg-warmth" },
  { key: "completed", label: "Completed", color: "bg-primary" },
];

export default function PlacementPipelineCard({ placementsByStatus, totalPlacements }: PlacementPipelineCardProps) {
  const maxCount = Math.max(...stages.map((s) => placementsByStatus[s.key] ?? 0), 1);

  return (
    <Card className="group shadow-sm card-glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-health/5 hover:scale-[1.02]">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Placement Pipeline</h3>
          <Link href="/placements" className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-semibold text-foreground">{totalPlacements}</span>
          <span className="text-[11px] text-muted-foreground">total placements</span>
        </div>

        <div className="flex flex-col gap-2">
          {stages.map((stage) => {
            const count = placementsByStatus[stage.key] ?? 0;
            const pct = totalPlacements > 0 ? Math.round((count / totalPlacements) * 100) : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={stage.key} className="group/bar flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-20 truncate">{stage.label}</span>
                <div className="flex-1 h-5 bg-muted/30 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-lg transition-all duration-500 group-hover/bar:brightness-110`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-foreground w-8 text-right">{count}</span>
                <span className="text-[9px] text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
