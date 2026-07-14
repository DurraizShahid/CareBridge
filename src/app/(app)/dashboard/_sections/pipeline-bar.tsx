"use client";

import { useState } from "react";

interface PipelineBarProps {
  total: number;
  completed: number;
  active: number;
  thisMonth: number;
}

export function PipelineBar({ total, completed, active, thisMonth }: PipelineBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hasRealData = total > 0 || completed > 0 || active > 0 || thisMonth > 0;

  const dTotal = hasRealData ? total : 40;
  const dCompleted = hasRealData ? completed : 35;
  const dActive = hasRealData ? active : 12;
  const dThisMonth = hasRealData ? thisMonth : 18;

  const segments = [
    { label: "Completed", value: dCompleted, flex: dCompleted, color: "bg-[#277979]", textColor: "text-white", bg: "#277979" },
    { label: "Active", value: dActive, flex: dActive, color: "bg-[#bab9c4]", textColor: "text-[#1a1a1a]", bg: "#bab9c4" },
    { label: "Total", value: dTotal, flex: dTotal, color: "hatched", textColor: "text-foreground", bg: "transparent" },
    { label: "This month", value: dThisMonth, flex: dThisMonth, color: "bordered", textColor: "text-foreground", bg: "transparent" },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Labels */}
      <div className="flex items-center gap-1.5">
        {segments.map((seg, i) => (
          <span
            key={i}
            className="text-[11px] font-medium text-muted-foreground truncate text-center transition-colors duration-200"
            style={{
              flex: `${seg.flex} 1 0`,
              color: hoveredIndex === i ? "#155F60" : undefined,
            }}
          >
            {seg.label}
          </span>
        ))}
      </div>

      {/* Pills */}
      <div className="flex items-center gap-1.5 h-12">
        {segments.map((seg, i) => {
          const isHovered = hoveredIndex === i;
          const isOtherHovered = hoveredIndex !== null && hoveredIndex !== i;

          if (seg.color === "hatched") {
            return (
              <div
                key={i}
                className="h-full rounded-full flex items-center justify-start pl-3 text-[11px] font-medium relative overflow-hidden bg-background cursor-pointer transition-all duration-200"
                style={{
                  flex: `${seg.flex} 1 0`,
                  transform: isHovered ? "scaleY(1.1)" : "scaleY(1)",
                  opacity: isOtherHovered ? 0.6 : 1,
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className="absolute inset-0 opacity-40 transition-opacity duration-200"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 3px, oklch(0.78 0.02 250) 3px, oklch(0.78 0.02 250) 4px)",
                    opacity: isHovered ? 0.6 : 0.4,
                  }}
                />
                <span className={`relative z-10 ${seg.textColor} transition-all duration-200`}>{seg.value}</span>
              </div>
            );
          }

          if (seg.color === "bordered") {
            return (
              <div
                key={i}
                className="h-full rounded-full border border-border flex items-center justify-start pl-3 text-[11px] font-medium bg-background cursor-pointer transition-all duration-200"
                style={{
                  flex: `${seg.flex} 1 0`,
                  transform: isHovered ? "scaleY(1.1)" : "scaleY(1)",
                  opacity: isOtherHovered ? 0.6 : 1,
                  borderColor: isHovered ? "#277979" : undefined,
                  boxShadow: isHovered ? "0 0 0 1px rgba(39,121,121,0.2)" : undefined,
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className={`${seg.textColor} transition-colors duration-200`} style={{ color: isHovered ? "#155F60" : undefined }}>{seg.value}</span>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`h-full rounded-full flex items-center justify-start pl-3 text-[11px] font-medium cursor-pointer transition-all duration-200`}
              style={{
                flex: `${seg.flex} 1 0`,
                backgroundColor: seg.bg,
                color: seg.textColor === "text-white" ? "#FFFFFF" : "#1a1a1a",
                transform: isHovered ? "scaleY(1.1)" : "scaleY(1)",
                opacity: isOtherHovered ? 0.6 : 1,
                boxShadow: isHovered ? `0 4px 12px ${seg.bg}40` : undefined,
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {seg.value}
            </div>
          );
        })}
      </div>
    </div>
  );
}
