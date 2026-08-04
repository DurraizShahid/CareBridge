"use client";

import { TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TotalSpentCardProps {
  data?: {
    activePriority: number;
    urgentThisWeek: number;
    topCareLevels: string[];
  };
}

export function TotalSpentCard({ data }: TotalSpentCardProps) {
  const activePriority = data?.activePriority ?? 0;
  const urgentThisWeek = data?.urgentThisWeek ?? 0;
  const tags = data?.topCareLevels?.length
    ? data.topCareLevels
    : ["No priority tags"];

  return (
    <Card
      className="h-full"
      style={{ background: "color-mix(in oklab, var(--primary) 6%, var(--card))" }}
    >
      <CardContent className="p-6 flex flex-col gap-4 h-full">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Priority Placements</h3>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-[42px] font-medium tracking-tight text-foreground leading-none tabular-nums">
            {activePriority}
          </span>
          <span className="text-[13px] text-muted-foreground">active priority</span>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-xs text-foreground">
          <TrendingUp className="size-4 text-primary" />
          <span className="font-medium">
            {urgentThisWeek} urgent placements this week
          </span>
        </div>

        <div className="flex gap-3 mt-1 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
