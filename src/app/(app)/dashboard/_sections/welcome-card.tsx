"use client";

import Link from "next/link";
import { Sparkles, ArrowUpRight, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WelcomeCardProps {
  data?: {
    averagePlacementTimeDays: number;
    successRate: number;
    partnerFacilities: number;
  };
}

export default function WelcomeCard({ data }: WelcomeCardProps) {
  const successRate = data?.successRate ?? 0;
  const partnerFacilities = data?.partnerFacilities ?? 0;
  const avgDays = data?.averagePlacementTimeDays ?? 0;

  return (
    <Card
      className="h-full"
      style={{ background: "color-mix(in oklab, var(--primary) 4%, var(--card))" }}
    >
      <CardContent className="p-6 flex flex-col gap-5 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Network Snapshot</span>
          </div>
          <Link
            href="/dashboard/facility-network"
            aria-label="Open facility network"
            className="flex size-8 items-center justify-center rounded-full bg-card transition-colors hover:bg-muted"
          >
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </Link>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-[var(--chart-2)]" />
            {partnerFacilities} partner facilities
          </div>
          <span className="text-[13px] text-muted-foreground">
            {avgDays > 0 ? `${avgDays}d avg placement` : "Live network metrics"}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-[42px] font-medium tracking-tight text-foreground leading-none tabular-nums">
            {successRate}%
          </span>
          <span className="text-[13px] text-muted-foreground">completion rate</span>
        </div>

        <div className="relative h-16">
          <svg viewBox="0 0 300 60" className="w-full h-full" aria-hidden="true">
            <defs>
              <linearGradient id="networkSparkline" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--chart-1)" />
              </linearGradient>
            </defs>
            <path d="M0 45 Q50 40 100 42 T200 30 T250 22 T300 18" fill="none" stroke="url(#networkSparkline)" strokeWidth="2" />
            <circle cx="300" cy="18" r="4" fill="var(--chart-1)" />
          </svg>
        </div>

        <Link
          href="/dashboard/facility-network"
          className="mt-auto flex items-center justify-between rounded-full bg-card px-5 py-3 transition-all hover:shadow-sm active:scale-[0.98]"
        >
          <span className="text-sm font-medium text-foreground">Browse facility network</span>
          <div className="flex size-7 items-center justify-center rounded-full bg-primary">
            <ArrowRight className="size-3.5 text-primary-foreground" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
