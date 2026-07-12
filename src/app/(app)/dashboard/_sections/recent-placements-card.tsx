"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Placement {
  id: string;
  patientName: string;
  facility: string;
  status: "completed" | "pending" | "cancelled";
  date: string;
}

const placements: Placement[] = [
  { id: "1", patientName: "Sarah Johnson", facility: "Sunrise Care", status: "completed", date: "2h ago" },
  { id: "2", patientName: "Michael Chen", facility: "Valley Health", status: "pending", date: "4h ago" },
  { id: "3", patientName: "Emma Davis", facility: "Sunrise Care", status: "completed", date: "6h ago" },
  { id: "4", patientName: "James Wilson", facility: "Metro Hospital", status: "cancelled", date: "1d ago" },
];

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-health", bg: "bg-health/10" },
  pending: { icon: Clock, color: "text-warmth", bg: "bg-warmth/10" },
  cancelled: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted" },
};

export default function RecentPlacementsCard() {
  return (
    <Card className="group shadow-sm card-glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-health/5 hover:scale-[1.02]">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Recent Placements</h3>
          <Link href="/placements" className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
        <div className="space-y-1.5">
          {placements.map((placement) => {
            const status = statusConfig[placement.status];
            const StatusIcon = status.icon;
            return (
              <div key={placement.id} className="group/item flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-all duration-200 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 transition-all duration-200 group-hover/item:scale-110 group-hover/item:bg-muted">
                  <span className="text-[10px] font-medium text-foreground">
                    {placement.patientName.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate transition-colors duration-200 group-hover/item:text-foreground/80">{placement.patientName}</p>
                  <p className="text-[10px] text-muted-foreground">{placement.facility}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`p-1 rounded-lg ${status.bg}`}>
                    <StatusIcon className={`w-3 h-3 ${status.color}`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{placement.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
