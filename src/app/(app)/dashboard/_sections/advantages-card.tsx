"use client";

import { Sparkles, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AdvantagesCardProps {
  loading?: boolean;
  error?: boolean;
}

export function AdvantagesCard({ loading, error }: AdvantagesCardProps) {
  if (error) {
    return (
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Advantages data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[21px] font-semibold text-muted-foreground">Advantages</h3>
          <div className="flex items-center gap-1 bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
            <Sparkles className="size-3" />
            15 Days
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
            <p className="text-xs text-muted-foreground mb-4">Your earnings with the pro version</p>

            <div className="relative h-14 mb-4" aria-hidden="true">
              <svg viewBox="0 0 240 50" className="w-full h-full">
                <defs>
                  <linearGradient id="miniLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--muted-foreground) / 0.15)" />
                    <stop offset="100%" stopColor="hsl(var(--muted-foreground) / 0.4)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 38 Q30 34 60 36 T120 30 T180 24 T240 18"
                  fill="none"
                  stroke="url(#miniLine)"
                  strokeWidth="1.5"
                />
                <circle cx="240" cy="18" r="3" className="fill-muted-foreground/60" />
              </svg>
            </div>

            <Button variant="ghost" size="sm" className="gap-1.5 rounded-full px-3 text-xs font-medium">
              Learn more
              <ArrowUpRight className="size-3" />
            </Button>

            <p className="text-[10px] text-muted-foreground mt-3">
              Join the elite of the platform with Pro Version
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
