"use client";

import Link from "next/link";
import { ArrowRight, UserPlus, Building2, ClipboardCheck, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  patientName?: string;
  timestamp: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
}

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  placement_created: { icon: ClipboardCheck, color: "text-health", bg: "bg-health/10" },
  placement_completed: { icon: ClipboardCheck, color: "text-primary", bg: "bg-primary/10" },
  patient_admitted: { icon: UserPlus, color: "text-health", bg: "bg-health/10" },
  facility_updated: { icon: Building2, color: "text-warmth", bg: "bg-warmth/10" },
  referral_received: { icon: FileText, color: "text-warmth", bg: "bg-warmth/10" },
  default: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/50" },
};

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card className="group shadow-sm card-glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-health/5 hover:scale-[1.02]">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Recent Activity</h3>
          <Link href="/dashboard" className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        <div className="flex flex-col gap-1">
          {activities.slice(0, 5).map((activity) => {
            const config = typeConfig[activity.type] ?? typeConfig.default;
            const Icon = config.icon;

            return (
              <div key={activity.id} className="group/item flex items-start gap-3 p-2 rounded-xl hover:bg-muted/30 transition-all duration-200 cursor-pointer">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg} transition-all duration-200 group-hover/item:scale-110`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{activity.title}</p>
                  {activity.patientName && (
                    <p className="text-[10px] text-muted-foreground truncate">{activity.patientName}</p>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5">{timeAgo(activity.timestamp)}</span>
              </div>
            );
          })}

          {activities.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
