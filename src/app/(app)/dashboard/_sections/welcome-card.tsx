"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { Star, TrendingUp } from "lucide-react";

export default function WelcomeCard() {
  const { user } = useUser();

  return (
    <Card className="shadow-sm rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white overflow-hidden relative h-full min-h-[400px]">
      <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white/70">Pro Version</span>
            <button className="text-white/50 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="relative w-32 h-32 mx-auto my-8">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-blue-500/30 rounded-2xl rotate-12" />
            <div className="absolute inset-2 bg-gradient-to-br from-purple-500/40 to-blue-600/40 rounded-2xl rotate-6" />
            <div className="absolute inset-4 bg-gradient-to-br from-purple-600/50 to-blue-700/50 rounded-2xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Star className="w-12 h-12 text-white/80" fill="currentColor" />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Advantages</h3>
          <p className="text-sm text-white/60 mb-4">Your earnings with the pro version</p>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">
              <Star className="w-3 h-3" fill="currentColor" />
              15 Days
            </div>
          </div>
          <div className="relative h-16 mb-4">
            <svg viewBox="0 0 200 60" className="w-full h-full">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
                </linearGradient>
              </defs>
              <path
                d="M0 40 Q25 35 50 38 T100 30 T150 25 T200 20"
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
              />
              <circle cx="200" cy="20" r="3" fill="white" />
            </svg>
          </div>
          <button className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-all group">
            <span className="text-sm font-medium">Learn more</span>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 text-[#1a1a2e]" />
            </div>
          </button>
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-xs text-white/40">
          Join the elite of the care world with <span className="text-white/60 font-medium">Pro Version</span>
        </p>
      </div>
    </Card>
  );
}
