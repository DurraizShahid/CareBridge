"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  useYAxisScale,
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
  coordinate?: { y?: number };
}

function CustomTooltip({ active, payload, coordinate }: CustomTooltipProps) {
  const yScale = useYAxisScale();
  if (!active || !payload?.length) return null;

  const createdData = payload.find((p) => p.name === "created");
  const completedData = payload.find((p) => p.name === "completed");

  if (!createdData && !completedData) return null;

  const cursorY = coordinate?.y ?? 0;
  const createdY = yScale?.(Number(createdData?.value)) ?? 0;
  const completedY = yScale?.(Number(completedData?.value)) ?? 0;
  const isCreated = !!createdData && (!completedData
    || Math.abs(cursorY - createdY) <= Math.abs(cursorY - completedY));
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
  const chartData = data;
  const year = new Date().getFullYear();

  const yMax = useMemo(() => {
    const max = Math.max(
      1,
      ...chartData.flatMap((d) => [d.created, d.completed]),
    );
    return Math.ceil(max / 5) * 5 || 5;
  }, [chartData]);

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

        <div className="min-w-0 shrink-0">
          {chartData.length === 0 ? (
            <Empty className="h-80" role="status">
              <EmptyDescription>No placement data yet</EmptyDescription>
            </Empty>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
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
                  content={<CustomTooltip />}
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
