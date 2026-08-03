"use client";

import { TrendingUp, ArrowUpRight, Sparkles } from "lucide-react";

export function TotalSpentCard() {
  return (
    <div className="dash-card-mint p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-white/60 flex items-center justify-center">
            <Sparkles className="size-4 text-[#2a7a6a]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1e1d24]">Priority Placements</h3>
        </div>
        <button className="size-8 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors">
          <ArrowUpRight className="size-4 text-[#8d8a98]" />
        </button>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-[42px] font-[500] tracking-[-0.03em] text-[#111014] leading-none">24</span>
        <span className="text-[13px] text-[#8d8a98]">active priority</span>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-white/50 px-4 py-2.5 text-xs text-[#1e1d24]">
        <TrendingUp className="size-4 text-[#2a7a6a]" />
        <span className="font-medium">12 urgent placements this week</span>
      </div>

      <div className="flex gap-3 mt-1">
        {["ICU", "Memory", "Rehab"].map((tag) => (
          <span key={tag} className="text-[11px] px-3 py-1 rounded-full bg-white/60 text-[#6c6a78]">{tag}</span>
        ))}
      </div>
    </div>
  );
}
