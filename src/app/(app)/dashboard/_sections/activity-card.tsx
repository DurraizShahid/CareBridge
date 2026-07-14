"use client";

import { MoreHorizontal, ChartNoAxesColumnIncreasing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ActivityCardProps {
  loading?: boolean;
  error?: boolean;
}

export function ActivityCard({ error }: ActivityCardProps) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const total = 100;
  const referrals = 70;
  const matches = 30;
  const referralsPct = (referrals / total) * 100;
  const matchesPct = (matches / total) * 100;
  const referralsLength = circumference * (referralsPct / 100);
  const matchesLength = circumference * (matchesPct / 100);
  const matchesRotation = -90 + (referralsPct / 100) * 360;

  if (error) {
    return (
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full !bg-[#277979] font-body">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-white/80">Activity data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border-border/60 shadow-sm h-full !bg-[#277979] font-body">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest text-white uppercase">Placement Activity</h3>
          <div className="flex items-center gap-1">
            <button aria-label="Chart view" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ChartNoAxesColumnIncreasing className="size-4 text-white/70" />
            </button>
            <button aria-label="More" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <MoreHorizontal className="size-4 text-white/70" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 200" className="w-56 h-56">
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="22"
              strokeDasharray={`${referralsLength} ${circumference - referralsLength}`}
              transform="rotate(-90 100 100)"
            />
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#A0E0E0"
              strokeWidth="22"
              strokeDasharray={`${matchesLength} ${circumference - matchesLength}`}
              transform={`rotate(${matchesRotation} 100 100)`}
            />
            <text x="100" y="92" textAnchor="middle" dominantBaseline="middle" className="fill-white text-[40px] font-medium tabular-nums leading-none">
              {total}
            </text>
            <text x="100" y="120" textAnchor="middle" dominantBaseline="middle" className="fill-white/70 text-[12px]">
              Total Referrals
            </text>
          </svg>
        </div>

        <div className="flex items-center justify-center gap-8 mt-2">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-white" />
            <span className="text-xs text-white/70">Referrals</span>
            <span className="text-xs font-semibold text-white">{referrals}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#A0E0E0]" />
            <span className="text-xs text-white/70">Matches</span>
            <span className="text-xs font-semibold text-white">{matches}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
