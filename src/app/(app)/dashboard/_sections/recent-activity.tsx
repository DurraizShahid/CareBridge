import { ClipboardList } from "lucide-react";
import { getRecentActivity } from "@/lib/data-access";
import { formatRelativeTime, activityIcons } from "./shared";
import type { SectionProps } from "./shared";

export default async function RecentActivity({ organizationId, role }: SectionProps) {
  const scopedActivity = await getRecentActivity(organizationId, role);

  if (scopedActivity.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="h-0.5 w-4 shrink-0 rounded-full bg-health/60" />
        Recent Activity
      </h2>
      <div className="relative flex flex-col">
        <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-border" />
        {scopedActivity.slice(0, 4).map((event) => {
          const Icon = activityIcons[event.type] ?? ClipboardList;
          return (
            <div key={event.id} className="group relative flex items-start gap-4 pb-5 last:pb-0">
              <span className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-health/10 text-health ring-4 ring-background transition-colors group-hover:bg-health/20">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.description}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                  {event.patientName} &middot; {formatRelativeTime(event.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
