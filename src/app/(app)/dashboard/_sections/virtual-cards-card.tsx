"use client";

import { WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface VirtualCardsCardProps {
  loading?: boolean;
  error?: boolean;
}

export function VirtualCardsCard({ loading, error }: VirtualCardsCardProps) {
  if (error) {
    return (
      <Card className="rounded-[28px] border-border/60 shadow-sm h-full bg-card/70 backdrop-blur-xl">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Balance data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border-border/60 shadow-sm h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[21px] font-semibold text-muted-foreground">Virtual Cards</h3>
          <button aria-label="Card menu" className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
            <WalletCards className="size-4 text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-3/4" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-0.5">Total Balance</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm text-muted-foreground">$</span>
                <span className="text-[34px] font-light text-foreground tabular-nums leading-none">
                  6,010.29
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-emerald-500 font-medium">↑ $320.00</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Available</span>
                  <span className="text-xs font-medium text-foreground">72%</span>
                </div>
                <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Pending</span>
                  <span className="text-xs font-medium text-foreground">28%</span>
                </div>
                <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: "28%" }} />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
