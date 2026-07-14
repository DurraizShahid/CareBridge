"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BankCardPanelProps {
  loading?: boolean;
  error?: boolean;
}

export function BankCardPanel({ loading, error }: BankCardPanelProps) {
  if (error) {
    return (
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl">
        <CardContent className="p-6 flex flex-col items-center justify-center h-40 text-center">
          <p className="text-sm text-muted-foreground">Data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl">
      <CardContent className="p-6 flex flex-col h-full">
        {loading ? (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-24" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-8">
              <span className="text-sm font-bold tracking-widest text-foreground/80">CLIENT</span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm text-muted-foreground">$</span>
                <span className="text-3xl font-light text-foreground tabular-nums">390.00</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-[10px] text-muted-foreground">•••• 6802</span>
              <span className="text-[10px] text-muted-foreground">09/28</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
