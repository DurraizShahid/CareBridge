import { calculateFacilityScore, searchFacilities } from "@/lib/data-access";
import { listReferralCandidates } from "@/lib/referrals";
import type { CareLevel, Facility } from "@/types";
import type { CareLevel as PrismaCareLevel } from "@/generated/prisma/client";

export interface ParsedPatientInput {
  careLevel?: CareLevel;
  careLevelLabel?: string;
  location?: string;
  insurance?: string;
  age?: number;
  conditions?: string[];
  raw: string;
  isDischargeInquiry?: boolean;
}

export interface PatientInfo {
  careLevel?: CareLevel | string;
  careLevelLabel?: string;
  location?: string;
  insurance?: string;
  age?: number;
  conditions?: string[];
  raw?: string;
}

export interface ConversationState {
  careLevel?: CareLevel;
  careLevelLabel?: string;
  location?: string;
  insurance?: string;
  age?: number;
  conditions?: string[];
}

export interface RankedFacility extends Facility {
  score: number;
  openBeds: number;
  matchReasons: string[];
  hasTour: boolean;
}

const CARE_LEVEL_CONFIG: Array<{
  careLevel: CareLevel;
  label: string;
  keywords: RegExp[];
}> = [
  {
    careLevel: "skilled-nursing",
    label: "Skilled Nursing (SNF)",
    keywords: [/\bskilled\s+nursing\b/i, /\bsnf\b/i, /\bnursing\s+home\b/i],
  },
  {
    careLevel: "memory-care",
    label: "Memory Care",
    keywords: [/\bmemory\s+care\b/i, /\bdementia\b/i, /\balzheimer(?:'s)?\b/i, /\bmemory\s+unit\b/i],
  },
  {
    careLevel: "rehabilitation",
    label: "Short-Stay Rehabilitation",
    keywords: [
      /\b(?:short[- ]stay\s+)?rehab(?:ilitation)?\b/i,
      /\bphysical\s+therapy\b/i,
      /\boccupational\s+therapy\b/i,
      /\bpt\b/i,
      /\bot\b/i,
      /\bstroke\s+recovery\b/i,
    ],
  },
  {
    careLevel: "assisted-living",
    label: "Assisted Living",
    keywords: [/\bassisted\s+living\b/i, /\balf\b/i],
  },
  {
    careLevel: "hospice",
    label: "Hospice",
    keywords: [/\bhospice\b/i, /\bpalliative(?:\s+care)?\b/i, /\bend[- ]of[- ]life\b/i],
  },
  {
    careLevel: "independent-living",
    label: "Independent Living",
    keywords: [/\bindependent\s+living\b/i],
  },
];

const KNOWN_CITIES = [
  "Houston",
  "Dallas",
  "Austin",
  "San Antonio",
  "Fort Worth",
  "El Paso",
  "Arlington",
  "Corpus Christi",
  "Plano",
  "Lubbock",
  "Laredo",
  "Irving",
  "Garland",
  "Frisco",
  "McKinney",
  "Grand Prairie",
  "Amarillo",
  "Brownsville",
  "Killeen",
  "Pasadena",
  "Mesquite",
  "McAllen",
  "Carrollton",
  "Midland",
  "Waco",
  "Denton",
  "Abilene",
  "Odessa",
  "Beaumont",
  "Round Rock",
  "The Woodlands",
  "Richardson",
  "Pearland",
  "College Station",
  "Sugar Land",
  "Lewisville",
  "League City",
  "Tyler",
  "Allen",
  "Bedford",
  "San Angelo",
  "Edinburg",
  "Conroe",
  "Bryan",
  "Mission",
  "New Braunfels",
  "Longview",
  "Pharr",
  "Flower Mound",
  "Baytown",
  "Temple",
  "Missouri City",
  "North Richland Hills",
  "Harlingen",
  "Victoria",
  "Mansfield",
  "Cedar Park",
  "Rowlett",
  "Portland",
  "Beaverton",
  "Gresham",
];

const CONDITION_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Hip fracture", pattern: /\b(?:hip\s+fracture|femur\s+fracture|broken\s+hip)\b/i },
  { label: "ORIF surgery", pattern: /\borif\b/i },
  { label: "Stroke recovery", pattern: /\b(?:post[- ]stroke|stroke(?:\s+recovery)?|cva|cerebrovascular\s+accident)\b/i },
  { label: "Weakness", pattern: /\b(?:(?:left|right)[- ]side(?:d)?\s+weakness|hemiparesis|mobility\s+weakness)\b/i },
  { label: "Alzheimer's disease", pattern: /\balzheimer(?:'s)?\b/i },
  { label: "Dementia", pattern: /\bdementia\b/i },
  { label: "Type 2 diabetes", pattern: /\btype\s+2\s+diabetes\b/i },
  { label: "Diabetes", pattern: /\b(?:diabetes|diabetic)\b/i },
  { label: "Hypertension", pattern: /\b(?:hypertension|high\s+blood\s+pressure|htn)\b/i },
  { label: "Heart failure", pattern: /\b(?:congestive\s+heart\s+failure|heart\s+failure|chf)\b/i },
  { label: "COPD", pattern: /\b(?:copd|chronic\s+obstructive|emphysema)\b/i },
  { label: "Wound care", pattern: /\b(?:wound(?:\s+care)?|pressure\s+ulcer|decubitus)\b/i },
  { label: "Joint replacement", pattern: /\b(?:joint\s+replacement|knee\s+replacement|hip\s+replacement)\b/i },
  { label: "Parkinson's", pattern: /\bparkinson(?:'s)?\b/i },
  { label: "Fall history", pattern: /\b(?:fall(?:\s+history|\s+risk)?)\b/i },
];

const PRISMA_CARE_LEVELS: PrismaCareLevel[] = [
  "independent_living",
  "assisted_living",
  "skilled_nursing",
  "long_term_care",
  "rehabilitation",
  "home_health",
  "hospice",
  "memory_care",
];

function toPrismaCare(careLevel: string): PrismaCareLevel {
  return careLevel.replace(/-/g, "_") as PrismaCareLevel;
}

export function getCareLevelLabel(careLevel: string): string {
  const cfg = CARE_LEVEL_CONFIG.find((c) => c.careLevel === careLevel);
  if (cfg) return cfg.label;
  return careLevel
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const DISCHARGE_INQUIRY_PATTERNS = [
  /\bhow\s+(?:do|can)\s+(?:i|we|you)\s+discharge\b/i,
  /\bhow\s+to\s+discharge\b/i,
  /\bdischarge\s+(?:a\s+|the\s+)?patient\b/i,
  /\bdischarge\s+(?:process|workflow|steps|procedure|protocol|guidance|guide)\b/i,
  /\bsteps\s+to\s+discharge\b/i,
  /\bwhere\s+(?:do|can)\s+(?:i|we)\s+discharge\b/i,
  /\bcan\s+(?:you|i|we)\s+discharge\b/i,
];

export function isDischargeInquiry(text: string): boolean {
  return DISCHARGE_INQUIRY_PATTERNS.some((pattern) => pattern.test(text));
}

export const DISCHARGE_GUIDANCE_RESPONSE = `To discharge a patient in CareBridge, follow these steps:

1. **Go to the Patient's Profile**: Navigate to **Patients** from the sidebar or dashboard and select the patient's record.
2. **Click "Discharge Patient"**: On the patient detail page, click the **Discharge Patient** button in the header action bar (available when the patient's status is *Placed* or *Ready for Discharge*).
3. **Confirm the Discharge**: Review the confirmation dialog details (which notes that confirming will close the active placement, free the facility bed, and mark the patient as discharged), then click **Confirm Discharge**.

*Note: Discharges cannot be executed directly within chat. Please navigate to the patient profile to complete the discharge.*
<!--suggestions-->["View Patients", "Check Placements", "Find Facility Match"]<!--/suggestions-->`;

/**
 * 1. parsePatientInput(text: string)
 * Extract structured info from free text using keyword matching.
 */
export function parsePatientInput(text: string): ParsedPatientInput {
  let careLevel: CareLevel | undefined;
  let careLevelLabel: string | undefined;

  for (const cfg of CARE_LEVEL_CONFIG) {
    if (cfg.keywords.some((k) => k.test(text))) {
      careLevel = cfg.careLevel;
      careLevelLabel = cfg.label;
      break;
    }
  }

  let location: string | undefined;
  for (const city of KNOWN_CITIES) {
    const cityRegex = new RegExp(`\\b${city.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (cityRegex.test(text)) {
      location = city;
      break;
    }
  }

  let insurance: string | undefined;
  if (/\b(?:medicare(?:\s+advantage)?|part\s+[ab])\b/i.test(text)) {
    insurance = "Medicare";
  } else if (/\b(?:medicaid|star\+?plus)\b/i.test(text)) {
    insurance = "Medicaid";
  } else if (/\b(?:va\b|veterans?(?:\s+affairs)?|tricare)\b/i.test(text)) {
    insurance = "VA";
  } else if (
    /\b(?:private(?:\s+pay)?|commercial|aetna|blue\s*cross|bcbs|cigna|humana|united(?:\s*health(?:care)?)?|uhc|providence)\b/i.test(
      text,
    )
  ) {
    insurance = "Private";
  }

  let age: number | undefined;
  const ageMatch = text.match(/\b(\d{1,3})\s*(?:-|–|\s)?(?:years?[\s-]?old|yo)\b/i);
  if (ageMatch) {
    const parsedAge = parseInt(ageMatch[1], 10);
    if (parsedAge > 0 && parsedAge <= 125) {
      age = parsedAge;
    }
  }

  const conditions: string[] = [];
  for (const item of CONDITION_PATTERNS) {
    if (item.pattern.test(text)) {
      if (item.label === "Diabetes" && conditions.includes("Type 2 diabetes")) continue;
      if (item.label === "Dementia" && conditions.includes("Alzheimer's disease")) continue;
      if (!conditions.includes(item.label)) {
        conditions.push(item.label);
      }
    }
  }

  return {
    careLevel,
    careLevelLabel,
    location,
    insurance,
    age,
    conditions: conditions.length > 0 ? conditions : undefined,
    raw: text,
    isDischargeInquiry: isDischargeInquiry(text) || undefined,
  };
}

export function buildConversationState(messages: { role: string; content: string }[]): ConversationState {
  const state: ConversationState = {};
  for (const msg of messages) {
    if (msg.role === "user") {
      const parsed = parsePatientInput(msg.content);
      if (parsed.careLevel) {
        state.careLevel = parsed.careLevel;
        state.careLevelLabel = parsed.careLevelLabel;
      }
      if (parsed.location) state.location = parsed.location;
      if (parsed.insurance) state.insurance = parsed.insurance;
      if (parsed.age) state.age = parsed.age;
      if (parsed.conditions && parsed.conditions.length > 0) {
        state.conditions = Array.from(new Set([...(state.conditions ?? []), ...parsed.conditions]));
      }
    }
  }
  return state;
}

function buildMatchReasons(facility: Facility, patientInfo: PatientInfo, openBeds: number): string[] {
  const reasons: string[] = [];

  // Open beds breakdown
  if (openBeds > 0) {
    reasons.push(`${openBeds} open ${openBeds === 1 ? "bed" : "beds"}`);
  } else if (facility.waitlistDays !== undefined && facility.waitlistDays !== null && facility.waitlistDays > 0) {
    reasons.push(`waitlist (~${facility.waitlistDays} days)`);
  } else {
    reasons.push("waitlist intake");
  }

  // Insurance breakdown
  if (patientInfo.insurance) {
    reasons.push(`accepts ${patientInfo.insurance}`);
  } else if (facility.acceptsMedicare) {
    reasons.push("accepts Medicare");
  } else if (facility.insuranceAccepted?.length) {
    reasons.push(`accepts ${facility.insuranceAccepted.slice(0, 2).join(", ")}`);
  }

  // Distance / Location breakdown
  const facilityCity = facility.address?.city;
  if (patientInfo.location && facilityCity && facilityCity.toLowerCase() === patientInfo.location.toLowerCase()) {
    reasons.push(`Located in ${facilityCity}`);
  } else if (facilityCity) {
    reasons.push(`Serving the ${facilityCity} area`);
  }

  // Rating breakdown
  reasons.push(`${facility.rating.toFixed(1)} star rating`);

  // Clinical condition / specialty matching
  if (patientInfo.conditions?.length && facility.specialties?.length) {
    const condWords = patientInfo.conditions.flatMap((c) => c.toLowerCase().split(/\s+/));
    const matchedSpecialty = facility.specialties.find((s) => {
      const sLower = s.toLowerCase();
      return condWords.some((w) => w.length > 3 && sLower.includes(w));
    });
    if (matchedSpecialty) {
      reasons.push(`specialized in ${matchedSpecialty.toLowerCase()}`);
    }
  }

  return reasons;
}

/**
 * 2. rankFacilities(patientInfo)
 * Use calculateFacilityScore from src/lib/data-access.ts and listReferralCandidates from src/lib/referrals.ts.
 * Do not reimplement scoring, call the real functions.
 */
export async function rankFacilities(patientInfo: PatientInfo): Promise<RankedFacility[]> {
  const careLevelKebab = patientInfo.careLevel as CareLevel | undefined;
  const prismaCareLevel = careLevelKebab ? toPrismaCare(careLevelKebab) : undefined;

  let referralCandidateIds: string[] | null = null;
  if (prismaCareLevel && PRISMA_CARE_LEVELS.includes(prismaCareLevel)) {
    try {
      const candidates = await listReferralCandidates(prismaCareLevel, [], {
        patient: {
          careLevelRequired: prismaCareLevel,
          insurance: patientInfo.insurance
            ? [{ type: patientInfo.insurance, provider: patientInfo.insurance }]
            : undefined,
        },
        preferredLocation: patientInfo.location ? { city: patientInfo.location } : undefined,
      });
      if (candidates && candidates.length > 0) {
        referralCandidateIds = candidates.map((c) => c.id);
      }
    } catch {
      // Graceful fallback when outside hospital org context or in testing environments
      referralCandidateIds = null;
    }
  }

  let candidates = await searchFacilities({
    careLevelsOffered: careLevelKebab ? [careLevelKebab] : undefined,
    hasAvailability: true,
  });

  if (candidates.length === 0) {
    candidates = await searchFacilities({
      hasAvailability: true,
    });
  }

  const facilitiesToScore =
    referralCandidateIds && referralCandidateIds.length > 0
      ? candidates.filter((f) => referralCandidateIds!.includes(f.id))
      : candidates;

  const targetFacilities = facilitiesToScore.length > 0 ? facilitiesToScore : candidates;

  const patient = {
    careLevelRequired: patientInfo.careLevel ?? "skilled-nursing",
    insurance: patientInfo.insurance
      ? [{ type: patientInfo.insurance, provider: patientInfo.insurance }]
      : undefined,
  };
  const preferredLocation = patientInfo.location ? { city: patientInfo.location } : undefined;

  const scored: RankedFacility[] = targetFacilities
    .map((f) => {
      const score = calculateFacilityScore(
        {
          ...f,
          careLevelsOffered: f.careLevelsOffered.map(toPrismaCare),
          waitlistDays: f.waitlistDays ?? null,
        },
        patient,
        preferredLocation,
      );
      const openBeds = Math.max(0, f.capacity - f.currentOccupancy);
      const matchReasons = buildMatchReasons(f, patientInfo, openBeds);
      return {
        ...f,
        score,
        openBeds,
        matchReasons,
        hasTour: true,
      };
    })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * 3. generateResponse(parsed, facilities, conversationState)
 * Build a natural response with clinical, warm tone.
 */
export function generateResponse(
  parsed: ParsedPatientInput,
  facilities: RankedFacility[],
  conversationState?: ConversationState,
): string {
  if (parsed.isDischargeInquiry || isDischargeInquiry(parsed.raw)) {
    return DISCHARGE_GUIDANCE_RESPONSE;
  }

  const activeCareLevel = parsed.careLevel ?? conversationState?.careLevel;
  const activeCareLevelLabel =
    parsed.careLevelLabel ??
    conversationState?.careLevelLabel ??
    (activeCareLevel ? getCareLevelLabel(activeCareLevel) : undefined);
  const activeLocation = parsed.location ?? conversationState?.location;
  const activeInsurance = parsed.insurance ?? conversationState?.insurance;
  const activeAge = parsed.age ?? conversationState?.age;
  const activeConditions =
    parsed.conditions && parsed.conditions.length > 0
      ? parsed.conditions
      : conversationState?.conditions ?? [];

  // 1. Care level missing: ask what type of care they need, list options conversationally
  if (!activeCareLevel) {
    return `I can help match and coordinate placement for your patient across our facility network. To narrow down the right options, what level of care do they need?

We can coordinate:
- **Skilled Nursing (SNF)**: 24/7 clinical nursing, IV therapy, wound care, or post-surgical monitoring.
- **Short-Stay Rehabilitation**: Intensive physical, occupational, and speech therapy for stroke, fracture, or surgical recovery.
- **Memory Care**: Secured, specialized communities designed for Alzheimer's or dementia.
- **Assisted Living**: Daily living assistance, medication administration, and routine support.
- **Hospice**: Comprehensive palliative and comfort care.

Let me know which setting fits best, or describe their diagnoses and mobility and I will recommend the right care level.
<!--suggestions-->["Skilled nursing", "Short-stay rehab", "Memory care"]<!--/suggestions-->`;
  }

  // 2. Location missing: ask which city
  if (!activeLocation) {
    const clinicalNotes: string[] = [];
    if (activeAge) clinicalNotes.push(`${activeAge}-year-old`);
    if (activeConditions.length > 0) clinicalNotes.push(`recovering from ${activeConditions.slice(0, 2).join(", ")}`);
    if (activeInsurance) clinicalNotes.push(`with ${activeInsurance}`);
    const clinicalContext = clinicalNotes.length > 0 ? ` for a ${clinicalNotes.join(" patient ")}` : "";

    return `I have noted the need for **${activeCareLevelLabel ?? "appropriate care"}**${clinicalContext}.

Which city or metro area should we focus the search on?

Our network has active facility partnerships across **Austin**, **Houston**, **Dallas**, and **San Antonio**, among other Texas communities. Once you provide the city, I will pull current bed availability and rank the best-matched options.
<!--suggestions-->["Austin", "Houston", "Dallas"]<!--/suggestions-->`;
  }

  // 3. Enough info: present top 3 facilities with why each matches
  if (facilities.length === 0) {
    return `I searched our network for **${activeCareLevelLabel}** facilities in **${activeLocation}**${
      activeInsurance ? ` accepting ${activeInsurance}` : ""
    }, but there are currently no facilities with open bed availability matching those exact criteria.

Would you like to expand the search radius to nearby communities, or check facilities with upcoming availability?
<!--suggestions-->["Expand search radius", "Check nearby cities", "Modify insurance"]<!--/suggestions-->`;
  }

  const top3 = facilities.slice(0, 3);
  const patientSummaryParts: string[] = [];
  if (activeAge) patientSummaryParts.push(`a ${activeAge}-year-old`);
  if (activeConditions.length > 0) {
    patientSummaryParts.push(`recovering from ${activeConditions.slice(0, 2).join(" and ")}`);
  }
  if (activeCareLevelLabel) patientSummaryParts.push(`requiring **${activeCareLevelLabel}**`);
  if (activeLocation) patientSummaryParts.push(`in **${activeLocation}**`);
  if (activeInsurance) patientSummaryParts.push(`with **${activeInsurance}**`);

  const intro =
    patientSummaryParts.length > 0
      ? `Based on clinical needs for ${patientSummaryParts.join(
          " ",
        )}, I've evaluated current bed availability and quality metrics across our network. Here are the top ${
          top3.length === 1 ? "recommended facility" : `${top3.length} recommended facilities`
        }:`
      : `Based on clinical requirements for **${activeCareLevelLabel}** in **${activeLocation}**, here are the top ${
          top3.length === 1 ? "recommended facility" : `${top3.length} recommended facilities`
        } in our network:`;

  const facilityList = top3
    .map((f, i) => {
      const city = f.address?.city ?? activeLocation;
      const state = f.address?.state ?? "TX";
      const reasonsText =
        f.matchReasons.length > 0
          ? f.matchReasons.join(", ")
          : `${f.openBeds} open beds, ${f.rating.toFixed(1)} star rating`;
      return `${i + 1}. **${f.name}** (${city}, ${state})\n   - **Why it matches**: ${reasonsText}.`;
    })
    .join("\n\n");

  return `${intro}

${facilityList}

Each facility card below includes a 3D tour link so you and the family can inspect the patient accommodations and therapy areas.

Pick a facility to see the tour, or tell me to refine.
<!--suggestions-->["Refine by insurance", "Check immediate beds", "Change city"]<!--/suggestions-->`;
}
