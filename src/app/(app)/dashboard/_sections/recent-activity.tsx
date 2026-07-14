import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getRecentActivity } from "@/lib/data-access";
import { formatRelativeTime, activityIcons } from "./shared";
import type { SectionProps } from "./shared";

export default async function RecentActivity({ organizationId, role }: SectionProps) {
  const scopedActivity = await getRecentActivity(organizationId, role);

  if (scopedActivity.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm bg-white border border-health/10 rounded-2xl h-full transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:border-health/20">
      <CardContent className="p-[18px]">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Recent Activity</h3>
        <div className="relative flex flex-col">
          <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-border" />
          {scopedActivity.slice(0, 4).map((event) => {
            const Icon = activityIcons[event.type] ?? ClipboardList;
            return (
              <div key={event.id} className="group relative flex items-start gap-3 pb-4 last:pb-0 cursor-pointer">
                <span className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-health/10 text-health ring-2 ring-background transition-all duration-200 group-hover:bg-health/20 group-hover:scale-110 group-hover:ring-health/20">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1 pt-1 transition-colors duration-200 group-hover:text-foreground">
                  <p className="text-sm font-medium text-foreground leading-none">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    {event.patientName} &middot; {formatRelativeTime(event.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
