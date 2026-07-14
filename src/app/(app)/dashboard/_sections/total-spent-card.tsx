"use client";

import { useState } from "react";
import { MoreHorizontal, ChartNoAxesColumnIncreasing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const defaultSpending = [12000, 14000, 16000, 11000, 18000, 10000, 13000];

interface TotalSpentCardProps {
  data?: number[];
  totalProp?: number;
  loading?: boolean;
  error?: boolean;
}

export function TotalSpentCard({ data = defaultSpending, totalProp, loading, error }: TotalSpentCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxVal = Math.max(...data, 1);
  const total = totalProp ?? data.reduce((a, b) => a + b, 0);

  if (error) {
    return (
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-white font-body">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Placement value data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-white font-body">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">Total Placement Value</h3>
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
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-28 w-full" />
            <div className="flex gap-6">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-0.5">Weekly contract value</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm text-muted-foreground">$</span>
                <span className="text-[34px] font-light text-foreground tabular-nums leading-none">
                  {total.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-emerald-500 font-medium">↑ $18,400.00</span>
                <span className="text-[10px] text-muted-foreground">vs last week</span>
              </div>
            </div>

            <div className="relative mb-5">
              <svg viewBox="0 0 400 110" className="w-full h-24">
                <defs>
                  <linearGradient id="spendFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary) / 0.2)" />
                    <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
                  </linearGradient>
                </defs>
                <path
                  d={`M ${data.map((v, i) => {
                    const x = 20 + (i / (data.length - 1)) * 360;
                    const y = 105 - (v / maxVal) * 90;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  }).join(" ")} L 380 105 L 20 105 Z`}
                  fill="url(#spendFill)"
                />
                <path
                  d={data.map((v, i) => {
                    const x = 20 + (i / (data.length - 1)) * 360;
                    const y = 105 - (v / maxVal) * 90;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.6)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((v, i) => {
                  const x = 20 + (i / (data.length - 1)) * 360;
                  const y = 105 - (v / maxVal) * 90;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={hoveredIndex === i ? 5 : 2.5}
                      className="transition-all duration-200"
                      fill={hoveredIndex === i ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"}
                      stroke="white"
                      strokeWidth={hoveredIndex === i ? 2 : 0}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center gap-6 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-light text-foreground tabular-nums">18</span>
                </div>
                <span className="text-[11px] text-muted-foreground">Partner facilities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-light text-foreground tabular-nums">42</span>
                </div>
                <span className="text-[11px] text-muted-foreground">Placed patients</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-light text-foreground tabular-nums">$6.8k</span>
                </div>
                <span className="text-[11px] text-muted-foreground">Avg / placement</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
