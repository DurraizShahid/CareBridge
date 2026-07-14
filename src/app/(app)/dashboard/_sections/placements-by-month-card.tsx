"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const placementsByMonth = [
  { month: "Feb", count: 5 },
  { month: "Mar", count: 8 },
  { month: "Apr", count: 6 },
  { month: "May", count: 10 },
  { month: "Jun", count: 12 },
  { month: "Jul", count: 6 },
];

const totalPlacements = 47;
const activePlacements = 3;
const completedPlacements = 38;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-full bg-[#E8F5E9] dark:bg-[#1A3A2A] px-3 py-1.5 text-xs font-semibold text-[#2E7D32] dark:text-[#4ADE80] shadow-sm">
      {payload[0].value} placements
    </div>
  );
}

export function PlacementsByMonthCard({ className }: { className?: string }) {
  const latestMonth = placementsByMonth[placementsByMonth.length - 1];
  const previousMonth = placementsByMonth[placementsByMonth.length - 2];
  const delta = latestMonth.count - previousMonth.count;
  const isPositive = delta >= 0;

  return (
    <Card
      className={cn(
        "rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl font-body overflow-hidden",
        className
      )}
    >
      <CardContent className="flex h-full p-6 gap-4">
        {/* Left side — stats */}
        <div className="flex flex-col justify-between min-w-[140px] shrink-0">
          <div>
            <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">
              Placements by Month
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Placements this period
            </p>
          </div>

          <div className="mt-4">
            <p className="text-4xl font-bold tracking-tight text-foreground">
              {latestMonth.count}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-[#2E7D32]" : "text-red-500"
                )}
              >
                {isPositive ? "↑" : "↓"} {Math.abs(delta)}
              </span>
              <span className="text-xs text-muted-foreground">
                vs last month
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                {activePlacements}
              </span>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                {completedPlacements}
              </span>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
          </div>
        </div>

        {/* Right side — chart */}
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={placementsByMonth}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="placementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#048A81" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#048A81" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                dy={8}
              />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip />}
                cursor={false}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#048A81"
                strokeWidth={2}
                fill="url(#placementGradient)"
                dot={{ r: 3.5, fill: "#1F2937", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#048A81", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
