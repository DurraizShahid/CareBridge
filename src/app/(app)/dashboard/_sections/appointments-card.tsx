"use client";

import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { ChevronDown, Clock, MapPin, User, CalendarDays } from "lucide-react";

interface Appointment {
  date: Date;
  time: string;
  subject: string;
  details: string;
  location: string;
  participants: string;
  duration: string;
  type: "meeting" | "check-in" | "review" | "urgent";
}

const today = new Date(2026, 6, 14);

const dummyAppointments: Appointment[] = [
  // Tue Jul 14
  { date: new Date(2026, 6, 14), time: "7:00 AM", subject: "Bed availability check", details: "Northside Nursing has 3 skilled-nursing beds opening this week. Confirm readiness for new placements.", location: "Northside Nursing Facility", participants: "J. Martinez (Coordinator)", duration: "30m", type: "check-in" },
  { date: new Date(2026, 6, 14), time: "8:30 AM", subject: "Family consult: Rivera", details: "Discuss placement options for M. Rivera. Family prefers Skilled Nursing near downtown. Review financial options.", location: "Virtual — Zoom", participants: "Rivera family, Dr. Kim", duration: "45m", type: "meeting" },
  { date: new Date(2026, 6, 14), time: "9:45 AM", subject: "Facility walkthrough", details: "Tour new memory care wing at Greenfield Care. Evaluate for Alzheimer's/dementia patient placement.", location: "Greenfield Care Center", participants: "A. Patel (Director)", duration: "1h", type: "urgent" },
  { date: new Date(2026, 6, 14), time: "10:30 AM", subject: "Care plan review", details: "Elmira Watson — reassess care level. Recent decline may require upgrade from Assisted Living to Skilled Nursing.", location: "Conference Room B", participants: "Elmira Watson, Dr. Reyes", duration: "30m", type: "review" },
  { date: new Date(2026, 6, 14), time: "11:15 AM", subject: "Discharge coordination", details: "St. Mary's Hospital discharging patient to Sunnyvale Care. Coordinate transport, records transfer, and intake.", location: "St. Mary's Hospital", participants: "Nurse Thompson, S. Lee", duration: "45m", type: "meeting" },
  { date: new Date(2026, 6, 14), time: "1:00 PM", subject: "New referral intake", details: "Memorial Hospital referring patient requiring Alzheimer's care. Review medical records and begin facility matching.", location: "Memorial Hospital", participants: "Dr. A. Cohen", duration: "1h", type: "meeting" },
  { date: new Date(2026, 6, 14), time: "2:00 PM", subject: "Insurance pre-auth follow-up", details: "Verify approval for Northside placement. Follow up on pending pre-authorization requests.", location: "Desk — Phone", participants: "Insurance adjuster", duration: "20m", type: "check-in" },
  { date: new Date(2026, 6, 14), time: "3:00 PM", subject: "Weekly referral triage", details: "Review all open referrals. Prioritize by urgency, care level match, and family readiness.", location: "Main Office", participants: "Placement team", duration: "1h", type: "review" },
  // Wed Jul 15
  { date: new Date(2026, 6, 15), time: "9:30 AM", subject: "Quarterly facility review", details: "Greenfield Care compliance check. Review occupancy, incident reports, and staffing ratios.", location: "Greenfield Care Center", participants: "Quality team", duration: "1.5h", type: "review" },
  { date: new Date(2026, 6, 15), time: "11:00 AM", subject: "New referral intake", details: "General Hospital post-surgery patient needing short-term rehab placement. Estimated 4-6 week stay.", location: "General Hospital", participants: "Dr. L. Park", duration: "45m", type: "meeting" },
  { date: new Date(2026, 6, 15), time: "1:30 PM", subject: "Family consult: Chen", details: "Discuss memory care options for L. Chen. Compare Greenfield vs Sunnyvale programs.", location: "Virtual — Zoom", participants: "Chen family, Social Worker", duration: "45m", type: "meeting" },
  // Thu Jul 16
  { date: new Date(2026, 6, 16), time: "8:00 AM", subject: "Wellness check-in", details: "Follow up on Rivera placement at Northside. Check satisfaction, address concerns.", location: "Northside Nursing — Room 214", participants: "M. Rivera", duration: "30m", type: "check-in" },
  { date: new Date(2026, 6, 16), time: "10:00 AM", subject: "Bed availability update", details: "Urgent capacity report. All facilities to submit current bed counts for emergency placement planning.", location: "Virtual — Teams", participants: "All facility coordinators", duration: "1h", type: "urgent" },
  { date: new Date(2026, 6, 16), time: "2:00 PM", subject: "Insurance auth review", details: "Review and approve pending pre-authorization requests for next week's planned placements.", location: "Desk", participants: "Billing team", duration: "1h", type: "review" },
  // Fri Jul 17
  { date: new Date(2026, 6, 17), time: "9:00 AM", subject: "Placement finalization", details: "Complete Rivera paperwork and submit contract to Northside Nursing. Finalize start date.", location: "Main Office", participants: "Legal, Billing", duration: "1h", type: "meeting" },
  { date: new Date(2026, 6, 17), time: "11:00 AM", subject: "Facility billing review", details: "Reconcile monthly invoices from all partner facilities. Flag discrepancies.", location: "Conference Room A", participants: "Finance team", duration: "45m", type: "review" },
  { date: new Date(2026, 6, 17), time: "2:00 PM", subject: "New referral intake", details: "County Hospital referring two patients — one post-stroke rehab, one Alzheimer's placement.", location: "County Hospital", participants: "Dr. M. Torres", duration: "1h", type: "meeting" },
  // Sat Jul 18
  { date: new Date(2026, 6, 18), time: "10:00 AM", subject: "Patient follow-up", details: "M. Rivera 30-day check-in at Northside Nursing. Assess adjustment and care quality.", location: "Northside Nursing — Room 214", participants: "M. Rivera, Nurse Jones", duration: "30m", type: "check-in" },
  // Mon Jul 20
  { date: new Date(2026, 6, 20), time: "9:00 AM", subject: "Weekly placement meeting", details: "Team standup. Review weekly targets, discuss bottlenecks, assign new referrals.", location: "Conference Room B", participants: "Placement team", duration: "1h", type: "meeting" },
  { date: new Date(2026, 6, 20), time: "10:30 AM", subject: "New referral: Watson", details: "Elmira Watson approved for placement. Begin facility matching — priority Skilled Nursing.", location: "Desk", participants: "Intake coordinator", duration: "30m", type: "urgent" },
  // Tue Jul 21
  { date: new Date(2026, 6, 21), time: "9:00 AM", subject: "Facility tour", details: "Evaluate Sunnyvale Care Center for partnership. Assess capacity, care quality, and pricing.", location: "Sunnyvale Care Center", participants: "Operations team", duration: "2h", type: "meeting" },
  { date: new Date(2026, 6, 21), time: "2:00 PM", subject: "Care plan compliance", details: "Quarterly audit of care plan documentation. Ensure all active placements have updated plans.", location: "Main Office", participants: "Compliance officer", duration: "1.5h", type: "review" },
];

type ViewMode = "weekly" | "monthly";

const typeColors: Record<Appointment["type"], { dot: string; bg: string; label: string; border: string }> = {
  urgent: { dot: "bg-red-500", bg: "bg-red-50 dark:bg-red-950/20", label: "Urgent", border: "border-l-red-500" },
  meeting: { dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", label: "Meeting", border: "border-l-blue-500" },
  review: { dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", label: "Review", border: "border-l-amber-500" },
  "check-in": { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", label: "Check-in", border: "border-l-emerald-500" },
};

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function AppointmentsCard() {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const weekStart = useMemo(() => getMonday(today), []);
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
  [weekStart]);

  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), []);
  const monthEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), []);
  const monthDays = useMemo(() => {
    const start = new Date(monthStart);
    const pad = start.getDay();
    const days: (Date | null)[] = Array(pad).fill(null);
    for (let i = 1; i <= monthEnd.getDate(); i++) {
      days.push(new Date(today.getFullYear(), today.getMonth(), i));
    }
    return days;
  }, [monthStart, monthEnd]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of dummyAppointments) {
      const key = apt.date.toDateString();
      const existing = map.get(key) ?? [];
      existing.push(apt);
      map.set(key, existing);
    }
    return map;
  }, []);

  const selectedDayAppointments = selectedDay
    ? appointmentsByDay.get(selectedDay.toDateString()) ?? []
    : [];

  const eventCount = dummyAppointments.filter((a) => isSameDay(a.date, today)).length;

  return (
    <div className="border border-border/60 shadow-sm rounded-[28px] h-full flex flex-col bg-card/70 backdrop-blur-xl font-body">
      <div className="px-6 pt-12 pb-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold tracking-widest text-foreground/80 uppercase">Facility Calendar</span>
          <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("weekly")}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-md transition-colors",
                viewMode === "weekly" ? "bg-background text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-md transition-colors",
                viewMode === "monthly" ? "bg-background text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Monthly
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mb-4">
          <CalendarDays className="size-3 inline mr-1" />
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} &middot; {eventCount} events today
        </p>
      </div>

      <div className="overflow-auto px-6 pb-5 flex-1">
        {viewMode === "weekly" ? (
          <>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map((day, i) => {
                const key = day.toDateString();
                const dayApts = appointmentsByDay.get(key) ?? [];
                const isToday = isSameDay(day, today);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(selectedDay && isSameDay(selectedDay, day) ? null : day)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-colors",
                      isToday && "bg-primary/10",
                      selectedDay && isSameDay(selectedDay, day) && "ring-2 ring-primary/30",
                      "hover:bg-muted/60",
                    )}
                  >
                    <span className="text-[9px] text-muted-foreground uppercase font-medium">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className={cn(
                      "text-sm font-semibold leading-none",
                      isToday ? "text-primary" : "text-foreground",
                    )}>
                      {day.getDate()}
                    </span>
                    {dayApts.length > 0 && (
                      <span className={cn(
                        "text-[8px] font-medium px-1.5 py-0.5 rounded-full leading-none mt-0.5",
                        isToday ? "bg-primary/15 text-primary" : "bg-muted-foreground/10 text-muted-foreground",
                      )}>
                        {dayApts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              {selectedDay ? (
                selectedDayAppointments.length > 0 ? (
                  selectedDayAppointments.map((apt, i) => {
                    const isOpen = expandedId === i;
                    return (
                      <div key={i} className={cn("rounded-xl border-l-[3px] overflow-hidden transition-all", typeColors[apt.type].border)}>
                        <button
                          onClick={() => setExpandedId(isOpen ? null : i)}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={cn("size-2 rounded-full shrink-0", typeColors[apt.type].dot)} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{apt.subject}</p>
                              <p className="text-[10px] text-muted-foreground mt-px">{apt.time}</p>
                            </div>
                          </div>
                          <ChevronDown className={cn(
                            "size-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
                            isOpen && "rotate-180",
                          )} />
                        </button>
                        <div className={cn(
                          "grid transition-all duration-200",
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}>
                          <div className="overflow-hidden">
                            <div className="px-3.5 pb-3 pt-0 space-y-2 border-t border-border/20">
                              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2">{apt.details}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3" /> {apt.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="size-3" /> {apt.participants}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" /> {apt.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
                    <CalendarDays className="size-8 mb-2 opacity-30" />
                    No appointments on this day
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
                  <CalendarDays className="size-8 mb-2 opacity-30" />
                  Select a day to view appointments
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground">
                {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-px mb-4">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-[9px] text-muted-foreground text-center py-1 uppercase font-medium">
                  {d}
                </div>
              ))}
              {monthDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const key = day.toDateString();
                const dayApts = appointmentsByDay.get(key) ?? [];
                const isToday = isSameDay(day, today);
                const isSelected = selectedDay && isSameDay(selectedDay, day);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-xs transition-colors relative",
                      isToday && "bg-primary/10 font-semibold text-primary",
                      isSelected && "ring-2 ring-primary/30",
                      "hover:bg-muted/60",
                    )}
                  >
                    <span>{day.getDate()}</span>
                    {dayApts.length > 0 && (
                      <span className={cn(
                        "text-[8px] font-medium",
                        isToday ? "text-primary" : "text-muted-foreground",
                      )}>
                        {dayApts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              {selectedDay ? (
                selectedDayAppointments.length > 0 ? (
                  selectedDayAppointments.map((apt, i) => {
                    const isOpen = expandedId === i;
                    return (
                      <div key={i} className={cn("rounded-xl border-l-[3px] overflow-hidden transition-all", typeColors[apt.type].border)}>
                        <button
                          onClick={() => setExpandedId(isOpen ? null : i)}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={cn("size-2 rounded-full shrink-0", typeColors[apt.type].dot)} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{apt.subject}</p>
                              <p className="text-[10px] text-muted-foreground mt-px">{apt.time}</p>
                            </div>
                          </div>
                          <ChevronDown className={cn(
                            "size-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
                            isOpen && "rotate-180",
                          )} />
                        </button>
                        <div className={cn(
                          "grid transition-all duration-200",
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}>
                          <div className="overflow-hidden">
                            <div className="px-3.5 pb-3 pt-0 space-y-2 border-t border-border/20">
                              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2">{apt.details}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3" /> {apt.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="size-3" /> {apt.participants}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" /> {apt.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                    <CalendarDays className="size-8 mb-2 opacity-30" />
                    No appointments on this day
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                  <CalendarDays className="size-8 mb-2 opacity-30" />
                  Select a day to view appointments
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 px-6 pb-6 pt-3 border-t border-border/30">
        {(["urgent", "meeting", "review", "check-in"] as const).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", typeColors[type].dot)} />
            <span className="text-[10px] text-muted-foreground">{typeColors[type].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
