"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlatformHealthChartProps {
  facilityUtilizationRate: number;
  averagePlacementTimeDays: number;
  totalHospitals: number;
  totalFacilities: number;
  totalPlacements: number;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const utilizationData = [72, 68, 75, 80, 78, 82, 85, 79, 74, 70, 76, 81];
const placementTimeData = [4.2, 3.8, 4.5, 3.9, 4.1, 3.6, 3.4, 3.7, 4.0, 4.3, 3.8, 3.5];

export default function PlatformHealthChart({
  facilityUtilizationRate,
  averagePlacementTimeDays,
  totalHospitals,
  totalFacilities,
  totalPlacements,
}: PlatformHealthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState("2024");
  const [isYearOpen, setIsYearOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const chartWidth = 700;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxUtil = Math.max(...utilizationData) + 10;
  const minUtil = Math.min(...utilizationData) - 10;
  const maxTime = Math.max(...placementTimeData) + 1;
  const minTime = Math.min(...placementTimeData) - 1;

  const toX = (i: number) => padding.left + (i / (months.length - 1)) * innerWidth;
  const toYUtil = (v: number) => padding.top + (1 - (v - minUtil) / (maxUtil - minUtil)) * innerHeight;
  const toYTime = (v: number) => padding.top + (1 - (v - minTime) / (maxTime - minTime)) * innerHeight;

  const utilPath = utilizationData
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toYUtil(v)}`)
    .join(" ");

  const timePath = placementTimeData
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toYTime(v)}`)
    .join(" ");

  const hoveredX = hoveredIndex !== null ? toX(hoveredIndex) : null;

  const yLabels = [60, 70, 80, 90, 100];

  return (
    <Card className="group shadow-sm card-glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-health/5 hover:scale-[1.02]">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Platform Health</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-health shadow-[0_0_6px_oklch(0.55_0.15_215/0.4)]" />
                <span className="text-[10px] text-muted-foreground">Utilization</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-foreground/60" />
                <span className="text-[10px] text-muted-foreground">Placement Time</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setIsYearOpen(!isYearOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/70 text-xs font-medium text-foreground transition-all duration-200"
              >
                {selectedYear}
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isYearOpen ? "rotate-180" : ""}`} />
              </button>
              {isYearOpen && (
                <div className="absolute top-full right-0 mt-1 py-1 bg-card/95 backdrop-blur-md rounded-xl shadow-xl z-50 w-24 border border-border/50">
                  {["2024", "2023", "2022"].map((year) => (
                    <button
                      key={year}
                      onClick={() => { setSelectedYear(year); setIsYearOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${
                        selectedYear === year ? "text-warmth font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/dashboard" className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-48"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {yLabels.map((label) => (
              <g key={label}>
                <text x={padding.left - 8} y={toYUtil(label)} textAnchor="end" className="fill-muted-foreground text-[10px]">
                  {label}
                </text>
                <line
                  x1={padding.left}
                  y1={toYUtil(label)}
                  x2={chartWidth - padding.right}
                  y2={toYUtil(label)}
                  stroke="currentColor"
                  className="text-border/20"
                  strokeDasharray="4 4"
                />
              </g>
            ))}

            {months.map((month, i) => (
              <text
                key={month}
                x={toX(i)}
                y={chartHeight - 8}
                textAnchor="middle"
                className={`text-[10px] transition-colors duration-200 ${
                  hoveredIndex === i ? "fill-foreground font-medium" : "fill-muted-foreground"
                }`}
              >
                {month}
              </text>
            ))}

            <path d={utilPath} fill="none" className="stroke-health" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={timePath} fill="none" className="stroke-foreground/40" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />

            {utilizationData.map((v, i) => (
              <circle key={`util-${i}`} cx={toX(i)} cy={toYUtil(v)} r="3" className="fill-health opacity-0 hover:opacity-100 transition-opacity duration-200" />
            ))}
            {placementTimeData.map((v, i) => (
              <circle key={`time-${i}`} cx={toX(i)} cy={toYTime(v)} r="3" className="fill-foreground/40 opacity-0 hover:opacity-100 transition-opacity duration-200" />
            ))}

            {hoveredIndex !== null && hoveredX !== null && (
              <>
                <line x1={hoveredX} y1={padding.top} x2={hoveredX} y2={chartHeight - padding.bottom} stroke="currentColor" className="text-foreground/20" strokeWidth="1" />
                <circle cx={hoveredX} cy={toYUtil(utilizationData[hoveredIndex])} r="5" className="fill-health stroke-card" strokeWidth="2" />
                <circle cx={hoveredX} cy={toYTime(placementTimeData[hoveredIndex])} r="5" className="fill-foreground/40 stroke-card" strokeWidth="2" />

                <rect x={hoveredX - 50} y={Math.min(toYUtil(utilizationData[hoveredIndex]), toYTime(placementTimeData[hoveredIndex])) - 45} width="100" height="36" rx="8" className="fill-foreground" />
                <text x={hoveredX} y={Math.min(toYUtil(utilizationData[hoveredIndex]), toYTime(placementTimeData[hoveredIndex])) - 28} textAnchor="middle" fill="white" className="text-[10px] font-medium">
                  Util: {utilizationData[hoveredIndex]}%
                </text>
                <text x={hoveredX} y={Math.min(toYUtil(utilizationData[hoveredIndex]), toYTime(placementTimeData[hoveredIndex])) - 16} textAnchor="middle" fill="white" className="text-[10px] font-medium">
                  Time: {placementTimeData[hoveredIndex]}d
                </text>
              </>
            )}

            {months.map((_, i) => (
              <rect
                key={`hitbox-${i}`}
                x={toX(i) - innerWidth / months.length / 2}
                y={padding.top}
                width={innerWidth / months.length}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
              />
            ))}
          </svg>

          {hoveredIndex !== null && (
            <div
              className="absolute bottom-9 px-2 py-1 rounded-lg bg-foreground text-background text-[10px] font-medium pointer-events-none -translate-x-1/2 shadow-lg"
              style={{ left: `${(toX(hoveredIndex) / chartWidth) * 100}%` }}
            >
              {months[hoveredIndex]}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/30">
          <div className="text-center p-2 rounded-xl hover:bg-muted/30 transition-colors duration-200 cursor-pointer group/stat">
            <p className="text-3xl font-semibold text-foreground transition-transform duration-200 group-hover/stat:scale-110">{totalHospitals}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Hospitals</p>
          </div>
          <div className="text-center p-2 rounded-xl hover:bg-muted/30 transition-colors duration-200 cursor-pointer group/stat">
            <p className="text-3xl font-semibold text-foreground transition-transform duration-200 group-hover/stat:scale-110">{totalFacilities}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Facilities</p>
          </div>
          <div className="text-center p-2 rounded-xl hover:bg-muted/30 transition-colors duration-200 cursor-pointer group/stat">
            <p className="text-3xl font-semibold text-foreground transition-transform duration-200 group-hover/stat:scale-110">{totalPlacements}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Placements</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
