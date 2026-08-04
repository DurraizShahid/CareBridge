import type { SocialPlatform } from "@/components/marketing/social-platform-icons";

export type { SocialPlatform };

export type PostStatus = "draft" | "scheduled" | "posting" | "posted" | "failed";

export interface MarketingPost {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  platforms: SocialPlatform[];
  status: PostStatus;
  scheduledAt: string;
  postedAt: string | null;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  } | null;
  campaign: string;
  leadGenUrl?: string;
}

export interface AutomationLog {
  id: string;
  postId: string;
  message: string;
  timestamp: string;
  tone: "info" | "success" | "warning";
}

export interface SampleLead {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  orgType: "hospital" | "facility";
  interest: string;
  source: string;
  createdAt: string;
  status: "new" | "contacted" | "qualified";
}

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
};

export const LEAD_GEN_PATH = "/lead";

export const SAMPLE_POSTS: MarketingPost[] = [
  {
    id: "mp-001",
    title: "Connected care. Better outcomes.",
    body: "Bring hospitals, facilities, social workers and care teams onto one coordinated platform. Care coordination, reimagined.",
    imageUrl: "/social-media/01_connected_care.png",
    platforms: ["linkedin", "x", "facebook"],
    status: "posted",
    scheduledAt: "2026-08-02T14:00:00.000Z",
    postedAt: "2026-08-02T14:00:12.000Z",
    engagement: { likes: 142, comments: 18, shares: 36 },
    campaign: "Brand Awareness",
    leadGenUrl: LEAD_GEN_PATH,
  },
  {
    id: "mp-002",
    title: "Still coordinating placements through calls and spreadsheets?",
    body: "Fragmented updates create delays, repeated follow-ups and blind spots. Replace the old way with one shared CareBridge workflow.",
    imageUrl: "/social-media/02_calls_to_connected_workflow.png",
    platforms: ["linkedin", "facebook"],
    status: "posted",
    scheduledAt: "2026-08-03T09:30:00.000Z",
    postedAt: "2026-08-03T09:30:08.000Z",
    engagement: { likes: 97, comments: 11, shares: 22 },
    campaign: "Problem / Solution",
    leadGenUrl: LEAD_GEN_PATH,
  },
  {
    id: "mp-003",
    title: "From referral to placement — without losing the thread.",
    body: "Every update, document and decision stays connected to the patient journey. One connected workflow for every stakeholder.",
    imageUrl: "/social-media/03_referral_to_placement.png",
    platforms: ["linkedin", "instagram"],
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 8_000).toISOString(),
    postedAt: null,
    engagement: null,
    campaign: "Product Workflow",
    leadGenUrl: LEAD_GEN_PATH,
  },
  {
    id: "mp-004",
    title: "Know where care is available — before making another call.",
    body: "Search facilities, compare requirements and track availability in one place. Real-time capacity for discharge teams.",
    imageUrl: "/social-media/04_real_time_capacity.png",
    platforms: ["linkedin", "x", "facebook"],
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 18_000).toISOString(),
    postedAt: null,
    engagement: null,
    campaign: "Capacity Visibility",
    leadGenUrl: LEAD_GEN_PATH,
  },
  {
    id: "mp-005",
    title: "Less admin. More care.",
    body: "Automate routine coordination while keeping people in control — missing notes, insurance updates, and placement status in one overview.",
    imageUrl: "/social-media/05_less_admin_more_care.png",
    platforms: ["linkedin", "instagram"],
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 28_000).toISOString(),
    postedAt: null,
    engagement: null,
    campaign: "Productivity",
    leadGenUrl: LEAD_GEN_PATH,
  },
  {
    id: "mp-006",
    title: "Hospitals, facilities and care teams — finally working from the same picture.",
    body: "Built for the whole network: referral intake, care coordination, capacity updates, clinical review, family visibility, and leadership insights.",
    imageUrl: "/social-media/06_whole_care_network.png",
    platforms: ["linkedin", "x"],
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 40_000).toISOString(),
    postedAt: null,
    engagement: null,
    campaign: "Network Story",
    leadGenUrl: LEAD_GEN_PATH,
  },
  {
    id: "mp-007",
    title: "Smarter assistance. Human decisions.",
    body: "CareBridge helps surface next steps, missing information and urgent cases — while your team remains in control.",
    imageUrl: "/social-media/07_ai_assisted_coordination.png",
    platforms: ["linkedin", "x", "instagram"],
    status: "draft",
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
    postedAt: null,
    engagement: null,
    campaign: "AI Assist",
    leadGenUrl: LEAD_GEN_PATH,
  },
  {
    id: "mp-008",
    title: "Ready to modernize care coordination?",
    body: "Turn fragmented placement workflows into one connected experience. Schedule a CareBridge demo.",
    imageUrl: "/social-media/08_demo_call_to_action.png",
    platforms: ["linkedin", "facebook", "x", "instagram"],
    status: "draft",
    scheduledAt: new Date(Date.now() + 172_800_000).toISOString(),
    postedAt: null,
    engagement: null,
    campaign: "Demo CTA",
    leadGenUrl: LEAD_GEN_PATH,
  },
];

export const INITIAL_LOGS: AutomationLog[] = [
  {
    id: "log-001",
    postId: "mp-001",
    message: "Posted to LinkedIn, X, and Facebook · Brand Awareness",
    timestamp: "2026-08-02T14:00:12.000Z",
    tone: "success",
  },
  {
    id: "log-002",
    postId: "mp-002",
    message: "Posted to LinkedIn and Facebook · Problem / Solution",
    timestamp: "2026-08-03T09:30:08.000Z",
    tone: "success",
  },
  {
    id: "log-003",
    postId: "mp-003",
    message: "Queued for auto-publish · Product Workflow",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    tone: "info",
  },
];

export const SAMPLE_LEADS: SampleLead[] = [
  {
    id: "lead-001",
    name: "Maya Chen",
    email: "maya.chen@riversidehealth.org",
    organization: "Riverside Health System",
    role: "Director of Care Transitions",
    orgType: "hospital",
    interest: "Replace call-and-spreadsheet placement workflows",
    source: "LinkedIn · Brand Awareness",
    createdAt: "2026-08-02T15:12:00.000Z",
    status: "qualified",
  },
  {
    id: "lead-002",
    name: "Jordan Blake",
    email: "jblake@oakridgecare.com",
    organization: "Oakridge Post-Acute",
    role: "Facility Administrator",
    orgType: "facility",
    interest: "Real-time capacity visibility in the partner network",
    source: "Facebook · Problem / Solution",
    createdAt: "2026-08-03T10:05:00.000Z",
    status: "new",
  },
  {
    id: "lead-003",
    name: "Priya Nair",
    email: "priya.nair@metrodischarge.org",
    organization: "Metro Discharge Collaborative",
    role: "Social Work Manager",
    orgType: "hospital",
    interest: "Demo for referral-to-placement workflow + AI assist",
    source: "Lead page · Demo CTA",
    createdAt: "2026-08-03T16:40:00.000Z",
    status: "contacted",
  },
];
