"use client";

import { useState } from "react";
import { MoreHorizontal, ChartNoAxesColumnIncreasing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const defaultData = [6.5, 7.2, 8.1, 7.8, 9.5, 4.2, 3.8];

interface ActivityCardProps {
  data?: number[];
  total?: number;
  loading?: boolean;
  error?: boolean;
}

export function ActivityCard({ data = defaultData, total: totalProp, loading, error }: ActivityCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxVal = Math.max(...data, 1);
  const total = totalProp ?? data.reduce((a, b) => a + b, 0);

  if (error) {
    return (
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Activity data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[21px] font-semibold text-muted-foreground">Activity</h3>
          <div className="flex items-center gap-1">
            <button aria-label="Chart view" className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
              <ChartNoAxesColumnIncreasing className="size-4 text-muted-foreground" />
            </button>
            <button aria-label="More" className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-24" />
            <div className="flex items-end justify-between gap-1.5 h-28">
              {days.map((_, i) => (
                <Skeleton key={i} className="flex-1 h-full max-w-[28px]" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-xs text-muted-foreground mb-0.5">Worked this week</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[34px] font-light text-foreground tabular-nums leading-none">
                  {Math.floor(total)}
                </span>
                <span className="text-base text-muted-foreground">h</span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-1.5 h-28">
              {days.map((day, i) => {
                const height = (data[i] / maxVal) * 100;
                const isHovered = hoveredIndex === i;
                const isSelected = i === 4;
                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-1.5 max-w-[32px]"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="w-full flex items-end justify-center" style={{ height: "106px" }}>
                      <div
                        className={`w-full max-w-[22px] rounded-t-lg transition-all duration-200 ${
                          isSelected
                            ? "bg-primary/80 shadow-[0_0_10px_rgba(91,95,199,0.25)]"
                            : isHovered
                              ? "bg-primary/50"
                              : "bg-muted/70 hover:bg-muted"
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] ${isSelected ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
