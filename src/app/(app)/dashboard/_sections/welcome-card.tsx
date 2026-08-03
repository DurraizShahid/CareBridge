"use client";

import { useUser } from "@clerk/nextjs";
import { Sparkles, TrendingUp, ArrowUpRight } from "lucide-react";

export default function WelcomeCard() {
  const { user } = useUser();

  return (
    <div className="dash-card-tint p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-white flex items-center justify-center">
            <Sparkles className="size-4 text-[#6c7a9a]" />
          </div>
          <span className="text-sm font-semibold text-[#1e1d24]">CareBridge Pro</span>
        </div>
        <button className="size-8 rounded-full bg-white flex items-center justify-center hover:bg-[#f3f1f8] transition-colors">
          <ArrowUpRight className="size-4 text-[#8d8a98]" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 text-xs text-[#8d8a98]">
          <span className="size-2 rounded-full bg-[#e1f26a]" />
          15 Days Pro
        </div>
        <span className="text-[13px] text-[#8d8a98]">Active trial</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-[42px] font-[500] tracking-[-0.03em] text-[#111014] leading-none">94%</span>
        <span className="text-[13px] text-[#8d8a98]">match accuracy</span>
      </div>

      <div className="relative h-16">
        <svg viewBox="0 0 300 60" className="w-full h-full">
          <defs>
            <linearGradient id="proLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e9edf8" />
              <stop offset="100%" stopColor="#6c7a9a" />
            </linearGradient>
          </defs>
          <path d="M0 45 Q50 40 100 42 T200 30 T250 22 T300 18" fill="none" stroke="url(#proLine)" strokeWidth="2" />
          <circle cx="300" cy="18" r="4" fill="#6c7a9a" />
        </svg>
      </div>

      <button className="flex items-center justify-between bg-white rounded-full px-5 py-3 transition-all hover:shadow-sm active:scale-[0.98]">
        <span className="text-sm font-medium text-[#1e1d24]">Unlock premium features</span>
        <div className="size-7 rounded-full bg-[#15141b] flex items-center justify-center">
          <TrendingUp className="size-3.5 text-white" />
        </div>
      </button>
    </div>
  );
}
