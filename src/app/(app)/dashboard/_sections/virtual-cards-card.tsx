"use client";

import { Building2, Hospital } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface VirtualCardsCardProps {
  loading?: boolean;
  error?: boolean;
}

const facilities = [
  { name: "Northside Nursing", type: "Nursing Home", total: 45, available: 12 },
  { name: "Greenfield Care", type: "Care Center", total: 30, available: 3 },
  { name: "Sunnyvale Care", type: "Care Center", total: 25, available: 8 },
  { name: "St. Mary's Hospital", type: "Hospital", total: 20, available: 0 },
  { name: "Memorial Hospital", type: "Hospital", total: 50, available: 15 },
];

const totalBeds = facilities.reduce((s, f) => s + f.total, 0);
const availableBeds = facilities.reduce((s, f) => s + f.available, 0);
const occupancyRate = Math.round(((totalBeds - availableBeds) / totalBeds) * 100);

export function VirtualCardsCard({ loading, error }: VirtualCardsCardProps) {
  if (error) {
    return (
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl font-body">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Facility data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl font-body">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">Hospitals & Facilities</h3>
          <button aria-label="Card menu" className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
            <Building2 className="size-4 text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground leading-none">{facilities.length}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Facilities</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground leading-none">{availableBeds}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Beds Open</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground leading-none">{occupancyRate}%</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Occupied</p>
              </div>
            </div>

            <div className="space-y-2">
              {facilities.map((f) => {
                const pct = Math.round(((f.total - f.available) / f.total) * 100);
                const isFull = f.available === 0;
                const isLow = f.available <= 5 && f.available > 0;
                return (
                  <div key={f.name} className="flex items-center gap-2.5">
                    <div className={cn(
                      "size-7 rounded-lg flex items-center justify-center shrink-0",
                      f.type === "Hospital" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {f.type === "Hospital" ? <Hospital className="size-3.5" /> : <Building2 className="size-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-foreground truncate">{f.name}</span>
                        <span className={cn(
                          "text-[10px] font-medium tabular-nums ml-2",
                          isFull ? "text-red-500" : isLow ? "text-amber-500" : "text-muted-foreground"
                        )}>
                          {f.available}/{f.total}
                        </span>
                      </div>
                      <div className="h-1 bg-muted/60 rounded-full mt-1 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isFull ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
