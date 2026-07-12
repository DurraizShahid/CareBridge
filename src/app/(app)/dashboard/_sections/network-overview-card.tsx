"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface NetworkOverviewCardProps {
  totalHospitals: number;
  totalFacilities: number;
}

export default function NetworkOverviewCard({ totalHospitals, totalFacilities }: NetworkOverviewCardProps) {
  const total = totalHospitals + totalFacilities;
  const hospitalPct = total > 0 ? (totalHospitals / total) * 100 : 0;
  const facilityPct = total > 0 ? (totalFacilities / total) * 100 : 0;

  const cx = 64;
  const cy = 64;
  const r = 48;
  const strokeWidth = 8;
  const gap = 16;

  const arcStart = 140;
  const arcTotal = 260;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number) => {
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const sweep = end - start;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };

  const hospitalAngle = arcTotal * (hospitalPct / 100);
  const facilityAngle = arcTotal * (facilityPct / 100);

  const hStart = arcStart;
  const hEnd = arcStart + hospitalAngle;
  const fStart = hEnd + gap;
  const fEnd = fStart + facilityAngle;

  return (
    <Card className="group shadow-sm card-glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-health/5 hover:scale-[1.02]">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-muted-foreground">Network Overview</h3>
          <Link href="/facilities" className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        <div className="relative flex items-center justify-center my-2">
          <svg width="140" height="110" viewBox="0 0 128 100" className="overflow-visible">
            <path
              d={arcPath(arcStart, arcStart + arcTotal)}
              fill="none"
              className="stroke-muted-foreground/15"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {hospitalPct > 0 && (
              <path
                d={arcPath(hStart, hEnd)}
                fill="none"
                className="stroke-health drop-shadow-[0_0_6px_oklch(0.55_0.15_215/0.3)]"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
            {facilityPct > 0 && (
              <path
                d={arcPath(fStart, Math.min(fEnd, arcStart + arcTotal))}
                fill="none"
                className="stroke-warmth drop-shadow-[0_0_6px_oklch(0.6_0.15_280/0.3)]"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center mt-6">
              <span className="text-4xl font-semibold text-foreground tracking-tight">{total}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/30 transition-colors duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-health shadow-[0_0_8px_oklch(0.55_0.15_215/0.4)]" />
              <span className="text-sm text-foreground">Hospitals</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{totalHospitals}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/30 transition-colors duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-warmth shadow-[0_0_8px_oklch(0.6_0.15_280/0.4)]" />
              <span className="text-sm text-foreground">Facilities</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{totalFacilities}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
