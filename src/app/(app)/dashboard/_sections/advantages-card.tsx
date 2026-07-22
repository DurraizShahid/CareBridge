"use client";

import { Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AdvantagesCardProps {
  loading?: boolean;
  error?: boolean;
}

export function AdvantagesCard({ loading, error }: AdvantagesCardProps) {
  if (error) {
    return (
      <Card className="h-full bg-card">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Performance data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">Platform Performance</h3>
          <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
            <Sparkles className="size-3" />
            12 Days
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-28" />
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">Average time to place (vs 28d industry avg)</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-2xl font-light text-foreground tabular-nums">94%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Placement success rate</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-2xl font-light text-foreground tabular-nums">72</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Partner facilities</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3">
              <TrendingUp className="size-4 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                23% cost savings vs traditional placement
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
