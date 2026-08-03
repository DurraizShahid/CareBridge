"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ContractTypeCardProps {
  loading?: boolean;
  error?: boolean;
}

const contractData = [
  { label: "Skilled Nursing", value: 92, color: "#e9edf8" },
  { label: "Assisted Living", value: 48, color: "#dff1e6" },
  { label: "Home Health", value: 36, color: "#eef8f6" },
  { label: "Memory Care", value: 24, color: "#f4f5fb" },
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

export function ContractTypeCard({ error }: ContractTypeCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = contractData.reduce((a, b) => a + b.value, 0);

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
          <p className="text-sm text-[#8d8a98]">Care level data unavailable</p>
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
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold tracking-tight text-[#1e1d24]">Placement by Care Level</h3>
          <button aria-label="Details" className="p-1.5 rounded-lg hover:bg-[#f3f1f8] transition-colors">
            <ArrowUpRight className="size-4 text-[#8d8a98]" />
          </button>
        </div>

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
            <text x="60" y="54" textAnchor="middle" className="fill-[#111014] text-[22px] font-light" dominantBaseline="middle">
              {total}
            </text>
            <text x="60" y="76" textAnchor="middle" className="fill-[#8d8a98] text-[5px] font-medium">
              Total
            </text>
          </svg>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#eceaf2]">
          {contractData.map((item, i) => (
            <div
              key={item.label}
              className="text-center cursor-pointer transition-all hover:scale-105"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <p className="text-xl font-light text-[#111014] tabular-nums">{item.value}</p>
              <p className="text-[10px] text-[#8d8a98] mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
