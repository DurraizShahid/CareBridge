"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlacementsDotMatrixProps {
  completedPlacements: number;
  pendingApprovals: number;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const monthData: Record<string, { completed: number; pending: number }> = {
  January: { completed: 18, pending: 4 },
  February: { completed: 22, pending: 6 },
  March: { completed: 15, pending: 3 },
  April: { completed: 28, pending: 8 },
  May: { completed: 32, pending: 5 },
  June: { completed: 25, pending: 7 },
  July: { completed: 12, pending: 2 },
  August: { completed: 20, pending: 4 },
  September: { completed: 35, pending: 9 },
  October: { completed: 19, pending: 3 },
  November: { completed: 27, pending: 6 },
  December: { completed: 24, pending: 5 },
};

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function PlacementsDotMatrix({ completedPlacements, pendingApprovals }: PlacementsDotMatrixProps) {
  const [selectedMonth, setSelectedMonth] = useState("September");
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  const data = monthData[selectedMonth];
  const totalDots = 40;
  const filled = data.completed;
  const pending = data.pending;

  const dotPattern = Array.from({ length: totalDots }, (_, i) => {
    const r = seededRandom(i + months.indexOf(selectedMonth) * 100);
    if (i < filled) return "filled";
    if (i < filled + pending && r > 0.4) return "pending";
    return "empty";
  });

  const filledCount = dotPattern.filter((d) => d === "filled").length;
  const pendingCount = dotPattern.filter((d) => d === "pending").length;

  return (
    <Card className="group shadow-sm card-glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-health/5 hover:scale-[1.02]">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Placements</h3>
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/70 text-xs font-medium text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {selectedMonth}
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="absolute top-full left-0 mt-1 py-1 bg-card/95 backdrop-blur-md rounded-xl shadow-xl z-50 w-36 border border-border/50">
                  {months.map((month) => (
                    <button
                      key={month}
                      onClick={() => { setSelectedMonth(month); setIsOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${
                        selectedMonth === month ? "text-warmth font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Link href="/placements" className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        <div className="flex items-baseline gap-3 mb-4">
          <div className="flex items-center gap-1">
            <span className="text-3xl font-semibold text-foreground leading-none">{filledCount}</span>
            <svg className="w-3 h-3 text-warmth" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3l5 5H3l5-5z" />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-3xl font-semibold text-foreground/35 leading-none">{pendingCount}</span>
            <svg className="w-3 h-3 text-foreground/25" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 13l5-5H3l5 5z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-1.5">
          {dotPattern.map((type, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredDot(i)}
              onMouseLeave={() => setHoveredDot(null)}
              className={`aspect-square rounded-full transition-all duration-200 cursor-pointer ${
                type === "filled"
                  ? hoveredDot === i
                    ? "bg-warmth scale-150 shadow-lg shadow-warmth/30"
                    : "bg-warmth hover:scale-125"
                  : type === "pending"
                    ? hoveredDot === i
                      ? "bg-foreground/30 scale-150 shadow-lg shadow-foreground/10"
                      : "bg-foreground/20 hover:bg-foreground/30 hover:scale-125"
                    : hoveredDot === i
                      ? "bg-foreground/15 scale-125"
                      : "bg-foreground/8"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warmth" />
            <span className="text-[10px] text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-foreground/20" />
            <span className="text-[10px] text-muted-foreground">Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
