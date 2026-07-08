import {
  ClipboardList,
  FileSearch,
  Users,
  CalendarCheck,
} from "lucide-react";

export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMinutes = Math.floor((now - then) / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString();
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTimeWithFallback(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMinutes = Math.floor((now - then) / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(isoString);
}

export const statusConfig: Record<string, { label: string; className: string }> = {
  assessment: {
    label: "Assessment",
    className: "bg-health/10 text-health",
  },
  searching: {
    label: "Searching",
    className: "bg-primary/10 text-primary",
  },
  "pending-approval": {
    label: "Pending Approval",
    className: "bg-warmth/10 text-warmth",
  },
  approved: {
    label: "Approved",
    className: "bg-health/10 text-health",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-primary/10 text-primary",
  },
  completed: {
    label: "Completed",
    className: "bg-muted text-muted-foreground",
  },
};

export const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  placement: ClipboardList,
  assessment: FileSearch,
  admission: Users,
  discharge: Users,
  note: ClipboardList,
  milestone: CalendarCheck,
};

export const referralStatusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  new: { label: "New", icon: ClipboardList, className: "bg-health/10 text-health" },
  reviewing: { label: "Reviewing", icon: FileSearch, className: "bg-primary/10 text-primary" },
  accepted: { label: "Accepted", icon: Users, className: "bg-health/10 text-health" },
  declined: { label: "Declined", icon: Users, className: "bg-destructive/10 text-destructive" },
};

export const facilityTypeLabels: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing Facility",
  "rehabilitation-center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "home-health-agency": "Home Health Agency",
  hospice: "Hospice",
};

export const roleLabels: Record<string, string> = {
  "social-worker": "Social Worker",
  "social_worker": "Social Worker",
  "discharge-planner": "Discharge Planner",
  "discharge_planner": "Discharge Planner",
  administrator: "Administrator",
  "facility-coordinator": "Facility Coordinator",
  "facility_coordinator": "Facility Coordinator",
  superadmin: "Super Admin",
  customer: "Customer",
};

export const roleColors: Record<string, string> = {
  "social-worker": "bg-health/10 text-health",
  "social_worker": "bg-health/10 text-health",
  "discharge-planner": "bg-health/10 text-health",
  "discharge_planner": "bg-health/10 text-health",
  administrator: "bg-primary/10 text-primary",
  "facility-coordinator": "bg-warmth/10 text-warmth",
  "facility_coordinator": "bg-warmth/10 text-warmth",
  superadmin: "bg-destructive/10 text-destructive",
  customer: "bg-muted text-muted-foreground",
};

export type SectionProps = {
  organizationId: string;
  role: string;
};
