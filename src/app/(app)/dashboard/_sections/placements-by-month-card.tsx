"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CREATED_COLOR = "var(--chart-1)";
const COMPLETED_COLOR = "var(--chart-3)";

interface PlacementsByMonthCardProps {
  className?: string;
  data?: { month: string; created: number; completed: number }[];
}

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  nearestSeries: "created" | "completed";
}

function CustomTooltip({ active, payload, nearestSeries }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const createdData = payload.find((p) => p.name === "created");
  const completedData = payload.find((p) => p.name === "completed");

  if (!createdData && !completedData) return null;

  const isCreated = nearestSeries === "created";
  const data = isCreated ? createdData : completedData;
  const label = isCreated ? "Created" : "Completed";

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background whitespace-nowrap shadow-lg">
        {label} {data?.value}
      </div>
      <div className="w-px h-4 bg-foreground" />
    </div>
  );
}

export function PlacementsByMonthCard({
  className,
  data = [],
}: PlacementsByMonthCardProps) {
  const [nearestSeries, setNearestSeries] = useState<"created" | "completed">("created");
  const chartData = data;
  const year = new Date().getFullYear();

  const yMax = useMemo(() => {
    const max = Math.max(
      1,
      ...chartData.flatMap((d) => [d.created, d.completed]),
    );
    return Math.ceil(max / 5) * 5 || 5;
  }, [chartData]);

  const handleMouseMove = useCallback((state: {
    activePayload?: Array<{ name?: string | number; value?: number }>;
    activeCoordinate?: { x: number; y: number };
    chartWidth?: number;
  }) => {
    if (!state?.activePayload?.length || !state?.activeCoordinate) return;

    const cursorY = state.activeCoordinate.y;
    const payload = state.activePayload;

    const createdData = payload.find((p) => p.name === "created");
    const completedData = payload.find((p) => p.name === "completed");

    if (createdData?.value === undefined || completedData?.value === undefined) return;

    const chartHeight = state?.chartWidth || 200;
    const domainMin = 0;
    const domainMax = yMax;

    const createdY = ((domainMax - createdData.value) / (domainMax - domainMin)) * chartHeight;
    const completedY = ((domainMax - completedData.value) / (domainMax - domainMin)) * chartHeight;

    const createdDist = Math.abs(cursorY - createdY);
    const completedDist = Math.abs(cursorY - completedY);

    setNearestSeries(createdDist <= completedDist ? "created" : "completed");
  }, [yMax]);

  return (
    <Card className={cn("h-full overflow-hidden", className)}>
      <CardContent className="flex flex-col h-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Placements by Month
            </h3>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: CREATED_COLOR }}
                />
                <span className="text-xs text-muted-foreground">Created</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: COMPLETED_COLOR }}
                />
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
            </div>
          </div>

          <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {year}
          </span>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              onMouseMove={handleMouseMove}
            >
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                dy={8}
              />
              <YAxis
                domain={[0, yMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                dx={-10}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip nearestSeries={nearestSeries} />}
                cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
              />
              <Line
                name="created"
                type="monotone"
                dataKey="created"
                stroke={CREATED_COLOR}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: CREATED_COLOR, stroke: "var(--card)", strokeWidth: 2 }}
              />
              <Line
                name="completed"
                type="monotone"
                dataKey="completed"
                stroke={COMPLETED_COLOR}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 5, fill: COMPLETED_COLOR, stroke: "var(--card)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
