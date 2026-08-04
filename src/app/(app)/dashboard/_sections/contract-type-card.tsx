"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ContractTypeCardProps {
  loading?: boolean;
  error?: boolean;
  data?: { label: string; value: number }[];
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export function ContractTypeCard({ error, data = [] }: ContractTypeCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const contractData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));
  const total = contractData.reduce((a, b) => a + b.value, 0);

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Care level data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  let currentAngle = 0;
  const segments = contractData.map((item) => {
    const angle = total > 0 ? (item.value / total) * 360 : 0;
    const seg = { ...item, start: currentAngle, end: currentAngle + angle };
    currentAngle += angle;
    return seg;
  });

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Placement by Care Level</h3>
        </div>

        <div className="relative flex items-center justify-center mb-5">
          <svg viewBox="0 0 120 120" className="w-32 h-32">
            {total === 0 ? (
              <circle cx="60" cy="60" r="45" fill="none" className="stroke-muted" strokeWidth="12" />
            ) : (
              segments.map((seg, i) => (
                <path
                  key={seg.label}
                  d={describeArc(60, 60, 45, seg.start, seg.end)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredIndex === i ? 14 : 12}
                  className="transition-all duration-200 cursor-pointer"
                  style={{ opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.35 : 1 }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))
            )}
            <text x="60" y="56" textAnchor="middle" className="fill-foreground text-[22px] font-medium tabular-nums" dominantBaseline="middle">
              {total}
            </text>
            <text x="60" y="76" textAnchor="middle" className="fill-muted-foreground text-[8px] font-medium">
              Total
            </text>
          </svg>
        </div>

        <div className={cnGrid(contractData.length)}>
          {contractData.length === 0 ? (
            <p className="col-span-full text-center text-xs text-muted-foreground">No placement data yet</p>
          ) : (
            contractData.map((item, i) => (
              <div
                key={item.label}
                className="text-center cursor-pointer transition-all hover:scale-105"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span
                  className="mx-auto mb-1 block size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xl font-medium text-foreground tabular-nums">{item.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function cnGrid(count: number) {
  if (count <= 2) return "grid grid-cols-2 gap-2 pt-4 border-t border-border/60";
  if (count === 3) return "grid grid-cols-3 gap-2 pt-4 border-t border-border/60";
  return "grid grid-cols-4 gap-2 pt-4 border-t border-border/60";
}
