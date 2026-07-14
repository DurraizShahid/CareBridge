"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Appointment {
  date: Date;
  time: string;
  title: string;
  type: "meeting" | "check-in" | "review" | "urgent";
}

const today = new Date(2026, 6, 14);

const dummyAppointments: Appointment[] = [
  { date: new Date(2026, 6, 14), time: "09:00", title: "Team Standup", type: "meeting" },
  { date: new Date(2026, 6, 14), time: "10:00", title: "Client Presentation", type: "urgent" },
  { date: new Date(2026, 6, 14), time: "11:30", title: "Sprint Planning", type: "meeting" },
  { date: new Date(2026, 6, 15), time: "09:30", title: "Quarterly Review", type: "review" },
  { date: new Date(2026, 6, 16), time: "08:00", title: "Wellness Check-in", type: "check-in" },
  { date: new Date(2026, 6, 16), time: "14:00", title: "Board Meeting", type: "urgent" },
  { date: new Date(2026, 6, 18), time: "10:00", title: "Patient Follow-up", type: "check-in" },
  { date: new Date(2026, 6, 18), time: "15:30", title: "Vendor Call", type: "meeting" },
  { date: new Date(2026, 6, 21), time: "11:00", title: "Strategy Session", type: "urgent" },
  { date: new Date(2026, 6, 22), time: "13:00", title: "Monthly Report", type: "review" },
  { date: new Date(2026, 6, 23), time: "09:00", title: "One-on-one", type: "meeting" },
  { date: new Date(2026, 6, 25), time: "10:30", title: "All Hands", type: "meeting" },
  { date: new Date(2026, 6, 28), time: "08:30", title: "Audit Prep", type: "urgent" },
];

const hours = Array.from({ length: 6 }, (_, i) => `${i + 7}:00`);

const typeColors: Record<Appointment["type"], { border: string; bg: string; label: string }> = {
  urgent: { border: "border-l-red-500", bg: "bg-red-50 dark:bg-red-950/20", label: "Urgent" },
  meeting: { border: "border-l-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", label: "Meeting" },
  review: { border: "border-l-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", label: "Review" },
  "check-in": { border: "border-l-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", label: "Check-in" },
};

function getAppointmentsForDate(date: Date) {
  return dummyAppointments.filter(
    (a) =>
      a.date.getFullYear() === date.getFullYear() &&
      a.date.getMonth() === date.getMonth() &&
      a.date.getDate() === date.getDate(),
  );
}

export function AppointmentsCard() {
  const todayAppointments = getAppointmentsForDate(today);

  const appointmentMap = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of todayAppointments) {
      const hour = apt.time.split(":")[0];
      const existing = map.get(hour) ?? [];
      existing.push(apt);
      map.set(hour, existing);
    }
    return map;
  }, []);

  return (
    <div className="border border-border/60 shadow-sm rounded-[28px] h-full flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[21px] font-semibold text-muted-foreground">Appointments</span>
          <span className="text-xs text-muted-foreground">
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      <div className="overflow-auto px-6 pb-5">
        <div className="relative">
          {hours.map((hour) => {
            const apts = appointmentMap.get(hour.split(":")[0]) ?? [];
            return (
              <div key={hour} className="flex gap-3 group">
                <div className="w-12 shrink-0 pt-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium">{hour}</span>
                </div>
                <div className="flex-1 min-h-[36px] border-t border-border/20 py-0.5">
                  {apts.length > 0 ? (
                    <div className="space-y-1">
                      {apts.map((apt, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg border-l-[3px] px-3 py-2",
                            typeColors[apt.type].border,
                            typeColors[apt.type].bg,
                          )}
                        >
                          <span className="text-[11px] font-medium text-muted-foreground min-w-[32px]">
                            {apt.time}
                          </span>
                          <span className="text-sm font-medium text-foreground">{apt.title}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {apt.type === "urgent" ? "!" : typeColors[apt.type].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full min-h-[20px]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 pb-5 pt-4 border-t border-border/30">
        {(["urgent", "meeting", "review", "check-in"] as const).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", typeColors[type].border.replace("border-l-", "bg-"))} />
            <span className="text-[10px] text-muted-foreground">{typeColors[type].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
