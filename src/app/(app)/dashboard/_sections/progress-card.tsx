"use client";

import { Card, CardContent } from "@/components/ui/card";

const BAR = "var(--chart-1)";
const TODAY = "var(--chart-3)";

interface ProgressCardProps {
  data?: { day: string; count: number; isToday: boolean }[];
}

export function ProgressCard({ data = [] }: ProgressCardProps) {
  const weekData = data.length
    ? data.map((item) => ({
        day: item.day,
        count: item.count,
        active: item.isToday,
      }))
    : Array.from({ length: 7 }, (_, i) => ({
        day: ["S", "M", "T", "W", "T", "F", "S"][i],
        count: 0,
        active: false,
      }));

  const totalCount = weekData.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...weekData.map((d) => d.count), 1);

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
          filter: brightness(1.1);
        }
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
      `}</style>

      <Card className="h-full overflow-hidden">
        <CardContent className="flex flex-col h-full p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Weekly Placements
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[32px] font-medium tracking-tight text-foreground tabular-nums">
                  {totalCount}
                </span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  Created<br />this week
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-2 mt-4 pb-1 min-h-0">
            {weekData.map((item, idx) => {
              const heightPercent = (item.count / maxCount) * 100;
              const barColor = item.active ? TODAY : BAR;
              return (
                <div
                  key={idx}
                  className="bar-col flex-1 flex flex-col items-center h-full cursor-pointer"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex-1 flex items-end justify-center w-full min-h-0">
                    <div
                      className="bar-fill rounded-full relative"
                      style={{
                        width: "28%",
                        height: `${Math.max(heightPercent, 6)}%`,
                        minHeight: "6px",
                        backgroundColor: barColor,
                        opacity: item.count === 0 ? 0.15 : 1,
                        animationDelay: `${0.2 + idx * 100}ms`,
                      }}
                    >
                      {item.count > 0 && (
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-10 ${
                            item.active ? "always-tooltip" : "hover-tooltip"
                          }`}
                        >
                          <div className="relative">
                            <div className="rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap text-background">
                              {item.count}
                            </div>
                            <div
                              className="absolute left-1/2 -translate-x-1/2 top-full"
                              style={{
                                width: 0, height: 0,
                                borderLeft: "4px solid transparent",
                                borderRight: "4px solid transparent",
                                borderTop: "4px solid var(--foreground)",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 flex-none ${
                      item.active
                        ? "font-semibold text-foreground"
                        : "font-medium text-muted-foreground"
                    }`}
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
