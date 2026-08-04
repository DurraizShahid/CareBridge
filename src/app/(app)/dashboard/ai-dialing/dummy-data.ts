export type CallDirection = "inbound" | "outbound";

export type CallStatus =
  | "queued"
  | "ringing"
  | "connected"
  | "completed"
  | "missed"
  | "failed";

export type AgentStatus = "available" | "on-call" | "wrap-up" | "offline";

export interface DialingCall {
  id: string;
  direction: CallDirection;
  contactName: string;
  phone: string;
  purpose: string;
  campaign: string;
  status: CallStatus;
  agentId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  transcriptPreview: string | null;
}

export interface DialingAgent {
  id: string;
  name: string;
  status: AgentStatus;
  activeCallId: string | null;
  callsToday: number;
  avgHandleSec: number;
}

export interface DialingCampaign {
  id: string;
  name: string;
  direction: CallDirection;
  status: "running" | "paused" | "draft";
  progress: number;
  dialed: number;
  connected: number;
  script: string;
}

export interface DialingLog {
  id: string;
  callId: string | null;
  message: string;
  timestamp: string;
  tone: "info" | "success" | "warning";
}

export const STATUS_LABELS: Record<CallStatus, string> = {
  queued: "Queued",
  ringing: "Ringing",
  connected: "Connected",
  completed: "Completed",
  missed: "Missed",
  failed: "Failed",
};

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  available: "Available",
  "on-call": "On call",
  "wrap-up": "Wrap-up",
  offline: "Offline",
};

export const SAMPLE_AGENTS: DialingAgent[] = [
  {
    id: "agent-01",
    name: "Avery Chen",
    status: "on-call",
    activeCallId: "call-in-001",
    callsToday: 18,
    avgHandleSec: 214,
  },
  {
    id: "agent-02",
    name: "Jordan Blake",
    status: "available",
    activeCallId: null,
    callsToday: 14,
    avgHandleSec: 198,
  },
  {
    id: "agent-03",
    name: "Sam Rivera",
    status: "wrap-up",
    activeCallId: null,
    callsToday: 21,
    avgHandleSec: 241,
  },
  {
    id: "agent-04",
    name: "Morgan Lee",
    status: "on-call",
    activeCallId: "call-out-002",
    callsToday: 16,
    avgHandleSec: 187,
  },
  {
    id: "agent-05",
    name: "Casey Nguyen",
    status: "offline",
    activeCallId: null,
    callsToday: 9,
    avgHandleSec: 226,
  },
];

export const SAMPLE_CAMPAIGNS: DialingCampaign[] = [
  {
    id: "camp-01",
    name: "Facility capacity check-ins",
    direction: "outbound",
    status: "running",
    progress: 62,
    dialed: 148,
    connected: 91,
    script: "Confirm open beds, specialty fit, and intake readiness for pending referrals.",
  },
  {
    id: "camp-02",
    name: "Referral follow-up hotline",
    direction: "inbound",
    status: "running",
    progress: 100,
    dialed: 0,
    connected: 37,
    script: "Greet caller, identify facility or hospital, route to placement queue or capture callback.",
  },
  {
    id: "camp-03",
    name: "Discharge planner outreach",
    direction: "outbound",
    status: "paused",
    progress: 28,
    dialed: 54,
    connected: 22,
    script: "Introduce CareBridge matching, offer demo, and schedule a coordinator callback.",
  },
  {
    id: "camp-04",
    name: "After-hours intake IVR",
    direction: "inbound",
    status: "draft",
    progress: 0,
    dialed: 0,
    connected: 0,
    script: "Collect patient initials, preferred facility type, and urgency; create a callback ticket.",
  },
];

export const SAMPLE_CALLS: DialingCall[] = [
  {
    id: "call-in-001",
    direction: "inbound",
    contactName: "Sunrise Rehab Front Desk",
    phone: "+1 (415) 555-0142",
    purpose: "Confirm open SNF beds for tomorrow",
    campaign: "Referral follow-up hotline",
    status: "connected",
    agentId: "agent-01",
    startedAt: new Date(Date.now() - 95_000).toISOString(),
    endedAt: null,
    durationSec: null,
    sentiment: "positive",
    transcriptPreview: "AI: Thanks for calling CareBridge. How can I help with placements today?",
  },
  {
    id: "call-in-002",
    direction: "inbound",
    contactName: "Metro General Discharge",
    phone: "+1 (628) 555-0198",
    purpose: "Urgent psych step-down referral",
    campaign: "Referral follow-up hotline",
    status: "queued",
    agentId: null,
    startedAt: new Date(Date.now() - 18_000).toISOString(),
    endedAt: null,
    durationSec: null,
    sentiment: null,
    transcriptPreview: null,
  },
  {
    id: "call-in-003",
    direction: "inbound",
    contactName: "Harbor View LTC",
    phone: "+1 (510) 555-0177",
    purpose: "Update insurance acceptance list",
    campaign: "Referral follow-up hotline",
    status: "completed",
    agentId: "agent-03",
    startedAt: new Date(Date.now() - 3_600_000).toISOString(),
    endedAt: new Date(Date.now() - 3_420_000).toISOString(),
    durationSec: 186,
    sentiment: "neutral",
    transcriptPreview: "Caller updated Medicare Advantage acceptance for two new plans.",
  },
  {
    id: "call-in-004",
    direction: "inbound",
    contactName: "Unknown caller",
    phone: "+1 (707) 555-0111",
    purpose: "Missed — no agent available",
    campaign: "Referral follow-up hotline",
    status: "missed",
    agentId: null,
    startedAt: new Date(Date.now() - 7_200_000).toISOString(),
    endedAt: new Date(Date.now() - 7_180_000).toISOString(),
    durationSec: 22,
    sentiment: null,
    transcriptPreview: null,
  },
  {
    id: "call-out-001",
    direction: "outbound",
    contactName: "Oakridge Skilled Nursing",
    phone: "+1 (925) 555-0133",
    purpose: "Capacity check — PT/OT beds",
    campaign: "Facility capacity check-ins",
    status: "queued",
    agentId: null,
    startedAt: new Date(Date.now() + 6_000).toISOString(),
    endedAt: null,
    durationSec: null,
    sentiment: null,
    transcriptPreview: null,
  },
  {
    id: "call-out-002",
    direction: "outbound",
    contactName: "Bay Area Memory Care",
    phone: "+1 (650) 555-0164",
    purpose: "Confirm dementia unit availability",
    campaign: "Facility capacity check-ins",
    status: "connected",
    agentId: "agent-04",
    startedAt: new Date(Date.now() - 140_000).toISOString(),
    endedAt: null,
    durationSec: null,
    sentiment: "positive",
    transcriptPreview: "AI: We have two pending referrals needing memory care within 15 miles.",
  },
  {
    id: "call-out-003",
    direction: "outbound",
    contactName: "Pacific Coast Hospital SW",
    phone: "+1 (831) 555-0189",
    purpose: "Demo follow-up with discharge planner",
    campaign: "Discharge planner outreach",
    status: "ringing",
    agentId: "agent-02",
    startedAt: new Date(Date.now() - 8_000).toISOString(),
    endedAt: null,
    durationSec: null,
    sentiment: null,
    transcriptPreview: null,
  },
  {
    id: "call-out-004",
    direction: "outbound",
    contactName: "Valley Post-Acute",
    phone: "+1 (408) 555-0120",
    purpose: "Weekly open-bed survey",
    campaign: "Facility capacity check-ins",
    status: "completed",
    agentId: "agent-02",
    startedAt: new Date(Date.now() - 5_400_000).toISOString(),
    endedAt: new Date(Date.now() - 5_220_000).toISOString(),
    durationSec: 204,
    sentiment: "positive",
    transcriptPreview: "Facility reported 3 open short-stay beds and accepted new referral.",
  },
  {
    id: "call-out-005",
    direction: "outbound",
    contactName: "Coastal Recovery Center",
    phone: "+1 (707) 555-0155",
    purpose: "Capacity check — failed connect",
    campaign: "Facility capacity check-ins",
    status: "failed",
    agentId: null,
    startedAt: new Date(Date.now() - 9_000_000).toISOString(),
    endedAt: new Date(Date.now() - 8_970_000).toISOString(),
    durationSec: 0,
    sentiment: null,
    transcriptPreview: "Carrier busy / no answer after 4 rings.",
  },
  {
    id: "call-out-006",
    direction: "outbound",
    contactName: "Northside Transitional Care",
    phone: "+1 (415) 555-0190",
    purpose: "Confirm weekend intake hours",
    campaign: "Facility capacity check-ins",
    status: "queued",
    agentId: null,
    startedAt: new Date(Date.now() + 18_000).toISOString(),
    endedAt: null,
    durationSec: null,
    sentiment: null,
    transcriptPreview: null,
  },
];

export const INITIAL_LOGS: DialingLog[] = [
  {
    id: "dlog-001",
    callId: "call-in-001",
    message: "Inbound connected · Avery Chen · Sunrise Rehab",
    timestamp: new Date(Date.now() - 95_000).toISOString(),
    tone: "success",
  },
  {
    id: "dlog-002",
    callId: "call-out-002",
    message: "Outbound connected · Morgan Lee · Bay Area Memory Care",
    timestamp: new Date(Date.now() - 140_000).toISOString(),
    tone: "success",
  },
  {
    id: "dlog-003",
    callId: "call-in-002",
    message: "Inbound queued · Metro General Discharge",
    timestamp: new Date(Date.now() - 18_000).toISOString(),
    tone: "info",
  },
  {
    id: "dlog-004",
    callId: "call-out-003",
    message: "Outbound ringing · Pacific Coast Hospital SW",
    timestamp: new Date(Date.now() - 8_000).toISOString(),
    tone: "info",
  },
];
