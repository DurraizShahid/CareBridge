"use client";

import { MoreHorizontal, ChartNoAxesColumnIncreasing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ActivityCardProps {
  loading?: boolean;
  error?: boolean;
}

export function ActivityCard({ error }: ActivityCardProps) {
  const circumference = 2 * Math.PI * 70;
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
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl font-body">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Activity data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl font-body">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">Placement Activity</h3>
          <div className="flex items-center gap-1">
            <button aria-label="Chart view" className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
              <ChartNoAxesColumnIncreasing className="size-4 text-muted-foreground" />
            </button>
            <button aria-label="More" className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 200" className="w-44 h-44">
            <circle
              cx="100" cy="100" r="70"
              fill="none"
              stroke="#277979"
              strokeWidth="22"
              strokeDasharray={`${referralsLength} ${circumference - referralsLength}`}
              transform="rotate(-90 100 100)"
            />
            <circle
              cx="100" cy="100" r="70"
              fill="none"
              stroke="#A0E0E0"
              strokeWidth="22"
              strokeDasharray={`${matchesLength} ${circumference - matchesLength}`}
              transform={`rotate(${matchesRotation} 100 100)`}
            />
            <text x="100" y="90" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-[32px] font-light tabular-nums">
              {total}
            </text>
            <text x="100" y="115" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
              matches
            </text>
          </svg>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#277979]" />
            <span className="text-[10px] text-muted-foreground">Referrals</span>
            <span className="text-[10px] font-medium text-foreground">{referrals}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#A0E0E0]" />
            <span className="text-[10px] text-muted-foreground">Matches</span>
            <span className="text-[10px] font-medium text-foreground">{matches}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
