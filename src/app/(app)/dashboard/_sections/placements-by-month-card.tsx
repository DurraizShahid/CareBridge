"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

const chartData = months.map((month, i) => ({
  month,
  demand: [120, 100, 130, 110, 125, 115, 135, 105, 95, 120, 145][i],
  availability: [155, 135, 120, 110, 105, 130, 95, 125, 115, 130, 120][i],
}));

const TEAL = "#277979";
const YELLOW = "#D4A843";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="flex flex-col items-center">
      <div
        className="px-4 py-2 rounded-xl text-sm font-semibold text-white whitespace-nowrap shadow-lg"
        style={{ backgroundColor: "#1C1917" }}
      >
        {payload[0]?.name === "demand" ? "Demand" : "Availability"} {payload[0]?.value}
      </div>
      <div
        className="w-px h-4"
        style={{ backgroundColor: "#1C1917" }}
      />
    </div>
  );
}

export function PlacementsByMonthCard({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "rounded-[28px] shadow-sm h-full overflow-hidden",
        className
      )}
      style={{ backgroundColor: "#ccd7d3" }}
    >
      <CardContent className="flex flex-col h-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <h3 className="text-lg font-semibold text-foreground">
              Placements by Month
            </h3>

            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: YELLOW }}
                />
                <span className="text-sm text-foreground/70">Demand</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#1C1917" }}
                />
                <span className="text-sm text-foreground/70">Availability</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Year Dropdown */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5"
              style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
            >
              2024
              <ChevronDown className="size-4" />
            </button>

            {/* Arrow Button */}
            <button
              aria-label="View full statistics"
              className="flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "rgba(255,255,255,0.5)",
              }}
            >
              <ArrowUpRight className="size-4 text-foreground/60" />
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                dy={8}
              />
              <YAxis
                domain={[50, 200]}
                ticks={[50, 100, 150, 200]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                dx={-10}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#9CA3AF", strokeDasharray: "4 4" }}
              />
              <Line
                name="demand"
                type="monotone"
                dataKey="demand"
                stroke={YELLOW}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: YELLOW, stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                name="availability"
                type="monotone"
                dataKey="availability"
                stroke={TEAL}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 5, fill: TEAL, stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
