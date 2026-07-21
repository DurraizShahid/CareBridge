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
  X,
  Plus,
  Sparkles,
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
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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

/* ── Event Detail Panel ── */

function EventDetailPanel({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const typeColors: Record<string, { bg: string; text: string; dot: string }> = {
    meeting: { bg: "rgba(39,121,121,0.1)", text: TEAL, dot: TEAL },
    "check-in": { bg: "rgba(59,130,246,0.1)", text: "#2563EB", dot: "#3B82F6" },
    review: { bg: "rgba(168,85,247,0.1)", text: "#7C3AED", dot: "#A855F7" },
    urgent: { bg: "rgba(239,68,68,0.1)", text: "#DC2626", dot: "#EF4444" },
  };
  const colors = typeColors[appointment.type] ?? typeColors.meeting;

  return (
        <div
          className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-xl bg-card"
          style={{ animation: "slide-in-bottom 0.25s cubic-bezier(0.16,1,0.3,1) forwards" }}
    >
      <div className="flex items-center justify-between px-6 py-5 shrink-0" style={{ borderBottom: "1px solid rgba(204,215,211,0.4)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: colors.dot }} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: DARK_TEXT }}>{appointment.subject}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(39,121,121,0.5)" }}>
              {format(appointment.date, "EEEE, MMM d")} · {appointment.time}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="flex items-center justify-center rounded-full shrink-0 transition-all duration-150 hover:scale-110 hover:rotate-90 active:scale-90"
          style={{ width: "32px", height: "32px", backgroundColor: "rgba(204,215,211,0.3)" }}
        >
          <X className="size-4" style={{ color: DARK_TEXT }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize" style={{ backgroundColor: colors.bg, color: colors.text }}>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
            {appointment.type.replace("-", " ")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "rgba(204,215,211,0.25)", color: "rgba(21,95,96,0.7)" }}>
            <Clock className="size-3" />
            {appointment.duration}
          </span>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(39,121,121,0.4)" }}>Description</p>
          <p className="text-[13px] leading-relaxed" style={{ color: DARK_TEXT }}>{appointment.details}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-[rgba(204,215,211,0.3)] hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-default" style={{ backgroundColor: "rgba(204,215,211,0.15)" }}>
            <MapPin className="size-4 shrink-0 mt-0.5 transition-transform duration-200 group-hover:translate-y-0.5" style={{ color: TEAL }} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(39,121,121,0.4)" }}>Location</p>
              <p className="text-[13px] mt-0.5" style={{ color: DARK_TEXT }}>{appointment.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-[rgba(204,215,211,0.3)] hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-default" style={{ backgroundColor: "rgba(204,215,211,0.15)" }}>
            <User className="size-4 shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110" style={{ color: TEAL }} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(39,121,121,0.4)" }}>Participants</p>
              <p className="text-[13px] mt-0.5" style={{ color: DARK_TEXT }}>{appointment.participants}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 py-4 shrink-0" style={{ borderTop: "1px solid rgba(204,215,211,0.4)" }}>
        <button className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition-all duration-150 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" style={{ backgroundColor: TEAL, color: "#FFFFFF", boxShadow: "0 2px 8px rgba(39,121,121,0.2)" }}>
          <CalendarDays className="size-3.5" />
          Open in Calendar
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all duration-150 hover:bg-[rgba(204,215,211,0.35)] active:scale-[0.98]" style={{ backgroundColor: "rgba(204,215,211,0.2)", color: TEAL }}>
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
          "rounded-2xl overflow-hidden transition-all duration-300 group/card cursor-pointer",
          isActive ? "shadow-lg" : "shadow-sm hover:shadow-md",
        )}
        style={{
          backgroundColor: isActive ? TEAL : "#FFFFFF",
          boxShadow: isActive ? "0 4px 20px rgba(39,121,121,0.25)" : "0 2px 12px rgba(39,121,121,0.08)",
          animation: `card-enter 0.35s cubic-bezier(0.16,1,0.3,1) ${index * 50}ms forwards`,
          opacity: 0,
        }}
      >
        {isActive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 3s ease-in-out infinite",
            }}
          />
        )}
        <CollapsibleTrigger className="w-full text-left" aria-label={isExpanded ? "Collapse" : "Expand"}>
          <div className="px-4 py-3 transition-all duration-200 group-hover/card:brightness-[0.97] group-active/card:scale-[0.98]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[15px] font-medium leading-snug transition-colors duration-200", isActive && "text-white")} style={!isActive ? { color: DARK_TEXT } : undefined}>
                  {appointment.subject}
                </p>
                <p className={cn("text-[13px] mt-0.5 transition-colors duration-200", isActive && "text-white/75")} style={!isActive ? { color: "rgba(39,121,121,0.6)" } : undefined}>
                  {appointment.time}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <span
                  className="size-2.5 rounded-full shrink-0 transition-all duration-300 group-hover/card:scale-150 group-hover/card:shadow-[0_0_8px_rgba(39,121,121,0.5)]"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.6)" : TEAL }}
                />
                <ChevronDownIcon
                  className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{ color: isActive ? "#FFFFFF" : TEAL, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div
            className={cn("px-4 pb-4 pt-0 space-y-2.5 border-t", isActive ? "border-white/20" : "")}
            style={!isActive ? { borderColor: "rgba(204,215,211,0.5)" } : undefined}
          >
            <p className={cn("text-xs leading-relaxed pt-2.5", isActive && "text-white/85")} style={!isActive ? { color: DARK_TEXT } : undefined}>
              {appointment.details}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: "rgba(39,121,121,0.6)" }}>
              <span className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0" />{appointment.location}</span>
              <span className="flex items-center gap-1.5"><User className="size-3.5 shrink-0" />{appointment.participants}</span>
              <span className="flex items-center gap-1.5"><Clock className="size-3.5 shrink-0" />{appointment.duration}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
              className="mt-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:gap-3 hover:shadow-md hover:scale-[1.02] active:scale-[0.97]"
              style={{ backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "rgba(39,121,121,0.08)", color: isActive ? "#FFFFFF" : TEAL }}
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
      {/* SVG dashed line running continuously from first dot to last dot */}
      <svg
        className="absolute"
        style={{ left: `${CX - 1}px`, top: 0, width: "2px", height: `${totalHeight}px`, zIndex: 0 }}
        viewBox={`0 0 2 ${totalHeight}`}
        preserveAspectRatio="none"
      >
        {/* Single continuous dashed line from first dot center to last dot center */}
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
              fill={TEAL}
              opacity={0.5}
              rx="1"
            />
          ));
        })()}
      </svg>

      {/* Bullseye dots above each pill */}
      {HOURS.map((hour, idx) => {
        const isActive = activeSlots.has(idx);
        return (
          <div
            key={`dot-${hour}`}
            className="absolute flex items-center justify-center"
            style={{
              top: `${idx * ROW - 4}px`,
              left: `${CX - 7}px`,
              width: "14px",
              height: "14px",
              zIndex: 4,
            }}
          >
            {/* Outer ring */}
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: isActive ? "rgba(39,121,121,0.25)" : "rgba(39,121,121,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {/* Inner dot */}
              <div
                style={{
                  width: isActive ? "6px" : "4px",
                  height: isActive ? "6px" : "4px",
                  borderRadius: "50%",
                  backgroundColor: TEAL,
                  flexShrink: 0,
                }}
              />
            </div>
          </div>
        );
      })}
      {/* Hour pills — rendered after line so they cover it */}
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
              className="relative flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200"
              style={{
                width: `${PILL_W}px`,
                height: `${PILL_H}px`,
                backgroundColor: isActive ? TEAL : "#CCD7D3",
                border: isActive ? "none" : isHovered ? `1.5px solid ${TEAL}` : `1.5px solid rgba(39,121,121,0.45)`,
                color: isActive ? "#FFFFFF" : isHovered ? TEAL : DARK_TEXT,
                boxShadow: isActive ? "0 2px 8px rgba(39,121,121,0.18)" : isHovered ? "0 2px 8px rgba(39,121,121,0.08)" : undefined,
                transform: isHovered ? "scale(1.08)" : "scale(1)",
                zIndex: 10,
              }}
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
      <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: TEAL, boxShadow: "0 0 0 4px rgba(39,121,121,0.2)", flexShrink: 0, animation: "pulse-dot 2s ease-in-out infinite" }} />
      <div className="h-px flex-1" style={{ backgroundColor: TEAL, opacity: 0.5 }} />
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
        className="flex items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-90"
        style={{ width: "36px", height: "36px", backgroundColor: TEAL }}
      >
        <ChevronDownIcon className="size-4 text-white" />
      </button>
    </div>
  );
}

/* ── States ── */

function FacilityCalendarSkeleton() {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#FFFFFF" }}>
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
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-5 w-14 rounded-full" style={{ backgroundColor: "#FFFFFF" }} />)}
          </div>
          <div className="flex-1 space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: "#FFFFFF" }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function FacilityCalendarEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3" style={{ animation: "slide-in-bottom 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      <CalendarDays className="size-10" style={{ color: "rgba(39,121,121,0.35)" }} />
      <p className="text-sm font-medium" style={{ color: DARK_TEXT }}>No meetings scheduled</p>
      <p className="text-xs" style={{ color: "rgba(39,121,121,0.45)" }}>Select a different date or create a new meeting</p>
    </div>
  );
}

function FacilityCalendarErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
      <CalendarDays className="size-10" style={{ color: "rgba(39,121,121,0.35)" }} />
      <p className="text-sm font-medium" style={{ color: DARK_TEXT }}>Failed to load calendar</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-medium underline underline-offset-2 hover:no-underline" style={{ color: TEAL }}>Retry</button>
      )}
    </div>
  );
}

/* ── Main Component ── */

export function AppointmentsCard() {
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [expandedMeetingId, setExpandedMeetingId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const dateStripRef = useRef<HTMLDivElement>(null);
  const scheduleBodyRef = useRef<HTMLDivElement>(null);
  const selectedDateBtnRef = useRef<HTMLButtonElement>(null);
  const hasScrolledToCurrent = useRef(false);

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
    <div
      className="flex max-h-[480px] min-h-0 flex-col overflow-hidden rounded-xl shadow-sm bg-card transition-all duration-300 hover:shadow-lg"
    >
      {/* Header */}
      <div className="shrink-0 p-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">
            Schedule
          </h3>
          <button
              aria-label="View full calendar"
              className="flex items-center justify-center rounded-xl shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-lg hover:rotate-12 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 bg-card"
              style={{ width: "48px", height: "48px", boxShadow: "0 2px 12px rgba(39,121,121,0.12)" }}
            onClick={() => document.getElementById("appointments-card-body")?.scrollIntoView({ behavior: "smooth" })}
          >
            <ArrowUpRight className="size-5 transition-transform duration-200" style={{ color: TEAL }} />
          </button>
        </div>

        {/* Date Strip */}
        <div className="flex items-center gap-2">
          <div
            ref={dateStripRef}
            id="schedule-date-strip"
            role="tablist"
            aria-label="Facility calendar dates"
            className="flex flex-1 gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            onKeyDown={handleKeyDown}
          >
            <style>{`
              #schedule-date-strip::-webkit-scrollbar,
              #appointments-card-body::-webkit-scrollbar { display: none; }
              @keyframes slide-in-bottom { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
              @keyframes pulse-dot { 0%, 100% { box-shadow: 0 0 0 4px rgba(39,121,121,0.2); } 50% { box-shadow: 0 0 0 8px rgba(39,121,121,0.08); } }
              @keyframes card-enter { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
              @keyframes dot-pulse { 0%, 100% { transform: scale(1); opacity: 0.35; } 50% { transform: scale(1.5); opacity: 0.6; } }
              @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
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
                  className="shrink-0 flex flex-col items-center gap-1 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 px-3 py-2 rounded-xl hover:bg-[rgba(39,121,121,0.1)] hover:scale-105 hover:shadow-sm active:scale-95 group/date"
                  style={{
                    minWidth: "52px",
                    backgroundColor: isSelected ? "rgba(39,121,121,0.12)" : "transparent",
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <span className="text-[13px] font-medium leading-none transition-all duration-200 group-hover/date:text-[#155F60]" style={{ color: isSelected ? DARK_TEXT : "rgba(39,121,121,0.45)" }}>
                    {format(date, "EEE")}
                  </span>
                  <span className="text-2xl leading-tight transition-all duration-200 group-hover/date:font-bold group-hover/date:text-[#277979]" style={{ color: isSelected ? TEAL : "rgba(39,121,121,0.45)", fontWeight: isSelected ? 700 : 500 }}>
                    {format(date, "d")}
                  </span>
                  {isTodayDate && !isSelected && (
                    <span className="size-1.5 rounded-full -mt-1 transition-all duration-200 group-hover/date:scale-150" style={{ backgroundColor: TEAL, animation: "dot-pulse 2s ease-in-out infinite" }} />
                  )}
                </button>
              );
            })}
          </div>
          {!isToday(selectedDay) && (
            <button
              onClick={() => handleDateSelect(today)}
              className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 hover:scale-[1.05] hover:shadow-md active:scale-[0.95]"
              style={{ backgroundColor: TEAL, color: "#FFFFFF", boxShadow: "0 2px 8px rgba(39,121,121,0.2)", animation: "slide-in-bottom 0.2s cubic-bezier(0.16,1,0.3,1) forwards" }}
            >
              <Sparkles className="size-3" />
              Today
            </button>
          )}
        </div>
      </div>

      {/* Schedule Body */}
      <div
        id="appointments-card-body"
        ref={scheduleBodyRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4"
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
    </div>
  );
}
