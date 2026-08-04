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
  X,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isToday,
} from "date-fns";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import type { ScheduleEvent } from "@/types";

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

const today = new Date();

function toAppointments(events: ScheduleEvent[]): Appointment[] {
  return events.map((event) => ({
    date: new Date(event.dateISO),
    time: event.time,
    subject: event.subject,
    details: event.details,
    location: event.location,
    participants: event.participants,
    duration: event.duration,
    type: event.type,
  }));
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 7);
const START_HOUR = 7;
const TOTAL_HOURS = 10;

function timeToSlot(date: Date): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return ((hours - START_HOUR) * 60 + minutes) / 15;
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

function findAppointmentForHour(appointments: Appointment[], hour: number, baseDate: Date): Appointment | undefined {
  return appointments.find((a) => parseTimeString(a.time, baseDate).getHours() === hour);
}

const typeStyles: Record<Appointment["type"], { badge: string; dot: string }> = {
  meeting: { badge: "bg-[var(--chart-1)]/10 text-[var(--chart-1)]", dot: "bg-[var(--chart-1)]" },
  "check-in": { badge: "bg-[var(--chart-2)]/10 text-[var(--chart-2)]", dot: "bg-[var(--chart-2)]" },
  review: { badge: "bg-[var(--chart-4)]/10 text-[var(--chart-4)]", dot: "bg-[var(--chart-4)]" },
  urgent: { badge: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

/* ── Event Detail Panel ── */

function EventDetailPanel({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const styles = typeStyles[appointment.type] ?? typeStyles.meeting;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-xl bg-card"
      style={{ animation: "slide-in-bottom 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("size-3 rounded-full shrink-0", styles.dot)} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate text-foreground">{appointment.subject}</p>
            <p className="text-[11px] mt-0.5 text-muted-foreground">
              {format(appointment.date, "EEEE, MMM d")} · {appointment.time}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="flex size-8 items-center justify-center rounded-full bg-muted shrink-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:rotate-90 active:scale-90"
        >
          <X className="size-4 text-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize", styles.badge)}>
            <span className={cn("size-1.5 rounded-full", styles.dot)} />
            {appointment.type.replace("-", " ")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Clock className="size-3" />
            {appointment.duration}
          </span>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">Description</p>
          <p className="text-[13px] leading-relaxed text-foreground">{appointment.details}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-3 transition-colors hover:bg-muted">
            <MapPin className="size-4 shrink-0 mt-0.5 text-primary" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Location</p>
              <p className="text-[13px] mt-0.5 text-foreground">{appointment.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-3 transition-colors hover:bg-muted">
            <User className="size-4 shrink-0 mt-0.5 text-primary" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Participants</p>
              <p className="text-[13px] mt-0.5 text-foreground">{appointment.participants}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border/60 px-6 py-4 shrink-0">
        <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-medium text-primary-foreground transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
          <CalendarDays className="size-3.5" />
          Open in Calendar
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-[13px] font-medium text-foreground transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-accent active:scale-[0.98]">
          <Plus className="size-3.5" />
          Add note
        </button>
      </div>
    </div>
  );
}

/* ── Meeting Card ── */

function MeetingCard({
  appointment,
  isActive,
  isExpanded,
  onToggle,
  onOpenDetail,
  index,
}: {
  appointment: Appointment;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
  index: number;
}) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className={cn(
          "rounded-2xl border transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group/card cursor-pointer",
          isActive
            ? "border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            : "border-border/60 bg-card shadow-sm hover:shadow-md",
        )}
        style={{
          animation: `card-enter 0.4s cubic-bezier(0.34,1.56,0.64,1) ${index * 60}ms forwards`,
          opacity: 0,
        }}
      >
        <CollapsibleTrigger className="w-full text-left" aria-label={isExpanded ? "Collapse" : "Expand"}>
          <div className="px-4 py-3 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active/card:scale-[0.98]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[15px] font-medium leading-snug", isActive ? "text-primary-foreground" : "text-foreground")}>
                  {appointment.subject}
                </p>
                <p className={cn("text-[13px] mt-0.5", isActive ? "text-primary-foreground/75" : "text-muted-foreground")}>
                  {appointment.time}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <span
                  className={cn(
                    "size-2.5 rounded-full shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/card:scale-150",
                    isActive ? "bg-primary-foreground/60" : "bg-primary",
                  )}
                />
                <ChevronDownIcon
                  className={cn(
                    "size-4 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    isActive ? "text-primary-foreground" : "text-primary",
                    isExpanded && "rotate-180",
                  )}
                />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className={cn("px-4 pb-4 pt-0 space-y-2.5 border-t", isActive ? "border-primary-foreground/20" : "border-border/60")}>
            <p className={cn("text-xs leading-relaxed pt-2.5", isActive ? "text-primary-foreground/85" : "text-foreground")}>
              {appointment.details}
            </p>
            <div className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
              <span className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0" />{appointment.location}</span>
              <span className="flex items-center gap-1.5"><User className="size-3.5 shrink-0" />{appointment.participants}</span>
              <span className="flex items-center gap-1.5"><Clock className="size-3.5 shrink-0" />{appointment.duration}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
              className={cn(
                "mt-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:gap-3 hover:shadow-md hover:scale-[1.03] active:scale-[0.97]",
                isActive ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary",
              )}
            >
              View details
              <ArrowRight className="size-3 transition-transform duration-200 group-hover/card:translate-x-1" />
            </button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ── Timeline ── */

function TimelineLine({
  activeSlots,
  hoveredSlot,
  onSlotClick,
  onSlotHover,
  selectedDay,
  dayAppointments,
}: {
  activeSlots: Set<number>;
  hoveredSlot: number | null;
  onSlotClick: (hour: number) => void;
  onSlotHover: (idx: number | null) => void;
  selectedDay: Date;
  dayAppointments: Appointment[];
}) {
  const PILL_W = 64;
  const PILL_H = 34;
  const ROW = 60;
  const CX = PILL_W / 2;
  const totalHeight = HOURS.length * ROW;

  return (
    <div className="relative flex flex-col" style={{ width: `${PILL_W}px` }}>
      {/* Continuous dashed line from first dot to last dot */}
      <svg
        className="absolute"
        style={{ left: `${CX - 1}px`, top: 0, width: "2px", height: `${totalHeight}px`, zIndex: 0 }}
        viewBox={`0 0 2 ${totalHeight}`}
        preserveAspectRatio="none"
      >
        {(() => {
          const lineStart = ROW / 2;
          const lineEnd = (HOURS.length - 1) * ROW + ROW / 2;
          const lineHeight = lineEnd - lineStart;
          const dashLen = 4;
          const gapLen = 4;
          const numDashes = Math.floor(lineHeight / (dashLen + gapLen));

          return Array.from({ length: numDashes }).map((_, idx) => (
            <rect
              key={`dash-${idx}`}
              x="0"
              y={lineStart + idx * (dashLen + gapLen)}
              width="2"
              height={dashLen}
              className="fill-primary/40"
              rx="1"
            />
          ));
        })()}
      </svg>

      {/* Hour pills */}
      {HOURS.map((hour, idx) => {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const label = `${String(displayHour).padStart(2, "0")}:00`;
        const isActive = activeSlots.has(idx);
        const isHovered = hoveredSlot === idx;
        const hasAppointment = !!findAppointmentForHour(dayAppointments, hour, selectedDay);

        return (
          <div
            key={hour}
            className="relative flex items-center justify-center cursor-pointer"
            style={{ height: `${ROW}px` }}
            onClick={() => onSlotClick(hour)}
            onMouseEnter={() => onSlotHover(idx)}
            onMouseLeave={() => onSlotHover(null)}
            role="button"
            tabIndex={0}
            aria-label={`${label} — ${hasAppointment ? "Has appointment" : "Empty slot"}`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSlotClick(hour); } }}
          >
            <div
              className={cn(
                "relative z-10 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : isHovered
                    ? "border border-primary bg-card text-primary shadow-md"
                    : "border border-border bg-muted text-muted-foreground",
                isHovered && "scale-110",
              )}
              style={{ width: `${PILL_W}px`, height: `${PILL_H}px` }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Current Time Marker ── */

function CurrentTimeMarker() {
  const now = new Date();
  const slotTop = timeToSlot(now);
  const topPx = (slotTop / TOTAL_HOURS) * (TOTAL_HOURS * 60);
  return (
    <div className="absolute flex items-center pointer-events-none" style={{ top: `${topPx}px`, zIndex: 10, left: "32px", right: 0 }}>
      <div className="size-3 shrink-0 rounded-full bg-primary" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
      <div className="h-px flex-1 bg-primary/50" />
    </div>
  );
}

/* ── Scroll Button ── */

function TimelineScrollButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center py-3">
      <button
        onClick={onClick}
        aria-label="View later schedule times"
        className="flex size-9 items-center justify-center rounded-full bg-primary shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:shadow-md active:scale-90"
      >
        <ChevronDownIcon className="size-4 text-primary-foreground" />
      </button>
    </div>
  );
}

/* ── States ── */

function FacilityCalendarEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3" style={{ animation: "slide-in-bottom 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      <CalendarDays className="size-10 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">No placement events</p>
      <p className="text-xs text-muted-foreground">Starts, discharges, and referrals for this day will appear here</p>
    </div>
  );
}

function FacilityCalendarErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
      <CalendarDays className="size-10 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">Failed to load calendar</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-medium text-primary underline underline-offset-2 hover:no-underline">Retry</button>
      )}
    </div>
  );
}

/* ── Main Component ── */

interface AppointmentsCardProps {
  events?: ScheduleEvent[];
}

export function AppointmentsCard({ events = [] }: AppointmentsCardProps) {
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [expandedMeetingId, setExpandedMeetingId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const dateStripRef = useRef<HTMLDivElement>(null);
  const scheduleBodyRef = useRef<HTMLDivElement>(null);
  const selectedDateBtnRef = useRef<HTMLButtonElement>(null);
  const hasScrolledToCurrent = useRef(false);

  const appointments = useMemo(() => toAppointments(events), [events]);

  const dates = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 28 }, (_, i) => addDays(start, i));
  }, []);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const key = format(apt.date, "yyyy-MM-dd");
      const existing = map.get(key) ?? [];
      existing.push(apt);
      map.set(key, existing);
    }
    return map;
  }, [appointments]);

  const selectedDayAppointments = useMemo(() => {
    const key = format(selectedDay, "yyyy-MM-dd");
    return appointmentsByDay.get(key) ?? [];
  }, [selectedDay, appointmentsByDay]);

  const activeSlots = useMemo(() => {
    const slots = new Set<number>();
    for (const apt of selectedDayAppointments) {
      const startTime = parseTimeString(apt.time, selectedDay);
      const idx = Math.floor(timeToSlot(startTime));
      if (idx >= 0 && idx < HOURS.length) slots.add(idx);
    }
    if (isToday(selectedDay)) {
      const currentIdx = Math.floor(timeToSlot(new Date()));
      if (currentIdx >= 0 && currentIdx < HOURS.length) slots.add(currentIdx);
    }
    return slots;
  }, [selectedDayAppointments, selectedDay]);

  useEffect(() => {
    if (selectedDateBtnRef.current) {
      selectedDateBtnRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedDay]);

  useEffect(() => {
    if (isToday(selectedDay) && scheduleBodyRef.current && !hasScrolledToCurrent.current) {
      hasScrolledToCurrent.current = true;
      const timer = setTimeout(() => {
        if (scheduleBodyRef.current) {
          const hour = new Date().getHours();
          scheduleBodyRef.current.scrollTo({ top: Math.max(0, (hour - START_HOUR - 1) * 60), behavior: "smooth" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedDay]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDay(date);
    setExpandedMeetingId(null);
    setHasError(false);
    setSelectedEvent(null);
    setHoveredSlot(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = dates.findIndex((d) => isSameDay(d, selectedDay));
    if (e.key === "ArrowLeft" && idx > 0) handleDateSelect(dates[idx - 1]);
    else if (e.key === "ArrowRight" && idx < dates.length - 1) handleDateSelect(dates[idx + 1]);
  }, [dates, selectedDay, handleDateSelect]);

  const scrollToLater = useCallback(() => {
    scheduleBodyRef.current?.scrollBy({ top: 200, behavior: "smooth" });
  }, []);

  const handleSlotClick = useCallback((hour: number) => {
    const apt = findAppointmentForHour(selectedDayAppointments, hour, selectedDay);
    if (apt) setSelectedEvent(apt);
  }, [selectedDayAppointments, selectedDay]);

  if (hasError) return <FacilityCalendarErrorState onRetry={() => setHasError(false)} />;

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardContent className="p-0 flex flex-col h-full overflow-hidden rounded-[28px]">
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Schedule
            </h3>
            <button
              aria-label="View full calendar"
              className="flex size-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted active:scale-95"
              onClick={() => document.getElementById("appointments-card-body")?.scrollIntoView({ behavior: "smooth" })}
            >
              <ArrowUpRight className="size-4 text-primary" />
            </button>
          </div>

          {/* Date Strip */}
          <div className="flex items-center gap-2">
            <div
              ref={dateStripRef}
              id="schedule-date-strip"
              role="tablist"
              aria-label="Facility calendar dates"
              className="flex flex-1 gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 pt-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
              onKeyDown={handleKeyDown}
            >
              <style>{`
                #schedule-date-strip::-webkit-scrollbar,
                #appointments-card-body::-webkit-scrollbar { display: none; }
                @keyframes slide-in-bottom { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes pulse-dot { 0%, 100% { box-shadow: 0 0 0 4px color-mix(in oklab, var(--primary) 20%, transparent); } 50% { box-shadow: 0 0 0 8px color-mix(in oklab, var(--primary) 8%, transparent); } }
                @keyframes card-enter { from { transform: translateY(12px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                @keyframes dot-pulse { 0%, 100% { transform: scale(1); opacity: 0.35; } 50% { transform: scale(1.5); opacity: 0.6; } }
              `}</style>
              {dates.map((date) => {
                const isSelected = isSameDay(date, selectedDay);
                const isTodayDate = isToday(date);
                return (
                  <button
                    key={date.toISOString()}
                    ref={isSelected ? selectedDateBtnRef : undefined}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      "shrink-0 flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 group/date",
                      isSelected ? "bg-primary scale-[1.08]" : "hover:bg-muted hover:scale-110",
                    )}
                    style={{ minWidth: "52px" }}
                  >
                    <span className={cn("text-[13px] font-medium leading-none", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>
                      {format(date, "EEE")}
                    </span>
                    <span className={cn("text-2xl leading-tight font-medium", isSelected ? "text-primary-foreground" : "text-foreground/70")}>
                      {format(date, "d")}
                    </span>
                    {isTodayDate && !isSelected && (
                      <span className="size-1.5 rounded-full bg-primary transition-transform duration-200 group-hover/date:scale-150" style={{ animation: "dot-pulse 2s ease-in-out infinite" }} />
                    )}
                  </button>
                );
              })}
            </div>
            {!isToday(selectedDay) && (
              <button
                onClick={() => handleDateSelect(today)}
                className="shrink-0 flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-95"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Schedule Body */}
        <div
          id="appointments-card-body"
          ref={scheduleBodyRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-2 pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {selectedDayAppointments.length === 0 ? (
            <FacilityCalendarEmptyState />
          ) : (
            <div className="relative">
              <div className="relative flex">
                <div className="relative shrink-0">
                  <TimelineLine
                    activeSlots={activeSlots}
                    hoveredSlot={hoveredSlot}
                    onSlotClick={handleSlotClick}
                    onSlotHover={setHoveredSlot}
                    selectedDay={selectedDay}
                    dayAppointments={selectedDayAppointments}
                  />
                  {isToday(selectedDay) && (
                    <div className="absolute" style={{ top: 0, left: 0, right: 0 }}>
                      <CurrentTimeMarker />
                    </div>
                  )}
                  <TimelineScrollButton onClick={scrollToLater} />
                </div>
                <div className="flex-1 min-w-0 space-y-3 pb-4 pl-4">
                  {selectedDayAppointments.map((appointment, idx) => (
                    <MeetingCard
                      key={idx}
                      appointment={appointment}
                      isActive={appointment.type === "urgent"}
                      isExpanded={expandedMeetingId === idx}
                      onToggle={() => setExpandedMeetingId(expandedMeetingId === idx ? null : idx)}
                      onOpenDetail={() => setSelectedEvent(appointment)}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedEvent && <EventDetailPanel appointment={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </CardContent>
    </Card>
  );
}
