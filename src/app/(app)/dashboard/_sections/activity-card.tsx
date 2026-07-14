"use client";

import { useState } from "react";
import { MoreHorizontal, ChartNoAxesColumnIncreasing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const defaultReferrals = [4, 6, 3, 7, 5, 2, 1];
const defaultMatches = [3, 5, 2, 4, 6, 1, 1];

interface ActivityCardProps {
  loading?: boolean;
  error?: boolean;
}

export function ActivityCard({ loading, error }: ActivityCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"referrals" | "matches">("referrals");
  const data = selectedMetric === "referrals" ? defaultReferrals : defaultMatches;
  const maxVal = Math.max(...data, 1);
  const total = data.reduce((a, b) => a + b, 0);

  if (error) {
    return (
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl font-body">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Activity data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl font-body">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">Placement Activity</h3>
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
              <p className="text-xs text-muted-foreground mb-0.5">
                {selectedMetric === "referrals" ? "New referrals this week" : "Successful matches this week"}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[34px] font-light text-foreground tabular-nums leading-none">
                  {total}
                </span>
                <span className="text-base text-muted-foreground">{selectedMetric === "referrals" ? "referrals" : "matches"}</span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSelectedMetric("referrals")}
                className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                  selectedMetric === "referrals"
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Referrals
              </button>
              <button
                onClick={() => setSelectedMetric("matches")}
                className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                  selectedMetric === "matches"
                    ? "bg-emerald-500/15 text-emerald-600 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Matches
              </button>
            </div>

            <div className="flex items-end justify-between gap-1.5 h-28">
              {days.map((day, i) => {
                const height = (data[i] / maxVal) * 100;
                const isHovered = hoveredIndex === i;
                const barColor = selectedMetric === "referrals"
                  ? isHovered ? "bg-primary/50" : "bg-primary/30"
                  : isHovered ? "bg-emerald-500/50" : "bg-emerald-500/30";
                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-1.5 max-w-[32px]"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="w-full flex items-end justify-center" style={{ height: "106px" }}>
                      <div
                        className={`w-full max-w-[22px] rounded-t-lg transition-all duration-200 ${barColor}`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
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
