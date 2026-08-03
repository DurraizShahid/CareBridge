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
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-[#8d8a98]">Activity data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold tracking-tight text-[#1e1d24]">Placement Activity</h3>
          <div className="flex items-center gap-1">
            <button aria-label="Chart view" className="p-1.5 rounded-lg hover:bg-[#f3f1f8] transition-colors">
              <ChartNoAxesColumnIncreasing className="size-4 text-[#8d8a98]" />
            </button>
            <button aria-label="More" className="p-1.5 rounded-lg hover:bg-[#f3f1f8] transition-colors">
              <MoreHorizontal className="size-4 text-[#8d8a98]" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 200" className="w-48 h-48">
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#e9edf8"
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
              stroke="#dff1e6"
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
            <text x="100" y="92" textAnchor="middle" dominantBaseline="middle" className="fill-[#111014] text-[40px] font-medium tabular-nums leading-none">
              {animatedTotal}
            </text>
            <text x="100" y="120" textAnchor="middle" dominantBaseline="middle" className="fill-[#8d8a98] text-[12px]">
              Total Referrals
            </text>
          </svg>
        </div>

        <div className="flex items-center justify-center gap-8 mt-2">
          <button
            className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-[#f3f1f8] active:scale-95"
            onMouseEnter={() => setHoveredSegment("referrals")}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <span className={`size-3 rounded-full bg-[#111014] transition-transform duration-200 ${hoveredSegment === "referrals" ? "scale-125" : ""}`} />
            <span className="text-xs text-[#8d8a98]">Referrals</span>
            <span className="text-xs font-semibold text-[#111014]">{referrals}</span>
          </button>
          <button
            className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-[#f3f1f8] active:scale-95"
            onMouseEnter={() => setHoveredSegment("matches")}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <span className={`size-3 rounded-full bg-[#dff1e6] transition-transform duration-200 ${hoveredSegment === "matches" ? "scale-125" : ""}`} />
            <span className="text-xs text-[#8d8a98]">Matches</span>
            <span className="text-xs font-semibold text-[#111014]">{matches}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
