"use client";

import { cn } from "@/lib/utils";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  Clock,
  MapPin,
  User,
  CalendarDays,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isToday,
} from "date-fns";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";

const TEAL = "#277979";
const DARK_TEXT = "#155F60";

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
  { date: new Date(2026, 6, 14), time: "7:00 AM", subject: "Bed availability check", details: "Northside Nursing has 3 skilled-nursing beds opening this week. Confirm readiness for new placements.", location: "Northside Nursing Facility", participants: "J. Martinez (Coordinator)", duration: "30m", type: "check-in" },
  { date: new Date(2026, 6, 14), time: "8:30 AM", subject: "Family consult: Rivera", details: "Discuss placement options for M. Rivera. Family prefers Skilled Nursing near downtown. Review financial options.", location: "Virtual — Zoom", participants: "Rivera family, Dr. Kim", duration: "45m", type: "meeting" },
  { date: new Date(2026, 6, 14), time: "9:45 AM", subject: "Facility walkthrough", details: "Tour new memory care wing at Greenfield Care. Evaluate for Alzheimer's/dementia patient placement.", location: "Greenfield Care Center", participants: "A. Patel (Director)", duration: "1h", type: "urgent" },
  { date: new Date(2026, 6, 14), time: "10:30 AM", subject: "Care plan review", details: "Elmira Watson — reassess care level. Recent decline may require upgrade from Assisted Living to Skilled Nursing.", location: "Conference Room B", participants: "Elmira Watson, Dr. Reyes", duration: "30m", type: "review" },
  { date: new Date(2026, 6, 14), time: "11:15 AM", subject: "Discharge coordination", details: "St. Mary's Hospital discharging patient to Sunnyvale Care. Coordinate transport, records transfer, and intake.", location: "St. Mary's Hospital", participants: "Nurse Thompson, S. Lee", duration: "45m", type: "meeting" },
  { date: new Date(2026, 6, 14), time: "1:00 PM", subject: "New referral intake", details: "Memorial Hospital referring patient requiring Alzheimer's care. Review medical records and begin facility matching.", location: "Memorial Hospital", participants: "Dr. A. Cohen", duration: "1h", type: "meeting" },
  { date: new Date(2026, 6, 14), time: "2:00 PM", subject: "Insurance pre-auth follow-up", details: "Verify approval for Northside placement. Follow up on pending pre-authorization requests.", location: "Desk — Phone", participants: "Insurance adjuster", duration: "20m", type: "check-in" },
  { date: new Date(2026, 6, 14), time: "3:00 PM", subject: "Weekly referral triage", details: "Review all open referrals. Prioritize by urgency, care level match, and family readiness.", location: "Main Office", participants: "Placement team", duration: "1h", type: "review" },
  { date: new Date(2026, 6, 15), time: "9:30 AM", subject: "Quarterly facility review", details: "Greenfield Care compliance check. Review occupancy, incident reports, and staffing ratios.", location: "Greenfield Care Center", participants: "Quality team", duration: "1.5h", type: "review" },
  { date: new Date(2026, 6, 15), time: "11:00 AM", subject: "New referral intake", details: "General Hospital post-surgery patient needing short-term rehab placement. Estimated 4-6 week stay.", location: "General Hospital", participants: "Dr. L. Park", duration: "45m", type: "meeting" },
  { date: new Date(2026, 6, 15), time: "1:30 PM", subject: "Family consult: Chen", details: "Discuss memory care options for L. Chen. Compare Greenfield vs Sunnyvale programs.", location: "Virtual — Zoom", participants: "Chen family, Social Worker", duration: "45m", type: "meeting" },
  { date: new Date(2026, 6, 16), time: "8:00 AM", subject: "Wellness check-in", details: "Follow up on Rivera placement at Northside. Check satisfaction, address concerns.", location: "Northside Nursing — Room 214", participants: "M. Rivera", duration: "30m", type: "check-in" },
  { date: new Date(2026, 6, 16), time: "10:00 AM", subject: "Bed availability update", details: "Urgent capacity report. All facilities to submit current bed counts for emergency placement planning.", location: "Virtual — Teams", participants: "All facility coordinators", duration: "1h", type: "urgent" },
  { date: new Date(2026, 6, 16), time: "2:00 PM", subject: "Insurance auth review", details: "Review and approve pending pre-authorization requests for next week's planned placements.", location: "Desk", participants: "Billing team", duration: "1h", type: "review" },
  { date: new Date(2026, 6, 17), time: "9:00 AM", subject: "Placement finalization", details: "Complete Rivera paperwork and submit contract to Northside Nursing. Finalize start date.", location: "Main Office", participants: "Legal, Billing", duration: "1h", type: "meeting" },
  { date: new Date(2026, 6, 17), time: "11:00 AM", subject: "Facility billing review", details: "Reconcile monthly invoices from all partner facilities. Flag discrepancies.", location: "Conference Room A", participants: "Finance team", duration: "45m", type: "review" },
  { date: new Date(2026, 6, 17), time: "2:00 PM", subject: "New referral intake", details: "County Hospital referring two patients — one post-stroke rehab, one Alzheimer's placement.", location: "County Hospital", participants: "Dr. M. Torres", duration: "1h", type: "meeting" },
  { date: new Date(2026, 6, 18), time: "10:00 AM", subject: "Patient follow-up", details: "M. Rivera 30-day check-in at Northside Nursing. Assess adjustment and care quality.", location: "Northside Nursing — Room 214", participants: "M. Rivera, Nurse Jones", duration: "30m", type: "check-in" },
  { date: new Date(2026, 6, 20), time: "9:00 AM", subject: "Weekly placement meeting", details: "Team standup. Review weekly targets, discuss bottlenecks, assign new referrals.", location: "Conference Room B", participants: "Placement team", duration: "1h", type: "meeting" },
  { date: new Date(2026, 6, 20), time: "10:30 AM", subject: "New referral: Watson", details: "Elmira Watson approved for placement. Begin facility matching — priority Skilled Nursing.", location: "Desk", participants: "Intake coordinator", duration: "30m", type: "urgent" },
  { date: new Date(2026, 6, 21), time: "9:00 AM", subject: "Facility tour", details: "Evaluate Sunnyvale Care Center for partnership. Assess capacity, care quality, and pricing.", location: "Sunnyvale Care Center", participants: "Operations team", duration: "2h", type: "meeting" },
  { date: new Date(2026, 6, 21), time: "2:00 PM", subject: "Care plan compliance", details: "Quarterly audit of care plan documentation. Ensure all active placements have updated plans.", location: "Main Office", participants: "Compliance officer", duration: "1.5h", type: "review" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 7);
const START_HOUR = 7;
const TOTAL_HOURS = 10;

function timeToSlot(date: Date): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return ((hours - START_HOUR) * 60 + minutes) / 15;
}

function MeetingParticipantsList({ participants }: { participants?: string | string[] }) {
  if (!participants || (Array.isArray(participants) && participants.length === 0)) return null;

  const names = typeof participants === "string"
    ? participants.split(",").map((p) => p.trim()).filter(Boolean)
    : participants;

  const visible = names.slice(0, 3);
  const remaining = names.length - 3;

  if (names.length === 0) return null;

  return (
    <AvatarGroup className="mt-2">
      {visible.map((name, i) => (
        <Avatar key={i} size="sm" className="ring-2 ring-[#277979]">
          <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <AvatarGroupCount className="text-[10px]">+{remaining}</AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}

function MeetingCard({
  appointment,
  isActive,
  isExpanded,
  onToggle,
}: {
  appointment: Appointment;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className={cn(
          "rounded-2xl overflow-hidden transition-all duration-200",
          isActive ? "shadow-lg" : "shadow-sm",
        )}
        style={
          isActive
            ? { backgroundColor: TEAL, boxShadow: "0 4px 20px rgba(39,121,121,0.25)" }
            : { backgroundColor: "#FFFFFF", boxShadow: "0 2px 12px rgba(39,121,121,0.08)" }
        }
      >
        <CollapsibleTrigger
          className="w-full text-left"
          aria-label={isExpanded ? "Collapse meeting details" : "Expand meeting details"}
        >
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className={cn("text-[15px] font-medium leading-snug", isActive && "text-white")}
                  style={!isActive ? { color: DARK_TEXT } : undefined}
                >
                  {appointment.subject}
                </p>
                <p
                  className={cn("text-[13px] mt-0.5", isActive && "text-white/75")}
                  style={!isActive ? { color: "rgba(39,121,121,0.6)" } : undefined}
                >
                  {appointment.time}
                </p>
                {!isActive && <MeetingParticipantsList participants={appointment.participants} />}
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.6)" : TEAL }}
                />
                {isExpanded ? (
                  <ChevronUpIcon
                    className="size-4"
                    style={{ color: isActive ? "#FFFFFF" : TEAL }}
                  />
                ) : (
                  <ChevronDownIcon
                    className="size-4"
                    style={{ color: isActive ? "#FFFFFF" : TEAL }}
                  />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div
            className={cn(
              "px-4 pb-4 pt-0 space-y-2.5 border-t",
              isActive ? "border-white/20" : "",
            )}
            style={!isActive ? { borderColor: "rgba(204,215,211,0.5)" } : undefined}
          >
            <p
              className={cn("text-xs leading-relaxed pt-2.5", isActive && "text-white/85")}
              style={!isActive ? { color: DARK_TEXT } : undefined}
            >
              {appointment.details}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: "rgba(39,121,121,0.6)" }}>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                {appointment.location}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="size-3.5 shrink-0" />
                {appointment.participants}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {appointment.duration}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function TimelineLine({ activeSlots }: { activeSlots: Set<number> }) {
  return (
    <div className="relative flex flex-col" style={{ width: "80px" }}>
      {HOURS.map((hour, idx) => {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const label = `${String(displayHour).padStart(2, "0")}:00`;
        const isActive = activeSlots.has(idx);
        return (
          <div key={hour} className="relative flex items-center" style={{ height: "60px" }}>
            <div
              className="flex items-center justify-center rounded-full text-xs font-medium shrink-0 transition-all duration-200"
              style={{
                width: "64px",
                height: "34px",
                backgroundColor: isActive ? TEAL : "transparent",
                border: isActive ? "none" : `1.5px solid rgba(39,121,121,0.45)`,
                color: isActive ? "#FFFFFF" : DARK_TEXT,
                boxShadow: isActive ? "0 2px 8px rgba(39,121,121,0.18)" : undefined,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
      {/* Dashed line */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          left: "68px",
          width: "0",
          borderLeft: `1.5px dashed rgba(39,121,121,0.35)`,
        }}
      />
      {/* Dots at each time position */}
      {HOURS.map((hour, idx) => {
        const isActive = activeSlots.has(idx);
        return (
          <div
            key={hour}
            className="absolute rounded-full"
            style={{
              width: "6px",
              height: "6px",
              backgroundColor: TEAL,
              opacity: isActive ? 0.9 : 0.35,
              top: `${idx * 60 + 27}px`,
              left: "65px",
            }}
          />
        );
      })}
    </div>
  );
}

function CurrentTimeMarker() {
  const now = new Date();
  const slotTop = timeToSlot(now);
  const topPx = (slotTop / TOTAL_HOURS) * (TOTAL_HOURS * 60);
  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-none"
      style={{ top: `${topPx}px`, zIndex: 10 }}
    >
      <div
        className="relative"
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: TEAL,
          boxShadow: "0 0 0 4px rgba(39,121,121,0.2)",
          marginLeft: "-4px",
        }}
      />
      <div
        className="h-px flex-1"
        style={{ backgroundColor: TEAL, opacity: 0.5 }}
      />
    </div>
  );
}

function TimelineScrollButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center py-3">
      <button
        onClick={onClick}
        aria-label="View later schedule times"
        className="flex items-center justify-center rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95"
        style={{
          width: "36px",
          height: "36px",
          backgroundColor: TEAL,
        }}
      >
        <ChevronDownIcon className="size-4 text-white" />
      </button>
    </div>
  );
}

function FacilityCalendarSkeleton() {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#CCD7D3" }}>
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-28 animate-pulse rounded-lg" style={{ backgroundColor: "#FFFFFF" }} />
          <div className="size-12 animate-pulse rounded-full" style={{ backgroundColor: "#FFFFFF" }} />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1.5 animate-pulse" style={{ minWidth: "48px" }}>
              <div className="h-3 w-8 rounded" style={{ backgroundColor: "#FFFFFF" }} />
              <div className="h-6 w-6 rounded" style={{ backgroundColor: "#FFFFFF" }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="flex gap-4 h-full">
          <div className="flex flex-col gap-3 animate-pulse" style={{ width: "80px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-5 w-14 rounded-full" style={{ backgroundColor: "#FFFFFF" }} />
            ))}
          </div>
          <div className="flex-1 space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: "#FFFFFF" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FacilityCalendarEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
      <CalendarDays className="size-10" style={{ color: "rgba(39,121,121,0.35)" }} />
      <p className="text-sm font-medium" style={{ color: DARK_TEXT }}>No meetings scheduled</p>
      <p className="text-xs" style={{ color: "rgba(39,121,121,0.45)" }}>
        Select a different date or create a new meeting
      </p>
    </div>
  );
}

function FacilityCalendarErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
      <CalendarDays className="size-10" style={{ color: "rgba(39,121,121,0.35)" }} />
      <p className="text-sm font-medium" style={{ color: DARK_TEXT }}>Failed to load calendar</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium underline underline-offset-2 hover:no-underline"
          style={{ color: TEAL }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function AppointmentsCard() {
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [expandedMeetingId, setExpandedMeetingId] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const dateStripRef = useRef<HTMLDivElement>(null);
  const scheduleBodyRef = useRef<HTMLDivElement>(null);
  const selectedDateBtnRef = useRef<HTMLButtonElement>(null);

  const dates = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 0 });
    return Array.from({ length: 28 }, (_, i) => addDays(start, i));
  }, []);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of dummyAppointments) {
      const key = format(apt.date, "yyyy-MM-dd");
      const existing = map.get(key) ?? [];
      existing.push(apt);
      map.set(key, existing);
    }
    return map;
  }, []);

  const selectedDayAppointments = useMemo(() => {
    const key = format(selectedDay, "yyyy-MM-dd");
    return appointmentsByDay.get(key) ?? [];
  }, [selectedDay, appointmentsByDay]);

  const activeSlots = useMemo(() => {
    const slots = new Set<number>();
    for (const apt of selectedDayAppointments) {
      const startTime = parseTimeString(apt.time, selectedDay);
      const slot = timeToSlot(startTime);
      const idx = Math.floor(slot);
      if (idx >= 0 && idx < HOURS.length) slots.add(idx);
    }
    if (isToday(selectedDay)) {
      const currentSlot = timeToSlot(new Date());
      const currentIdx = Math.floor(currentSlot);
      if (currentIdx >= 0 && currentIdx < HOURS.length) slots.add(currentIdx);
    }
    return slots;
  }, [selectedDayAppointments, selectedDay]);

  useEffect(() => {
    if (selectedDateBtnRef.current) {
      selectedDateBtnRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDay]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDay(date);
    setExpandedMeetingId(null);
    setHasError(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        const idx = dates.findIndex((d) => isSameDay(d, selectedDay));
        if (idx > 0) handleDateSelect(dates[idx - 1]);
      } else if (e.key === "ArrowRight") {
        const idx = dates.findIndex((d) => isSameDay(d, selectedDay));
        if (idx < dates.length - 1) handleDateSelect(dates[idx + 1]);
      }
    },
    [dates, selectedDay, handleDateSelect],
  );

  const scrollToLater = useCallback(() => {
    if (scheduleBodyRef.current) {
      scheduleBodyRef.current.scrollBy({ top: 200, behavior: "smooth" });
    }
  }, []);

  const isLoading = false;

  if (isLoading) return <FacilityCalendarSkeleton />;
  if (hasError) return <FacilityCalendarErrorState onRetry={() => setHasError(false)} />;

  return (
    <div
      className="flex h-full min-h-[620px] flex-col overflow-hidden rounded-[30px] shadow-sm"
      style={{ backgroundColor: "#CCD7D3" }}
    >
      {/* Header */}
      <div className="shrink-0 p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[32px] font-semibold leading-tight" style={{ color: DARK_TEXT }}>
            Schedule
          </h2>
          <button
            aria-label="View full calendar"
            className="flex items-center justify-center rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 2px 12px rgba(39,121,121,0.12)",
            }}
            onClick={() => {
              const el = document.getElementById("appointments-card-body");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <ArrowUpRight className="size-5" style={{ color: TEAL }} />
          </button>
        </div>

        {/* Date Strip */}
        <div
          ref={dateStripRef}
          role="tablist"
          aria-label="Facility calendar dates"
          className="flex w-full gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2"
          style={{ scrollbarWidth: "none" }}
          onKeyDown={handleKeyDown}
        >
          {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDay);
            return (
              <button
                key={date.toISOString()}
                ref={isSelected ? selectedDateBtnRef : undefined}
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleDateSelect(date)}
                className="shrink-0 flex flex-col items-center gap-1 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 px-3 py-2"
                style={{ minWidth: "52px" }}
              >
                <span
                  className="text-[13px] font-medium leading-none"
                  style={{
                    color: isSelected ? DARK_TEXT : "rgba(39,121,121,0.45)",
                  }}
                >
                  {format(date, "EEE")}
                </span>
                <span
                  className="text-2xl leading-tight"
                  style={{
                    color: isSelected ? TEAL : "rgba(39,121,121,0.45)",
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  {format(date, "d")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Body */}
      <div
        id="appointments-card-body"
        ref={scheduleBodyRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4"
      >
        {selectedDayAppointments.length === 0 ? (
          <FacilityCalendarEmptyState />
        ) : (
          <div className="relative">
            {/* Diagonal striped empty region */}
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              aria-hidden="true"
              style={{
                backgroundColor: "rgba(204,215,211,0.15)",
                backgroundImage: "repeating-linear-gradient(-55deg, transparent, transparent 7px, rgba(39,121,121,0.03) 7px, rgba(39,121,121,0.03) 10px)",
              }}
            />

            <div className="relative flex gap-3">
              {/* Timeline */}
              <div className="relative shrink-0" style={{ width: "80px" }}>
                <TimelineLine activeSlots={activeSlots} />
                {isToday(selectedDay) && (
                  <div className="absolute left-0 right-0" style={{ top: 0 }}>
                    <CurrentTimeMarker />
                  </div>
                )}
                <TimelineScrollButton onClick={scrollToLater} />
              </div>

              {/* Meeting Column */}
              <div className="flex-1 min-w-0 space-y-3 pb-4">
                {selectedDayAppointments.map((appointment, idx) => {
                  const isActive = appointment.type === "urgent";
                  const isExpanded = expandedMeetingId === idx;

                  return (
                    <MeetingCard
                      key={idx}
                      appointment={appointment}
                      isActive={isActive}
                      isExpanded={isExpanded}
                      onToggle={() =>
                        setExpandedMeetingId(isExpanded ? null : idx)
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseTimeString(timeStr: string, baseDate: Date): Date {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return baseDate;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  let h = hours;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  const d = new Date(baseDate);
  d.setHours(h, minutes, 0, 0);
  return d;
}
