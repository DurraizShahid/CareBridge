"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

const days = ["S", "M", "T", "W", "T", "F", "S"];
const values = [2.1, 5.8, 4.2, 3.9, 6.1, 5.4, 0];
const maxValue = Math.max(...values);
const activeIndex = 4; // Friday is the active day

export function SomethingElseCard({ className }: { className?: string }) {
  const activeValue = values[activeIndex];
  const hours = Math.floor(activeValue);
  const minutes = Math.round((activeValue - hours) * 60);

  return (
    <Card
      className={cn(
        "rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl font-body overflow-hidden",
        className
      )}
    >
      <CardContent className="flex flex-col h-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-bold tracking-wide text-foreground">
            Something Else
          </h3>
          <button
            aria-label="View full progress"
            className="flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#F5F5F4",
            }}
          >
            <ArrowUpRight className="size-4 text-foreground/60" />
          </button>
        </div>

        {/* Metric */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold tracking-tight text-foreground">
            {hours}.{minutes > 0 ? minutes : 0}h
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            Work Time<br />this week
          </span>
        </div>

        {/* Bar Chart */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-end justify-between gap-2 h-full">
            {days.map((day, i) => {
              const height = (values[i] / maxValue) * 100;
              const isActive = i === activeIndex;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 flex-1 h-full justify-end"
                >
                  {/* Tooltip for active bar */}
                  {isActive && (
                    <div className="relative mb-1">
                      <div
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white whitespace-nowrap"
                        style={{ backgroundColor: "#E5A626" }}
                      >
                        {hours}h {minutes}m
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                        style={{ backgroundColor: "#E5A626" }}
                      />
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    className="w-full rounded-full transition-all duration-200"
                    style={{
                      height: `${Math.max(height, 8)}%`,
                      backgroundColor: isActive ? "#E5A626" : "#1C1917",
                      minHeight: "12px",
                    }}
                  />

                  {/* Day label */}
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
