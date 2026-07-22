"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Wallet, FileText } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const spendingData = [120, 85, 95, 110, 140, 65, 45];
const maxSpending = Math.max(...spendingData);

export default function SpendingCard() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const totalSpent = spendingData.reduce((a, b) => a + b, 0);
  const savings = 605.00;

  const chartWidth = 400;
  const chartHeight = 120;
  const padding = { top: 10, right: 10, bottom: 25, left: 10 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const toX = (i: number) => padding.left + (i / (days.length - 1)) * innerWidth;
  const toY = (v: number) => padding.top + (1 - v / maxSpending) * innerHeight;

  const linePath = spendingData
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`)
    .join(" ");

  const areaPath = `${linePath} L ${toX(days.length - 1)} ${chartHeight - padding.bottom} L ${toX(0)} ${chartHeight - padding.bottom} Z`;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm h-full">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Total Spent</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">Spent this week</p>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">$</span>
            <span className="text-4xl font-light text-foreground">
              {totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-emerald-500 rotate-180" />
            <span className="text-xs text-emerald-500 font-medium">
              +${savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="relative mb-4">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28">
            <defs>
              <linearGradient id="spendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path d={areaPath} fill="url(#spendGradient)" />
            <path d={linePath} fill="none" stroke="rgb(16, 185, 129)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            
            {spendingData.map((v, i) => (
              <circle
                key={i}
                cx={toX(i)}
                cy={toY(v)}
                r={hoveredIndex === i ? 5 : 3}
                className={`transition-all duration-200 ${
                  hoveredIndex === i
                    ? "fill-emerald-500 stroke-white stroke-2"
                    : "fill-emerald-400"
                }`}
              />
            ))}

            {hoveredIndex !== null && (
              <g>
                <rect
                  x={toX(hoveredIndex) - 30}
                  y={toY(spendingData[hoveredIndex]) - 35}
                  width="60"
                  height="24"
                  rx="6"
                  className="fill-emerald-500"
                />
                <text
                  x={toX(hoveredIndex)}
                  y={toY(spendingData[hoveredIndex]) - 19}
                  textAnchor="middle"
                  fill="white"
                  className="text-[10px] font-medium"
                >
                  ${spendingData[hoveredIndex]}
                </text>
              </g>
            )}

            {days.map((day, i) => (
              <text
                key={day}
                x={toX(i)}
                y={chartHeight - 5}
                textAnchor="middle"
                className={`text-[10px] ${
                  hoveredIndex === i ? "fill-foreground font-medium" : "fill-muted-foreground"
                }`}
              >
                {day}
              </text>
            ))}
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-light text-foreground">10</p>
              <p className="text-[10px] text-muted-foreground">Wallets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-light text-foreground">26</p>
              <p className="text-[10px] text-muted-foreground">Invoices</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
