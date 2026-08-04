"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ActivityCardProps {
  loading?: boolean;
  error?: boolean;
  data?: {
    referrals: number;
    matches: number;
  };
}

const REFERRALS_COLOR = "var(--chart-1)";
const MATCHES_COLOR = "var(--chart-2)";

export function ActivityCard({ error, data }: ActivityCardProps) {
  const [hoveredSegment, setHoveredSegment] = useState<"referrals" | "matches" | null>(null);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const referrals = data?.referrals ?? 0;
  const matches = data?.matches ?? 0;
  const total = referrals + matches;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const referralsPct = total > 0 ? (referrals / total) * 100 : 0;
  const matchesPct = total > 0 ? (matches / total) * 100 : 0;
  const referralsLength = circumference * (referralsPct / 100);
  const matchesLength = circumference * (matchesPct / 100);
  const matchesRotation = -90 + (referralsPct / 100) * 360;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible || total === 0) return;
    const duration = 1200;
    const steps = 60;
    const target = total;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedTotal(target);
        clearInterval(timer);
      } else {
        setAnimatedTotal(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isVisible, total]);

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Activity data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Placement Activity</h3>
        </div>

        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 200" className="w-48 h-48">
            {total > 0 ? (
              <>
                <circle
                  cx="100" cy="100" r={radius}
                  fill="none"
                  stroke={REFERRALS_COLOR}
                  strokeWidth={hoveredSegment === "referrals" ? "26" : "22"}
                  strokeDasharray={`${referralsLength} ${circumference - referralsLength}`}
                  transform="rotate(-90 100 100)"
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    strokeDashoffset: isVisible ? 0 : circumference,
                    opacity: hoveredSegment && hoveredSegment !== "referrals" ? 0.35 : 1,
                  }}
                  onMouseEnter={() => setHoveredSegment("referrals")}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
                <circle
                  cx="100" cy="100" r={radius}
                  fill="none"
                  stroke={MATCHES_COLOR}
                  strokeWidth={hoveredSegment === "matches" ? "26" : "22"}
                  strokeDasharray={`${matchesLength} ${circumference - matchesLength}`}
                  transform={`rotate(${matchesRotation} 100 100)`}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    strokeDashoffset: isVisible ? 0 : circumference,
                    opacity: hoveredSegment && hoveredSegment !== "matches" ? 0.35 : 1,
                  }}
                  onMouseEnter={() => setHoveredSegment("matches")}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              </>
            ) : (
              <circle
                cx="100" cy="100" r={radius}
                fill="none"
                className="stroke-muted"
                strokeWidth="22"
              />
            )}
            <text x="100" y="92" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-[40px] font-medium tabular-nums leading-none">
              {total === 0 ? 0 : animatedTotal}
            </text>
            <text x="100" y="120" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[12px]">
              Active Pipeline
            </text>
          </svg>
        </div>

        <div className="flex items-center justify-center gap-8 mt-2">
          <button
            className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-muted active:scale-95"
            onMouseEnter={() => setHoveredSegment("referrals")}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <span
              className={`size-3 rounded-full transition-transform duration-200 ${hoveredSegment === "referrals" ? "scale-125" : ""}`}
              style={{ backgroundColor: REFERRALS_COLOR }}
            />
            <span className="text-xs text-muted-foreground">Open</span>
            <span className="text-xs font-semibold tabular-nums text-foreground">{referrals}</span>
          </button>
          <button
            className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-muted active:scale-95"
            onMouseEnter={() => setHoveredSegment("matches")}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <span
              className={`size-3 rounded-full transition-transform duration-200 ${hoveredSegment === "matches" ? "scale-125" : ""}`}
              style={{ backgroundColor: MATCHES_COLOR }}
            />
            <span className="text-xs text-muted-foreground">Matched</span>
            <span className="text-xs font-semibold tabular-nums text-foreground">{matches}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
