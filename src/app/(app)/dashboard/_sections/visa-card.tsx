"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function VisaCard() {
  return (
    <Card className="rounded-2xl border-border/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white overflow-hidden relative h-full min-h-[200px] shadow-sm">
      <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold tracking-wider">VISA</span>
          <button className="text-white/50 hover:text-white transition-colors">
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
        
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-white/60">$</span>
            <span className="text-3xl font-light">390.00</span>
          </div>
        </div>
      </CardContent>
      <div className="absolute bottom-4 right-6 flex items-center gap-4 text-white/40 text-[10px]">
        <span>**** 6802</span>
        <span>09/28</span>
      </div>
    </Card>
  );
}
