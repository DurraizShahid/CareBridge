"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

const TEAL = "#277979";
const DARK_TEXT = "#155F60";
const YELLOW = "#F5C542";
const YELLOW_TEXT = "#6B5A1E";
const DOT_GRAY = "#C4C8CE";
const LABEL_GRAY = "#A0A5AD";

const weekData = [
  { day: "S", hours: 2.5, active: false, dot: DOT_GRAY },
  { day: "M", hours: 6.2, active: false, dot: TEAL },
  { day: "T", hours: 5.8, active: false, dot: TEAL },
  { day: "W", hours: 7.1, active: false, dot: TEAL },
  { day: "T", hours: 4.5, active: false, dot: TEAL },
  { day: "F", hours: 5.4, active: true, dot: YELLOW },
  { day: "S", hours: 0, active: false, dot: DOT_GRAY },
];

const totalHours = 6.1;
const maxHours = Math.max(...weekData.map((d) => d.hours));

function formatHours(h: number) {
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
}

export function ProgressCard() {
  return (
    <>
      <style>{`
        @keyframes barGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.7; }
        }
        .bar-col {
          animation: fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .bar-fill {
          transform-origin: bottom;
          animation: barGrow 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1), filter 0.35s ease;
        }
        .bar-col:hover .bar-fill {
          transform: scaleY(1.06);
          filter: brightness(1.2);
        }
        .dot-active { animation: dotPulse 2s ease-in-out infinite; }
        .hover-tooltip {
          opacity: 0;
          transform: translateY(4px) scale(0.85);
          transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1);
          pointer-events: none;
        }
        .bar-col:hover .hover-tooltip {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .always-tooltip {
          animation: fadeInUp 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) 0.5s both;
        }
        .day-label {
          transition: color 0.3s ease, font-weight 0.3s ease;
        }
        .bar-col:hover .day-label {
          color: ${DARK_TEXT} !important;
          font-weight: 700;
        }
        .bar-col:hover .dot-item {
          transform: scale(1.6);
        }
        .dot-item {
          transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
        }
      `}</style>

      <Card className="h-full bg-card overflow-hidden">
        <CardContent className="flex flex-col h-full p-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight" style={{ color: DARK_TEXT }}>
                Progress
              </h3>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-[28px] font-bold tracking-tight" style={{ color: DARK_TEXT }}>
                  {totalHours}h
                </span>
                <span className="text-[10px] leading-tight" style={{ color: "rgba(39,121,121,0.5)" }}>
                  Work Time<br />this week
                </span>
              </div>
            </div>
            <button
              aria-label="View full progress"
              className="flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95 bg-card shadow-sm"
              style={{
                width: "32px",
                height: "32px",
              }}
            >
              <ArrowUpRight className="size-3.5 transition-colors duration-200" style={{ color: TEAL }} />
            </button>
          </div>

          {/* Bar Chart */}
          <div className="flex-1 flex items-end gap-2 mt-4 pb-1 min-h-0">
            {weekData.map((item, idx) => {
              const heightPercent = maxHours > 0 ? (item.hours / maxHours) * 100 : 0;
              const barColor = item.active ? YELLOW : TEAL;
              const hoursText = formatHours(item.hours);
              return (
                <div
                  key={idx}
                  className="bar-col flex-1 flex flex-col items-center h-full cursor-pointer"
                  style={{ animationDelay: `${idx * 120}ms` }}
                >
                  {/* Bar container */}
                  <div className="flex-1 flex items-end justify-center w-full min-h-0">
                    {/* Bar — relative so tooltip sits at its tip */}
                    <div
                      className="bar-fill rounded-full relative"
                      style={{
                        width: "28%",
                        height: `${Math.max(heightPercent, 6)}%`,
                        minHeight: "6px",
                        backgroundColor: barColor,
                        opacity: item.hours === 0 ? 0.15 : 1,
                        animationDelay: `${0.2 + idx * 120}ms`,
                      }}
                    >
                      {/* Tooltip — anchored to bar tip */}
                      {item.hours > 0 && (
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-10 ${
                            item.active ? "always-tooltip" : "hover-tooltip"
                          }`}
                        >
                          <div className="relative">
                            <div
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                              style={{
                                backgroundColor: item.active ? YELLOW : TEAL,
                                color: item.active ? YELLOW_TEXT : "#FFFFFF",
                              }}
                            >
                              {hoursText}
                            </div>
                            <div
                              className="absolute left-1/2 -translate-x-1/2 top-full"
                              style={{
                                width: 0, height: 0,
                                borderLeft: "4px solid transparent",
                                borderRight: "4px solid transparent",
                                borderTop: `4px solid ${item.active ? YELLOW : TEAL}`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Dot */}
                  <div
                    className={`dot-item rounded-full mt-1.5 flex-none ${item.active ? "dot-active" : ""}`}
                    style={{
                      width: "5px",
                      height: "5px",
                      backgroundColor: item.dot,
                    }}
                  />
                  {/* Day label */}
                  <span
                    className="day-label text-[10px] font-medium mt-0.5 flex-none"
                    style={{ color: LABEL_GRAY }}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
