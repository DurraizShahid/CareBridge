"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, ChartNoAxesColumnIncreasing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ActivityCardProps {
  loading?: boolean;
  error?: boolean;
}

export function ActivityCard({ error }: ActivityCardProps) {
  const [hoveredSegment, setHoveredSegment] = useState<"referrals" | "matches" | null>(null);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

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

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 1200;
    const steps = 60;
    const increment = total / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= total) {
        setAnimatedTotal(total);
        clearInterval(timer);
      } else {
        setAnimatedTotal(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isVisible]);

  if (error) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm h-full bg-primary/90">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-primary-foreground/80">Activity data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm h-full bg-primary/90 transition-all duration-200 hover:shadow-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest text-primary-foreground uppercase">Placement Activity</h3>
          <div className="flex items-center gap-1">
            <button
              aria-label="Chart view"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <ChartNoAxesColumnIncreasing className="size-4 text-primary-foreground/70" />
            </button>
            <button
              aria-label="More"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <MoreHorizontal className="size-4 text-primary-foreground/70" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 200" className="w-56 h-56">
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={hoveredSegment === "referrals" ? "26" : "22"}
              strokeDasharray={`${referralsLength} ${circumference - referralsLength}`}
              transform="rotate(-90 100 100)"
              strokeLinecap="round"
              className="transition-all duration-300 cursor-pointer"
              style={{
                strokeDashoffset: isVisible ? 0 : circumference,
                opacity: hoveredSegment && hoveredSegment !== "referrals" ? 0.4 : 1,
              }}
              onMouseEnter={() => setHoveredSegment("referrals")}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#A0E0E0"
              strokeWidth={hoveredSegment === "matches" ? "26" : "22"}
              strokeDasharray={`${matchesLength} ${circumference - matchesLength}`}
              transform={`rotate(${matchesRotation} 100 100)`}
              strokeLinecap="round"
              className="transition-all duration-300 cursor-pointer"
              style={{
                strokeDashoffset: isVisible ? 0 : circumference,
                opacity: hoveredSegment && hoveredSegment !== "matches" ? 0.4 : 1,
              }}
              onMouseEnter={() => setHoveredSegment("matches")}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <text x="100" y="92" textAnchor="middle" dominantBaseline="middle" className="fill-primary-foreground text-[40px] font-medium tabular-nums leading-none">
              {animatedTotal}
            </text>
            <text x="100" y="120" textAnchor="middle" dominantBaseline="middle" className="fill-primary-foreground/70 text-[12px]">
              Total Referrals
            </text>
          </svg>
        </div>

        <div className="flex items-center justify-center gap-8 mt-2">
          <button
            className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-white/10 active:scale-95"
            onMouseEnter={() => setHoveredSegment("referrals")}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <span className={`size-3 rounded-full bg-primary-foreground transition-transform duration-200 ${hoveredSegment === "referrals" ? "scale-125" : ""}`} />
            <span className="text-xs text-primary-foreground/70">Referrals</span>
            <span className="text-xs font-semibold text-primary-foreground">{referrals}</span>
          </button>
          <button
            className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-white/10 active:scale-95"
            onMouseEnter={() => setHoveredSegment("matches")}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <span className={`size-3 rounded-full bg-[#A0E0E0] transition-transform duration-200 ${hoveredSegment === "matches" ? "scale-125" : ""}`} />
            <span className="text-xs text-primary-foreground/70">Matches</span>
            <span className="text-xs font-semibold text-primary-foreground">{matches}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
