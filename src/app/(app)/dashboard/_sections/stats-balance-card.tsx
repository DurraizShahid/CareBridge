"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, DollarSign } from "lucide-react";

export default function StatsBalanceCard() {
  const [activeTab, setActiveTab] = useState<"dollar" | "tether">("dollar");
  
  const balance = 6010.29;
  const savings = 3205.00;
  const dollarPercentage = 72;
  const tetherPercentage = 28;

  return (
    <Card className="shadow-sm rounded-2xl h-full transition-all duration-300 hover:shadow-md">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Virtual cards</h3>
          <button className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all">
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">$</span>
            <span className="text-4xl font-light text-foreground">
              {balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-emerald-500 font-medium">
              +${savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Dollar</span>
              <span className="text-xs font-medium text-foreground">{dollarPercentage}%</span>
            </div>
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${dollarPercentage}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Tether</span>
              <span className="text-xs font-medium text-foreground">{tetherPercentage}%</span>
            </div>
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${tetherPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">**** 6802</span>
          </div>
          <span className="text-[10px] text-muted-foreground">09/28</span>
        </div>
      </CardContent>
    </Card>
  );
}
