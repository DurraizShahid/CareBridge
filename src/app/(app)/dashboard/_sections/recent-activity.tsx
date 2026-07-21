import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentActivity } from "@/lib/data-access";
import { formatRelativeTime, activityIcons } from "./shared";
import type { SectionProps } from "./shared";

export default async function RecentActivity({ organizationId, role }: SectionProps) {
  const scopedActivity = await getRecentActivity(organizationId, role);

  if (scopedActivity.length === 0) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-muted-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative flex flex-col">
          <div className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px bg-border" />
          {scopedActivity.slice(0, 4).map((event) => {
            const Icon = activityIcons[event.type] ?? ClipboardList;
            return (
              <div key={event.id} className="group relative flex items-start gap-4 pb-5 last:pb-0 cursor-pointer">
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-health/10 text-health ring-2 ring-background transition-all duration-200 group-hover:bg-health/20 group-hover:scale-110 group-hover:ring-health/20">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 pt-1 transition-colors duration-200 group-hover:text-foreground">
                  <p className="text-base font-medium text-foreground leading-tight">{event.title}</p>
                  <p className="text-sm text-muted-foreground mt-1.5">{event.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
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
