"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractTypeCardProps {
  loading?: boolean;
  error?: boolean;
}

const contractData = [
  { label: "Skilled Nursing", value: 92, color: "hsl(var(--primary) / 0.7)" },
  { label: "Assisted Living", value: 48, color: "hsl(var(--primary) / 0.4)" },
  { label: "Home Health", value: 36, color: "hsl(var(--muted-foreground) / 0.3)" },
  { label: "Memory Care", value: 24, color: "hsl(var(--muted-foreground) / 0.15)" },
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

export function ContractTypeCard({ loading, error }: ContractTypeCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = contractData.reduce((a, b) => a + b.value, 0);

  if (error) {
    return (
      <Card hoverable className="h-full bg-card">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Care level data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  let currentAngle = 0;
  const segments = contractData.map((item) => {
    const angle = (item.value / total) * 360;
    const seg = { ...item, start: currentAngle, end: currentAngle + angle };
    currentAngle += angle;
    return seg;
  });

  return (
    <Card hoverable className="h-full bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">Placement by Care Level</h3>
          <div className="flex items-center gap-1">
            <button aria-label="Details" className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 flex flex-col items-center">
            <Skeleton className="size-32 rounded-full" />
            <div className="flex gap-6">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex items-center justify-center mb-5">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                {segments.map((seg, i) => (
                  <path
                    key={seg.label}
                    d={describeArc(60, 60, 45, seg.start, seg.end)}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={hoveredIndex === i ? 14 : 12}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}
                <text x="60" y="54" textAnchor="middle" className="fill-foreground text-[22px] font-light" dominantBaseline="middle">
                  {total}
                </text>
                <text x="60" y="76" textAnchor="middle" className="fill-muted-foreground text-[5px] font-medium">
                  Total
                </text>
              </svg>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border/30">
              {contractData.map((item, i) => (
                <div
                  key={item.label}
                  className="text-center cursor-pointer transition-all hover:scale-105"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <p className="text-xl font-light text-foreground tabular-nums">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
