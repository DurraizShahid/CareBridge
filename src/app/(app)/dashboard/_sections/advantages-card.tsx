"use client";

import { Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdvantagesCardProps {
  loading?: boolean;
  error?: boolean;
}

export function AdvantagesCard({ error }: AdvantagesCardProps) {
  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
          <p className="text-sm text-[#8d8a98]">Performance data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold tracking-tight text-[#1e1d24]">Platform Performance</h3>
          <div className="flex items-center gap-1 bg-[#dff1e6] text-[#2a7a6a] px-2.5 py-0.5 rounded-full text-[10px] font-medium">
            <Sparkles className="size-3" />
            12 Days
          </div>
        </div>

        <p className="text-[13px] text-[#8d8a98] mb-5">Average time to place (vs 28d industry avg)</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl bg-[#f4f5fb] p-4">
            <p className="text-[30px] font-[500] tracking-[-0.03em] text-[#111014] tabular-nums">94%</p>
            <p className="text-[11px] text-[#8d8a98] mt-1">Placement success rate</p>
          </div>
          <div className="rounded-2xl bg-[#f4f5fb] p-4">
            <p className="text-[30px] font-[500] tracking-[-0.03em] text-[#111014] tabular-nums">72</p>
            <p className="text-[11px] text-[#8d8a98] mt-1">Partner facilities</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-[#dff1e6] p-3.5">
          <TrendingUp className="size-4 text-[#2a7a6a] shrink-0" />
          <span className="text-xs text-[#1a5347] font-medium">23% cost savings vs traditional placement</span>
        </div>
      </CardContent>
    </Card>
  );
}
