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
const MINUTES_PER_SLOT = 15;
const TOTAL_SLOTS = (TOTAL_HOURS * 60) / MINUTES_PER_SLOT;

function timeToSlot(date: Date): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return ((hours - START_HOUR) * 60 + minutes) / MINUTES_PER_SLOT;
}

function getStatusColor(status: string | null | undefined): string {
  switch (status) {
    case "confirmed": return TEAL;
    case "in-progress":
    case "in_progress": return TEAL;
    case "completed": return "#4ADE80";
    case "cancelled": return "#9CA3AF";
    default: return TEAL;
  }
}

function getStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "confirmed": return "Confirmed";
    case "in-progress":
    case "in_progress": return "In Progress";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    default: return "Scheduled";
  }
}

function AppointmentStatusDot({ status, className }: { status?: string | null; className?: string }) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      role="status"
      aria-label={label}
      title={label}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
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
    <AvatarGroup className="mt-1.5">
      {visible.map((name, i) => (
        <Avatar key={i} size="sm" className="ring-2 ring-[#277979]">
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
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
          isActive
            ? "shadow-lg"
            : "shadow-sm",
        )}
        style={
          isActive
            ? { backgroundColor: TEAL, boxShadow: `0 4px 16px rgba(39,121,121,0.2)` }
            : { backgroundColor: "var(--color-card, #FFFFFF)", boxShadow: `0 2px 8px rgba(39,121,121,0.08)` }
        }
      >
        <CollapsibleTrigger
          className="w-full text-left"
          aria-label={isExpanded ? "Collapse meeting details" : "Expand meeting details"}
        >
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold leading-snug",
                    isActive ? "text-white" : "",
                  )}
                  style={!isActive ? { color: TEAL } : undefined}
                >
                  {appointment.subject}
                </p>
                <p
                  className={cn(
                    "text-xs mt-1",
                    isActive ? "text-white/75" : "",
                  )}
                  style={!isActive ? { color: "rgba(39,121,121,0.6)" } : undefined}
                >
                  {appointment.time}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <AppointmentStatusDot status={appointment.type} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div
            className={cn(
              "px-5 pb-4 pt-0 space-y-2.5 border-t",
              isActive ? "border-white/20" : "",
            )}
            style={!isActive ? { borderColor: "rgba(39,121,121,0.1)" } : undefined}
          >
            <p
              className={cn(
                "text-xs leading-relaxed pt-2.5",
                isActive ? "text-white/85" : "",
              )}
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
            <MeetingParticipantsList participants={appointment.participants} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function TimelineLine({ onTimeSelect }: { onTimeSelect?: (slot: number) => void }) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  return (
    <div className="relative flex flex-col" style={{ width: "80px" }}>
      {HOURS.map((hour, idx) => {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const label = `${String(displayHour).padStart(2, "0")}:00`;
        const isActive = selectedSlot === idx;
        return (
          <div key={hour} className="relative flex items-center" style={{ height: "60px" }}>
            <button
              onClick={() => {
                setSelectedSlot(isActive ? null : idx);
                onTimeSelect?.(idx);
              }}
              className="flex items-center justify-center rounded-full text-xs font-medium shrink-0 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                width: "60px",
                height: "32px",
                backgroundColor: isActive ? TEAL : "transparent",
                border: isActive ? "none" : `1.5px solid rgba(39,121,121,0.5)`,
                color: isActive ? "#FFFFFF" : DARK_TEXT,
                boxShadow: isActive ? `0 2px 8px rgba(39,121,121,0.18)` : undefined,
              }}
            >
              {label}
            </button>
          </div>
        );
      })}
      {/* Dashed line with dots centered between time pills and cards */}
      <div
        className="absolute top-0 bottom-0 flex flex-col items-center"
        style={{
          left: "68px",
        }}
      >
        {/* Dashed line */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            width: "0",
            borderLeft: `1.5px dashed ${TEAL}`,
            opacity: 0.4,
          }}
        />
        {/* Dots at each time position */}
        {HOURS.map((hour, idx) => {
          const isActive = selectedSlot === idx;
          return (
            <div
              key={hour}
              className="absolute rounded-full"
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: TEAL,
                opacity: isActive ? 0.9 : 0.4,
                top: `${idx * 60 + 27}px`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function CurrentTimeMarker() {
  const now = new Date();
  const slotTop = timeToSlot(now);
  const topPx = (slotTop / TOTAL_SLOTS) * (HOURS.length * 60);
  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-none"
      style={{ top: `${topPx}px`, zIndex: 10 }}
    >
      <div
        className="relative"
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: TEAL,
          boxShadow: `0 0 0 3px rgba(39,121,121,0.2)`,
          marginLeft: "-3px",
        }}
      />
      <div
        className="h-px flex-1"
        style={{ backgroundColor: TEAL, opacity: 0.6 }}
      />
    </div>
  );
}

function FacilityCalendarSkeleton() {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#CCD7D3" }}>
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-white dark:bg-white/10" />
          <div className="size-11 animate-pulse rounded-full bg-white dark:bg-white/10" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1.5 animate-pulse" style={{ minWidth: "56px" }}>
              <div className="h-3 w-8 rounded bg-white dark:bg-white/10" />
              <div className="h-5 w-6 rounded bg-white dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="flex gap-4 h-full">
          <div className="flex flex-col gap-3 animate-pulse" style={{ width: "80px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 w-14 rounded-full bg-white dark:bg-white/10" />
            ))}
          </div>
          <div className="flex-1 space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white dark:bg-white/10" />
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
      <CalendarDays className="size-10" style={{ color: "rgba(39,121,121,0.38)" }} />
      <p className="text-sm font-medium" style={{ color: DARK_TEXT }}>No meetings scheduled</p>
      <p className="text-xs" style={{ color: "rgba(39,121,121,0.38)" }}>
        Select a different date or create a new meeting
      </p>
    </div>
  );
}

function FacilityCalendarErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
      <CalendarDays className="size-10" style={{ color: "rgba(39,121,121,0.38)" }} />
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
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
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
      <div className="shrink-0 p-6 pb-1">
        <div className="flex items-end justify-between mb-5">
          <h3 className="text-2xl font-bold" style={{ color: DARK_TEXT }}>
            Schedule
          </h3>
          <button
            aria-label="View full calendar"
            className="flex items-center justify-center rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "var(--color-card, #FFFFFF)",
              boxShadow: `0 2px 8px rgba(39,121,121,0.12)`,
            }}
            onClick={() => {
              const el = document.getElementById("appointments-card-body");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <ArrowUpRight className="size-4" style={{ color: TEAL }} />
          </button>
        </div>

        {/* Date Strip */}
        <div
          ref={dateStripRef}
          role="tablist"
          aria-label="Facility calendar dates"
          className="flex w-full gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${TEAL} transparent` }}
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
                className="shrink-0 flex flex-col items-center gap-1 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-xl px-3 py-2"
                style={{
                  minWidth: "56px",
                  backgroundColor: isSelected ? "var(--color-card, #FFFFFF)" : "transparent",
                  boxShadow: isSelected ? `0 2px 8px rgba(39,121,121,0.1)` : undefined,
                }}
              >
                <span
                  className="text-xs font-medium leading-none"
                  style={{
                    color: isSelected ? DARK_TEXT : "rgba(39,121,121,0.45)",
                  }}
                >
                  {format(date, "EEE")}
                </span>
                <span
                  className="text-xl leading-tight"
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
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          id="appointments-card-body"
          ref={scheduleBodyRef}
          className="h-full overflow-y-auto overscroll-contain px-6 pb-14 pt-1"
        >
          {selectedDayAppointments.length === 0 ? (
            <FacilityCalendarEmptyState />
          ) : (
            <div className="relative">
              <div className="relative flex gap-3">
                {/* Timeline */}
                <div className="relative shrink-0" style={{ width: "80px" }}>
                  <TimelineLine />

                  {isToday(selectedDay) && (
                    <div className="absolute left-0 right-0" style={{ top: 0 }}>
                      <CurrentTimeMarker />
                    </div>
                  )}
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

        {/* Fixed scroll button at bottom */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
          <button
            onClick={scrollToLater}
            aria-label="View later schedule times"
            className="flex items-center justify-center rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 pointer-events-auto"
            style={{
              width: "34px",
              height: "34px",
              backgroundColor: TEAL,
            }}
          >
            <ChevronDownIcon className="size-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
