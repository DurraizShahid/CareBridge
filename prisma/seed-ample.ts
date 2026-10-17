import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
  CareLevel,
  FacilityType,
  PatientStatus,
  PlacementStatus,
  Priority,
  ReferralStatus,
  UserRole,
} from "../src/generated/prisma/enums";

// ─────────────────────────────────────────────────────────────────────────────
// CareBridge Ample Texas Seed Data
// Realistic clinical scenarios for hospital sales demonstrations in Texas.
// Covers: Houston, Dallas, Austin, San Antonio, Fort Worth, El Paso.
// Deterministic upserts allow safe repeated execution.
// ─────────────────────────────────────────────────────────────────────────────

interface StopDef {
  id: string;
  area: "lobby" | "corridor" | "room";
  label: string;
  description: string;
  highlights: string[];
}

const stop = (
  id: string,
  area: "lobby" | "corridor" | "room",
  label: string,
  description: string,
  highlights: string[],
): StopDef => ({ id, area, label, description, highlights });

export async function seedAmple(prisma: PrismaClient) {
  console.log("🌟 Seeding ample Texas sales demo dataset for CareBridge...\n");

  const date = (month: number, day: number, hour = 12) =>
    new Date(Date.UTC(2026, month - 1, day, hour, 0, 0));

  // ── 1. Organizations ───────────────────────────────────────────────────────
  console.log("  [1/8] Upserting Texas Hospital & Facility Organizations...");

  const organizations = [
    // Hospital health systems
    { id: "org-tx-001", name: "Houston Methodist Health System", slug: "houston-methodist-health", type: "hospital" as const },
    { id: "org-tx-002", name: "UT Southwestern Medical Center", slug: "ut-southwestern-medical", type: "hospital" as const },
    { id: "org-tx-003", name: "St. David's HealthCare Austin", slug: "st-davids-healthcare-austin", type: "hospital" as const },
    { id: "org-tx-004", name: "Methodist Healthcare San Antonio", slug: "methodist-healthcare-san-antonio", type: "hospital" as const },
    // Facility networks
    { id: "org-tx-fac-001", name: "Lone Star Post-Acute Network", slug: "lone-star-post-acute", type: "facility" as const },
    { id: "org-tx-fac-002", name: "Texas Senior Living & Memory Communities", slug: "texas-senior-living-memory", type: "facility" as const },
    { id: "org-tx-fac-003", name: "Alamo Care Alliance", slug: "alamo-care-alliance", type: "facility" as const },
    { id: "org-tx-fac-004", name: "Sun City Rehabilitation & Hospice Group", slug: "sun-city-rehab-hospice", type: "facility" as const },
  ];

  for (const org of organizations) {
    await prisma.organization.upsert({
      where: { id: org.id },
      create: org,
      update: { name: org.name, slug: org.slug, type: org.type },
    });
  }

  // Ensure default base orgs exist if running standalone
  await prisma.organization.upsert({
    where: { id: "org-001" },
    create: { id: "org-001", name: "Mercy General", slug: "mercy-general", type: "hospital" },
    update: {},
  });
  await prisma.organization.upsert({
    where: { id: "org-003" },
    create: { id: "org-003", name: "Juniper Demo Care Network", slug: "juniper-demo-care", type: "facility" },
    update: {},
  });

  // ── 2. Hospitals ───────────────────────────────────────────────────────────
  console.log("  [2/8] Upserting Major Texas Medical Centers...");

  const hospitals = [
    {
      id: "hosp-tx-001",
      name: "Houston Methodist Hospital - Texas Medical Center",
      address: { street: "6565 Fannin St", city: "Houston", state: "TX", zipCode: "77030", county: "Harris" },
      phone: "(713) 790-3311",
      npi: "1487654321",
      organizationId: "org-tx-001",
    },
    {
      id: "hosp-tx-002",
      name: "William P. Clements Jr. University Hospital (UTSW)",
      address: { street: "6201 Harry Hines Blvd", city: "Dallas", state: "TX", zipCode: "75390", county: "Dallas" },
      phone: "(214) 633-4000",
      npi: "1487654322",
      organizationId: "org-tx-002",
    },
    {
      id: "hosp-tx-003",
      name: "Texas Health Harris Methodist Hospital",
      address: { street: "1301 Pennsylvania Ave", city: "Fort Worth", state: "TX", zipCode: "76104", county: "Tarrant" },
      phone: "(817) 250-2000",
      npi: "1487654323",
      organizationId: "org-tx-002",
    },
    {
      id: "hosp-tx-004",
      name: "St. David's Medical Center",
      address: { street: "919 E 32nd St", city: "Austin", state: "TX", zipCode: "78705", county: "Travis" },
      phone: "(512) 544-7111",
      npi: "1487654324",
      organizationId: "org-tx-003",
    },
    {
      id: "hosp-tx-005",
      name: "Methodist Hospital San Antonio",
      address: { street: "7700 Floyd Curl Dr", city: "San Antonio", state: "TX", zipCode: "78229", county: "Bexar" },
      phone: "(210) 575-4000",
      npi: "1487654325",
      organizationId: "org-tx-004",
    },
    {
      id: "hosp-tx-006",
      name: "University Medical Center of El Paso",
      address: { street: "4815 Alameda Ave", city: "El Paso", state: "TX", zipCode: "79905", county: "El Paso" },
      phone: "(915) 544-1200",
      npi: "1487654326",
      organizationId: "org-tx-001",
    },
  ];

  for (const h of hospitals) {
    await prisma.hospital.upsert({
      where: { id: h.id },
      create: h,
      update: h,
    });
  }

  // ── 3. Staff Members ───────────────────────────────────────────────────────
  console.log("  [3/8] Upserting 18 Staff Members across clinical and administrative roles...");

  const staffMembers = [
    // Hospital Discharge Planners & Social Workers
    {
      id: "usr-tx-001",
      email: "elena.vance@methodist.demo.carebridge.example",
      firstName: "Elena",
      lastName: "Vance",
      role: "discharge_planner" as UserRole,
      title: "Lead Discharge Planning Specialist, BSN",
      department: "Discharge Planning & Transitions",
      hospitalId: "hosp-tx-001",
      phone: "(713) 555-0301",
      organizationId: "org-tx-001",
    },
    {
      id: "usr-tx-002",
      email: "marcus.sterling@methodist.demo.carebridge.example",
      firstName: "Marcus",
      lastName: "Sterling",
      role: "social_worker" as UserRole,
      title: "Senior Medical Social Worker, LCSW",
      department: "Social Services",
      hospitalId: "hosp-tx-001",
      phone: "(713) 555-0302",
      organizationId: "org-tx-001",
    },
    {
      id: "usr-tx-003",
      email: "gabriela.torres@utsw.demo.carebridge.example",
      firstName: "Gabriela",
      lastName: "Torres",
      role: "discharge_planner" as UserRole,
      title: "Complex Case Discharge Coordinator, RN",
      department: "Care Coordination",
      hospitalId: "hosp-tx-002",
      phone: "(214) 555-0303",
      organizationId: "org-tx-002",
    },
    {
      id: "usr-tx-004",
      email: "david.miller@utsw.demo.carebridge.example",
      firstName: "David",
      lastName: "Miller",
      role: "social_worker" as UserRole,
      title: "Transitional Care Social Worker, LCSW",
      department: "Care Transitions",
      hospitalId: "hosp-tx-002",
      phone: "(214) 555-0304",
      organizationId: "org-tx-002",
    },
    {
      id: "usr-tx-005",
      email: "sarah.jenkins@stdavids.demo.carebridge.example",
      firstName: "Sarah",
      lastName: "Jenkins",
      role: "discharge_planner" as UserRole,
      title: "Director of Patient Placement Navigation, RN CCM",
      department: "Patient Navigation",
      hospitalId: "hosp-tx-004",
      phone: "(512) 555-0305",
      organizationId: "org-tx-003",
    },
    {
      id: "usr-tx-006",
      email: "roberto.mendez@stdavids.demo.carebridge.example",
      firstName: "Roberto",
      lastName: "Mendez",
      role: "social_worker" as UserRole,
      title: "Clinical Medical Social Worker, LMSW",
      department: "Inpatient Care Management",
      hospitalId: "hosp-tx-004",
      phone: "(512) 555-0306",
      organizationId: "org-tx-003",
    },
    {
      id: "usr-tx-007",
      email: "kimberly.washington@methodistsa.demo.carebridge.example",
      firstName: "Kimberly",
      lastName: "Washington",
      role: "discharge_planner" as UserRole,
      title: "Post-Acute Placement Coordinator, RN",
      department: "Discharge Planning",
      hospitalId: "hosp-tx-005",
      phone: "(210) 555-0307",
      organizationId: "org-tx-004",
    },
    {
      id: "usr-tx-008",
      email: "laura.cisneros@umcelpaso.demo.carebridge.example",
      firstName: "Laura",
      lastName: "Cisneros",
      role: "discharge_planner" as UserRole,
      title: "Bilingual Patient Navigator, LCSW",
      department: "Transitional Care Management",
      hospitalId: "hosp-tx-006",
      phone: "(915) 555-0308",
      organizationId: "org-tx-001",
    },
    {
      id: "usr-tx-009",
      email: "brandon.cho@utsw.demo.carebridge.example",
      firstName: "Brandon",
      lastName: "Cho",
      role: "administrator" as UserRole,
      title: "Hospital Discharge Operations Administrator, MHA",
      department: "Clinical Operations",
      hospitalId: "hosp-tx-002",
      phone: "(214) 555-0309",
      organizationId: "org-tx-002",
    },
    // Facility Referral Coordinators & Admissions Directors
    {
      id: "usr-tx-010",
      email: "p.moore-cruz@vosswood.demo.carebridge.example",
      firstName: "Patricia",
      lastName: "Moore-Cruz",
      role: "facility_coordinator" as UserRole,
      title: "Admissions & Referral Coordinator",
      department: "Admissions & Intake",
      hospitalId: "fac-tx-001",
      phone: "(713) 555-0310",
      organizationId: "org-tx-fac-001",
    },
    {
      id: "usr-tx-011",
      email: "jackson.vance@vosswood.demo.carebridge.example",
      firstName: "Jackson",
      lastName: "Vance",
      role: "administrator" as UserRole,
      title: "Facility Administrator & Executive Director",
      department: "Executive Office",
      hospitalId: "fac-tx-001",
      phone: "(713) 555-0311",
      organizationId: "org-tx-fac-001",
    },
    {
      id: "usr-tx-012",
      email: "maricela.solis@belmont.demo.carebridge.example",
      firstName: "Maricela",
      lastName: "Solis",
      role: "facility_coordinator" as UserRole,
      title: "Referral Intake Coordinator",
      department: "Care Transitions",
      hospitalId: "fac-tx-006",
      phone: "(214) 555-0312",
      organizationId: "org-tx-fac-002",
    },
    {
      id: "usr-tx-013",
      email: "douglas.faulkner@belmont.demo.carebridge.example",
      firstName: "Douglas",
      lastName: "Faulkner",
      role: "administrator" as UserRole,
      title: "Executive Director & Community Administrator",
      department: "Administration",
      hospitalId: "fac-tx-006",
      phone: "(214) 555-0313",
      organizationId: "org-tx-fac-002",
    },
    {
      id: "usr-tx-014",
      email: "rachel.adams@westlakecare.demo.carebridge.example",
      firstName: "Rachel",
      lastName: "Adams",
      role: "facility_coordinator" as UserRole,
      title: "Clinical Referral Liaison, RN",
      department: "Admissions",
      hospitalId: "fac-tx-011",
      phone: "(512) 555-0314",
      organizationId: "org-tx-fac-001",
    },
    {
      id: "usr-tx-015",
      email: "carlos.quintana@heightshuebner.demo.carebridge.example",
      firstName: "Carlos",
      lastName: "Quintana",
      role: "administrator" as UserRole,
      title: "Licensed Nursing Facility Administrator (LNFA)",
      department: "Administration",
      hospitalId: "fac-tx-016",
      phone: "(210) 555-0315",
      organizationId: "org-tx-fac-003",
    },
    {
      id: "usr-tx-016",
      email: "alicia.benavides@warmsprings.demo.carebridge.example",
      firstName: "Alicia",
      lastName: "Benavides",
      role: "facility_coordinator" as UserRole,
      title: "Inpatient Rehab Referral Coordinator",
      department: "Admissions",
      hospitalId: "fac-tx-018",
      phone: "(210) 555-0316",
      organizationId: "org-tx-fac-003",
    },
    {
      id: "usr-tx-017",
      email: "teresa.holt@mirabella.demo.carebridge.example",
      firstName: "Teresa",
      lastName: "Holt",
      role: "facility_coordinator" as UserRole,
      title: "Senior Living Admissions Coordinator",
      department: "Resident Admissions",
      hospitalId: "fac-tx-021",
      phone: "(817) 555-0317",
      organizationId: "org-tx-fac-002",
    },
    {
      id: "usr-tx-018",
      email: "hector.delarosa@sunridge.demo.carebridge.example",
      firstName: "Hector",
      lastName: "De La Rosa",
      role: "facility_coordinator" as UserRole,
      title: "Director of Admissions & Patient Placement",
      department: "Admissions",
      hospitalId: "fac-tx-025",
      phone: "(915) 555-0318",
      organizationId: "org-tx-fac-004",
    },
  ];

  for (const s of staffMembers) {
    await prisma.user.upsert({
      where: { id: s.id },
      create: s,
      update: s,
    });
  }

  // ── 4. Facilities ──────────────────────────────────────────────────────────
  console.log("  [4/8] Upserting 28 Texas Facilities across 6 metro areas (6 with 3D Tours)...");

  const facilities = [
    // ── HOUSTON (Harris County) ──
    {
      id: "fac-tx-001",
      name: "The Vosswood Healthcare & Rehabilitation Center",
      type: "skilled_nursing_facility" as FacilityType,
      street: "815 S Post Oak Ln", city: "Houston", zipCode: "77056", county: "Harris",
      phone: "(713) 827-0100", email: "admissions@vosswoodcare.demo.carebridge.example",
      website: "https://vosswoodcare.demo.carebridge.example",
      capacity: 110, currentOccupancy: 94, rating: 4.7, reviewsCount: 142, waitlistDays: 2,
      careLevelsOffered: ["skilled_nursing" as CareLevel, "rehabilitation" as CareLevel, "long_term_care" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "UnitedHealthcare", "Private Pay"],
      specialties: ["Post-stroke rehabilitation", "Complex wound care", "IV antibiotic therapy", "Tracheostomy recovery"],
      description: "Premier post-acute skilled nursing and rehabilitation center in the Galleria area offering 24-hour clinical nursing, physical therapy gym, and specialized recovery suites.",
      orgId: "org-tx-fac-001",
      tourConfig: {
        accentColor: "#1e3a8a", wallColor: "#f8fafc", floorColor: "#e2e8f0", roomName: "Private Recovery Suite",
        welcome: "Welcome to The Vosswood, Houston's premier post-acute rehabilitation pavilion.",
        stops: [
          stop("voss-lobby", "lobby", "Grand Gallery Foyer", "Sun-filled reception and concierge desk with dedicated admission intake and family check-in.", ["24/7 Concierge Check-in", "Wheelchair-Accessible Drop-off", "Complimentary Family Beverage Bar"]),
          stop("voss-gym", "corridor", "Therapy Hall & Pavilion", "Direct access to the 3,500 sq ft physical and occupational therapy gym with continuous support handrails.", ["Continuous Handrails", "Zero-Threshold Access", "Gait Training Track"]),
          stop("voss-suite", "room", "Private Recovery Suite", "Spacious post-acute suite equipped with electronic hi-lo bed, headwall oxygen, and private ADA bath.", ["Private En-Suite Bath", "Hospital-Grade Headwall O₂", "Smart Clinical Call System"]),
          stop("voss-garden", "room", "Courtyard Sunroom", "Tranquil solarium overlooking landscaped courtyard for peaceful recovery and family visits.", ["Panoramic Garden View", "Natural Daylighting", "Recliner for Family Stays"]),
        ],
      },
    },
    {
      id: "fac-tx-002",
      name: "Memorial Hermann Memorial City Rehabilitation Hospital",
      type: "rehabilitation_center" as FacilityType,
      street: "920 Frostwood Dr", city: "Houston", zipCode: "77024", county: "Harris",
      phone: "(713) 242-4000", email: "transitions@memorialcity-rehab.demo.carebridge.example",
      website: "https://memorialcity-rehab.demo.carebridge.example",
      capacity: 88, currentOccupancy: 76, rating: 4.8, reviewsCount: 198, waitlistDays: 0,
      careLevelsOffered: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
      insuranceAccepted: ["Medicare", "Blue Cross", "Aetna", "Private Pay", "VA"],
      specialties: ["Orthopedic joint recovery", "Neurological rehab", "Cardiac recovery", "Vestibular rehabilitation"],
      description: "Hospital-adjacent acute rehabilitation facility featuring advanced robotic gait training, dedicated speech/occupational therapy suites, and accelerated discharge pathways.",
      orgId: "org-tx-fac-001",
      tourConfig: null,
    },
    {
      id: "fac-tx-003",
      name: "The Tradition - Buffalo Speedway Memory Care",
      type: "assisted_living" as FacilityType,
      street: "9339 Buffalo Speedway", city: "Houston", zipCode: "77025", county: "Harris",
      phone: "(713) 423-6200", email: "inquiries@tradition-buffalospeedway.demo.carebridge.example",
      website: "https://tradition-buffalospeedway.demo.carebridge.example",
      capacity: 64, currentOccupancy: 58, rating: 4.9, reviewsCount: 86, waitlistDays: 4,
      careLevelsOffered: ["memory_care" as CareLevel, "assisted_living" as CareLevel],
      insuranceAccepted: ["Private Pay", "Long-term care insurance", "VA"],
      specialties: ["Alzheimer's care", "Circadian lighting neighborhoods", "Multi-sensory snoezelen therapy", "Secured courtyard walking paths"],
      description: "Luxury memory-care community designed specifically for cognitive impairment, featuring secure neighborhood pods, Montessori-based programming, and 24-hour dementia care practitioners.",
      orgId: "org-tx-fac-002",
      tourConfig: null,
    },
    {
      id: "fac-tx-004",
      name: "Treemont Assisted Living & Senior Campus",
      type: "assisted_living" as FacilityType,
      street: "2501 Westerland Dr", city: "Houston", zipCode: "77063", county: "Harris",
      phone: "(713) 788-3000", email: "admissions@treemonthouston.demo.carebridge.example",
      website: "https://treemonthouston.demo.carebridge.example",
      capacity: 96, currentOccupancy: 81, rating: 4.2, reviewsCount: 115, waitlistDays: 0,
      careLevelsOffered: ["assisted_living" as CareLevel, "independent_living" as CareLevel],
      insuranceAccepted: ["Private Pay", "Medicaid", "VA", "Blue Cross"],
      specialties: ["Medication administration", "Assistance with daily living (ADLs)", "Diabetic management", "Respite care stays"],
      description: "Established West Houston assisted living community set across 9 wooded acres, providing compassionate personal care, chef-prepared dining, and coordinated physician visits.",
      orgId: "org-tx-fac-002",
      tourConfig: null,
    },
    {
      id: "fac-tx-005",
      name: "Houston Hospice & Palliative Inpatient Care Pavilion",
      type: "hospice" as FacilityType,
      street: "1905 Holcombe Blvd", city: "Houston", zipCode: "77030", county: "Harris",
      phone: "(713) 467-7423", email: "intake@houstonhospice.demo.carebridge.example",
      website: "https://houstonhospice.demo.carebridge.example",
      capacity: 32, currentOccupancy: 26, rating: 4.9, reviewsCount: 94, waitlistDays: 0,
      careLevelsOffered: ["hospice" as CareLevel, "home_health" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Private Pay", "Blue Cross", "VA"],
      specialties: ["Acute symptom management", "Inpatient palliative care", "Family grief counseling", "End-of-life comfort care"],
      description: "Renowned Texas Medical Center nonprofit hospice inpatient unit offering serene private suites overlooking peaceful gardens for intensive symptom control and family support.",
      orgId: "org-tx-fac-004",
      tourConfig: null,
    },

    // ── DALLAS (Dallas County / Metro) ──
    {
      id: "fac-tx-006",
      name: "Belmont Village Senior Living Turtle Creek",
      type: "assisted_living" as FacilityType,
      street: "3535 N Hall St", city: "Dallas", zipCode: "75219", county: "Dallas",
      phone: "(214) 559-5400", email: "concierge@belmont-turtlecreek.demo.carebridge.example",
      website: "https://belmont-turtlecreek.demo.carebridge.example",
      capacity: 75, currentOccupancy: 67, rating: 4.8, reviewsCount: 112, waitlistDays: 5,
      careLevelsOffered: ["assisted_living" as CareLevel, "memory_care" as CareLevel, "independent_living" as CareLevel],
      insuranceAccepted: ["Private Pay", "Long-term care insurance", "Blue Cross"],
      specialties: ["Circle of Friends mild cognitive support", "Licensed nurse 24/7 on-site", "Mobility maintenance", "Executive chef dining"],
      description: "Distinctive Turtle Creek residence blending hospitality with licensed 24/7 nursing and award-winning cognitive enrichment programs.",
      orgId: "org-tx-fac-002",
      tourConfig: {
        accentColor: "#0f766e", wallColor: "#fcfbf9", floorColor: "#ebe6df", roomName: "Turtle Creek Deluxe Studio",
        welcome: "Experience gracious assisted living and specialized cognitive support in the heart of Turtle Creek.",
        stops: [
          stop("belmont-rotunda", "lobby", "Turtle Creek Rotunda", "Stately two-story rotunda featuring concierge desk, grand piano, and fireside seating.", ["24-Hour Front Desk", "Valet Parking for Families", "Fireside Greeting Lounge"]),
          stop("belmont-promenade", "corridor", "Promenade Gallery", "Art-lined hallway connecting dining rooms, wellness center, and residential wings.", ["High-Contrast Wayfinding", "Acoustic Noise Buffering", "Rest Alcoves Every 30 Feet"]),
          stop("belmont-studio", "room", "Turtle Creek Deluxe Studio", "Elegantly appointed residence with floor-to-ceiling windows, emergency alert system, and kitchenette.", ["Emergency Pull Cords", "Walk-In Zero-Barrier Shower", "Individual Thermostat Control"]),
        ],
      },
    },
    {
      id: "fac-tx-007",
      name: "Baylor Scott & White Institute for Rehabilitation - Dallas",
      type: "rehabilitation_center" as FacilityType,
      street: "909 N Washington Ave", city: "Dallas", zipCode: "75246", county: "Dallas",
      phone: "(214) 820-9300", email: "admissions@bsw-rehabdallas.demo.carebridge.example",
      website: "https://bsw-rehabdallas.demo.carebridge.example",
      capacity: 118, currentOccupancy: 104, rating: 4.9, reviewsCount: 220, waitlistDays: 1,
      careLevelsOffered: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "UnitedHealthcare", "Aetna", "VA"],
      specialties: ["Traumatic brain injury rehab", "Spinal cord injury care", "Stroke neuro-rehabilitation", "Bionic exoskeleton gait training"],
      description: "Nationally recognized Model Systems rehabilitation hospital providing high-intensity interdisciplinary therapy for complex neurological and orthopedic conditions.",
      orgId: "org-tx-fac-001",
      tourConfig: null,
    },
    {
      id: "fac-tx-008",
      name: "Prestonwood Rehabilitation & Nursing Center",
      type: "skilled_nursing_facility" as FacilityType,
      street: "7300 Alma Dr", city: "Plano", zipCode: "75023", county: "Collin",
      phone: "(972) 527-3100", email: "admissions@prestonwoodrehab.demo.carebridge.example",
      website: "https://prestonwoodrehab.demo.carebridge.example",
      capacity: 120, currentOccupancy: 112, rating: 4.4, reviewsCount: 130, waitlistDays: 6,
      careLevelsOffered: ["skilled_nursing" as CareLevel, "long_term_care" as CareLevel, "rehabilitation" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Private Pay"],
      specialties: ["Cardiopulmonary recovery", "Post-surgical joint replacement", "Wound VAC therapy", "TPN administration"],
      description: "Modern 120-bed skilled nursing center with all-private short-term rehabilitation suites, full-time physical therapists, and comprehensive post-acute transition care.",
      orgId: "org-tx-fac-001",
      tourConfig: null,
    },
    {
      id: "fac-tx-009",
      name: "The Legacy Willow Bend Memory Support",
      type: "assisted_living" as FacilityType,
      street: "6101 Ohio Dr", city: "Plano", zipCode: "75024", county: "Collin",
      phone: "(972) 468-6200", email: "memorycare@legacywillowbend.demo.carebridge.example",
      website: "https://legacywillowbend.demo.carebridge.example",
      capacity: 40, currentOccupancy: 38, rating: 4.9, reviewsCount: 78, waitlistDays: 14,
      careLevelsOffered: ["memory_care" as CareLevel, "assisted_living" as CareLevel],
      insuranceAccepted: ["Private Pay", "Long-term care insurance", "VA"],
      specialties: ["Life enrichment memory care", "Secure sensory courtyard", "Dementia-trained certified nursing aides", "Family partnership support"],
      description: "Boutique life care community memory support wing featuring household-style living, secure landscaped gardens, and tailored life-enrichment stations.",
      orgId: "org-tx-fac-002",
      tourConfig: null,
    },
    {
      id: "fac-tx-010",
      name: "Faith Presbyterian Hospice - Caring Pathways",
      type: "hospice" as FacilityType,
      street: "12477 Merit Dr", city: "Dallas", zipCode: "75251", county: "Dallas",
      phone: "(972) 239-5300", email: "intake@faithpreshospice.demo.carebridge.example",
      website: "https://faithpreshospice.demo.carebridge.example",
      capacity: 36, currentOccupancy: 29, rating: 4.9, reviewsCount: 104, waitlistDays: 0,
      careLevelsOffered: ["hospice" as CareLevel, "home_health" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Private Pay", "Blue Cross", "VA"],
      specialties: ["Inpatient hospice center", "Pediatric and adult palliative care", "Music and massage therapy", "Continuous symptom relief"],
      description: "Serene 36-bed residential hospice center surrounded by healing gardens, reflecting pools, and dedicated family reflection suites.",
      orgId: "org-tx-fac-004",
      tourConfig: null,
    },

    // ── AUSTIN (Travis County) ──
    {
      id: "fac-tx-011",
      name: "Westlake Hills Rehabilitation & Healthcare Center",
      type: "skilled_nursing_facility" as FacilityType,
      street: "1002 Westlake Dr", city: "Austin", zipCode: "78746", county: "Travis",
      phone: "(512) 328-3770", email: "admissions@westlakecare.demo.carebridge.example",
      website: "https://westlakecare.demo.carebridge.example",
      capacity: 92, currentOccupancy: 83, rating: 4.6, reviewsCount: 89, waitlistDays: 3,
      careLevelsOffered: ["skilled_nursing" as CareLevel, "rehabilitation" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Private Pay", "UnitedHealthcare"],
      specialties: ["Physical & occupational therapy", "Post-cardiac surgery care", "Orthopedic rehab", "Wound care certified nurses"],
      description: "Scenic Hill Country skilled nursing and recovery pavilion providing restorative rehabilitation, scenic terrace dining, and customized post-discharge planning.",
      orgId: "org-tx-fac-001",
      tourConfig: {
        accentColor: "#0369a1", wallColor: "#f8fafc", floorColor: "#e0f2fe", roomName: "Hill Country Recovery Suite",
        welcome: "Restorative post-acute care and orthopedic recovery surrounded by Austin's scenic rolling hills.",
        stops: [
          stop("westlake-atrium", "lobby", "Hill Country Atrium", "Bright, high-ceiling reception area featuring limestone finishes and family meeting rooms.", ["Private Care Conference Rooms", "Streamlined Hospital Intake", "Patient Greeter Staff"]),
          stop("westlake-track", "corridor", "Rehabilitation Concourse", "Wide concourse equipped with cushioned flooring and distance markers for progress tracking.", ["Cushioned Safety Flooring", "Paced Walking Distance Marks", "Direct Access to Therapy Gym"]),
          stop("westlake-suite", "room", "Hill Country Recovery Suite", "Private patient room with hill country views, medical oxygen headwall, and motorized patient recliner.", ["Scenic Hill Views", "Motorized Transfer Recliner", "Private Walk-In Shower"]),
          stop("westlake-pergola", "room", "Terrace Solarium", "Enclosed sunlit patio for seated physical therapy drills and outdoor family visits.", ["Screened Hillside Breeze", "Step-Free Level Access", "Family Visiting Seating"]),
        ],
      },
    },
    {
      id: "fac-tx-012",
      name: "Arbor Terrace West Austin Assisted Living",
      type: "assisted_living" as FacilityType,
      street: "1601 Westlake Dr", city: "Austin", zipCode: "78746", county: "Travis",
      phone: "(512) 329-8700", email: "info@arbor-westaustin.demo.carebridge.example",
      website: "https://arbor-westaustin.demo.carebridge.example",
      capacity: 68, currentOccupancy: 61, rating: 4.5, reviewsCount: 64, waitlistDays: 7,
      careLevelsOffered: ["assisted_living" as CareLevel, "memory_care" as CareLevel],
      insuranceAccepted: ["Private Pay", "Long-term care insurance", "VA"],
      specialties: ["Bridges cognitive support program", "Assisted dining support", "Medication administration", "Wellness clinic"],
      description: "Warm, boutique assisted living and memory community set in Austin's rolling hills, offering progressive cognitive care and concierge medical support.",
      orgId: "org-tx-fac-002",
      tourConfig: null,
    },
    {
      id: "fac-tx-013",
      name: "Ascension Seton Rehabilitation Hospital",
      type: "rehabilitation_center" as FacilityType,
      street: "1301 W 38th St", city: "Austin", zipCode: "78705", county: "Travis",
      phone: "(512) 324-1000", email: "transitions@ascension-setonrehab.demo.carebridge.example",
      website: "https://ascension-setonrehab.demo.carebridge.example",
      capacity: 74, currentOccupancy: 66, rating: 4.7, reviewsCount: 153, waitlistDays: 0,
      careLevelsOffered: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Aetna", "VA"],
      specialties: ["Stroke rehabilitation", "Amputee recovery program", "Spinal injury rehabilitation", "Dysphagia and speech therapy"],
      description: "Specialized inpatient rehabilitation hospital accredited by CARF, featuring an ADL simulation apartment and state-of-the-art aquatic therapy center.",
      orgId: "org-tx-fac-001",
      tourConfig: null,
    },
    {
      id: "fac-tx-014",
      name: "Silverado Barton Creek Memory Care",
      type: "assisted_living" as FacilityType,
      street: "4900 Barton Creek Blvd", city: "Austin", zipCode: "78735", county: "Travis",
      phone: "(512) 328-3500", email: "admissions@silverado-bartoncreek.demo.carebridge.example",
      website: "https://silverado-bartoncreek.demo.carebridge.example",
      capacity: 56, currentOccupancy: 53, rating: 4.8, reviewsCount: 91, waitlistDays: 10,
      careLevelsOffered: ["memory_care" as CareLevel],
      insuranceAccepted: ["Private Pay", "VA", "Long-term care insurance"],
      specialties: ["Advanced memory care", "Pet therapy & community pets", "Nexus early-stage brain fitness", "Sensory gardens"],
      description: "Purpose-built memory care community offering freedom of movement, vibrant pet therapy, and evidence-based non-pharmacological interventions for dementia.",
      orgId: "org-tx-fac-002",
      tourConfig: null,
    },
    {
      id: "fac-tx-015",
      name: "Hospice Austin's Christopher House",
      type: "hospice" as FacilityType,
      street: "2820 E Martin Luther King Jr Blvd", city: "Austin", zipCode: "78702", county: "Travis",
      phone: "(512) 322-0410", email: "christopherhouse@hospiceaustin.demo.carebridge.example",
      website: "https://christopherhouse.demo.carebridge.example",
      capacity: 24, currentOccupancy: 19, rating: 5.0, reviewsCount: 110, waitlistDays: 0,
      careLevelsOffered: ["hospice" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Private Pay", "Blue Cross", "VA"],
      specialties: ["Intensive palliative symptom management", "24/7 dedicated physician on-call", "Holistic family bereavement", "Pet-friendly family suites"],
      description: "Austin's premier inpatient hospice residence nestled under heritage oak trees, dedicated to dignified, pain-free end-of-life care and peaceful family presence.",
      orgId: "org-tx-fac-004",
      tourConfig: null,
    },

    // ── SAN ANTONIO (Bexar County) ──
    {
      id: "fac-tx-016",
      name: "The Heights on Huebner Rehabilitation & Nursing",
      type: "skilled_nursing_facility" as FacilityType,
      street: "10127 Huebner Rd", city: "San Antonio", zipCode: "78240", county: "Bexar",
      phone: "(210) 858-0888", email: "admissions@heightshuebner.demo.carebridge.example",
      website: "https://heightshuebner.demo.carebridge.example",
      capacity: 114, currentOccupancy: 99, rating: 4.5, reviewsCount: 122, waitlistDays: 3,
      careLevelsOffered: ["skilled_nursing" as CareLevel, "rehabilitation" as CareLevel, "long_term_care" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Private Pay", "VA"],
      specialties: ["Orthopedic recovery suites", "In-house hemodialysis den", "Bilingual nursing staff (Spanish/English)", "Wound debridement"],
      description: "Leading North Central San Antonio transitional care center equipped with an on-site dialysis den, private rehabilitation suites, and culturally competent bilingual care.",
      orgId: "org-tx-fac-003",
      tourConfig: {
        accentColor: "#b45309", wallColor: "#fdfbf7", floorColor: "#f3ede2", roomName: "Casita Rehabilitation Suite",
        welcome: "Bilingual, compassionate rehabilitation and dialysis-assisted nursing care in San Antonio.",
        stops: [
          stop("heights-plaza", "lobby", "Mission Welcome Plaza", "Welcoming Spanish colonial styled foyer with bilingual staff greeting arriving hospital transfers.", ["Bilingual Intake Coordinators", "Covered Patient Ambulance Portico", "Hydration & Coffee Station"]),
          stop("heights-concourse", "corridor", "Clinical Concourse", "Central artery linking the post-acute unit, on-site dialysis den, and dining hall.", ["Immediate Dialysis Den Proximity", "Nurse Station Line-of-Sight", "LED Pathway Guidance"]),
          stop("heights-casita", "room", "Casita Rehabilitation Suite", "Private room designed for orthopedic and cardiopulmonary recovery with custom headwall.", ["Integrated Headwall Equipment", "Bariatric-Capable Bed Frame", "Private Barrier-Free Bathroom"]),
        ],
      },
    },
    {
      id: "fac-tx-017",
      name: "Carlyle Senior Living & Memory Village",
      type: "assisted_living" as FacilityType,
      street: "7272 Wurzbach Rd", city: "San Antonio", zipCode: "78240", county: "Bexar",
      phone: "(210) 614-2273", email: "info@carlyle-sa.demo.carebridge.example",
      website: "https://carlyle-sa.demo.carebridge.example",
      capacity: 70, currentOccupancy: 62, rating: 4.4, reviewsCount: 77, waitlistDays: 5,
      careLevelsOffered: ["assisted_living" as CareLevel, "memory_care" as CareLevel],
      insuranceAccepted: ["Private Pay", "Medicaid", "VA", "Long-term care insurance"],
      specialties: ["Alzheimer's and related dementias", "Respite care", "Medication titration", "Physical maintenance"],
      description: "Medical Center adjacent assisted living and memory village featuring secure garden courtyards, structured routines, and attentive round-the-clock caregiving.",
      orgId: "org-tx-fac-003",
      tourConfig: null,
    },
    {
      id: "fac-tx-018",
      name: "Warm Springs Rehabilitation Hospital of San Antonio",
      type: "rehabilitation_center" as FacilityType,
      street: "5101 Medical Dr", city: "San Antonio", zipCode: "78229", county: "Bexar",
      phone: "(210) 616-0100", email: "intake@warmsprings-sa.demo.carebridge.example",
      website: "https://warmsprings-sa.demo.carebridge.example",
      capacity: 65, currentOccupancy: 57, rating: 4.7, reviewsCount: 140, waitlistDays: 0,
      careLevelsOffered: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
      insuranceAccepted: ["Medicare", "Blue Cross", "UnitedHealthcare", "Aetna", "VA", "Medicaid"],
      specialties: ["Post-stroke recovery", "Amputee prosthetic training", "Cardiac rehabilitation", "Complex respiratory weaning"],
      description: "State-of-the-art physical rehabilitation hospital in the South Texas Medical Center, delivering intensive therapies and personalized discharge readiness plans.",
      orgId: "org-tx-fac-003",
      tourConfig: null,
    },
    {
      id: "fac-tx-019",
      name: "Sonterra Memory Care Community",
      type: "assisted_living" as FacilityType,
      street: "20605 Stone Oak Pkwy", city: "San Antonio", zipCode: "78258", county: "Bexar",
      phone: "(210) 404-1444", email: "admissions@sonterramemory.demo.carebridge.example",
      website: "https://sonterramemory.demo.carebridge.example",
      capacity: 48, currentOccupancy: 44, rating: 4.8, reviewsCount: 68, waitlistDays: 8,
      careLevelsOffered: ["memory_care" as CareLevel],
      insuranceAccepted: ["Private Pay", "VA", "Long-term care insurance"],
      specialties: ["Sensory memory therapy", "Wandering prevention architecture", "Family support groups", "Chef-prepared finger foods"],
      description: "Stone Oak specialty memory care residence designed specifically for individuals with moderate-to-severe memory loss, featuring circular walking paths and calm acoustic design.",
      orgId: "org-tx-fac-003",
      tourConfig: null,
    },
    {
      id: "fac-tx-020",
      name: "Alamo Hospice Inpatient Pavilion",
      type: "hospice" as FacilityType,
      street: "11824 Radium St", city: "San Antonio", zipCode: "78216", county: "Bexar",
      phone: "(210) 444-2244", email: "hospicecare@alamohospice.demo.carebridge.example",
      website: "https://alamohospice.demo.carebridge.example",
      capacity: 22, currentOccupancy: 17, rating: 4.9, reviewsCount: 83, waitlistDays: 0,
      careLevelsOffered: ["hospice" as CareLevel, "home_health" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Private Pay", "VA", "Blue Cross"],
      specialties: ["End-stage pain management", "Compassionate palliative support", "Spiritual and cultural chaplaincy", "24/7 continuous nursing"],
      description: "Intimate 22-bed hospice center providing quiet dignity, expert comfort medicine, and generous family overnight suites.",
      orgId: "org-tx-fac-004",
      tourConfig: null,
    },

    // ── FORT WORTH (Tarrant County) ──
    {
      id: "fac-tx-021",
      name: "Mirabella Assisted Living & Memory Care",
      type: "assisted_living" as FacilityType,
      street: "4242 Bryant Irvin Rd", city: "Fort Worth", zipCode: "76109", county: "Tarrant",
      phone: "(817) 763-8008", email: "info@mirabellafw.demo.carebridge.example",
      website: "https://mirabellafw.demo.carebridge.example",
      capacity: 84, currentOccupancy: 73, rating: 4.6, reviewsCount: 95, waitlistDays: 4,
      careLevelsOffered: ["assisted_living" as CareLevel, "memory_care" as CareLevel, "independent_living" as CareLevel],
      insuranceAccepted: ["Private Pay", "Long-term care insurance", "VA", "Blue Cross"],
      specialties: ["Parkinson's care protocols", "Memory care neighborhood", "Physical therapy room", "Escorted medical appointments"],
      description: "Elegant Fort Worth assisted living community offering scenic courtyard views, tailored personal assistance, and a dedicated memory-care wing.",
      orgId: "org-tx-fac-002",
      tourConfig: {
        accentColor: "#4338ca", wallColor: "#f5f5f7", floorColor: "#e5e7eb", roomName: "Trinity Sunroom Residence",
        welcome: "Tailored assisted living and Parkinson's-informed memory support in Fort Worth.",
        stops: [
          stop("mirabella-hearth", "lobby", "Heritage Hearth Lobby", "Cozy living room arrival space with stone fireplace, library, and admissions suite.", ["Assisted Living Nurse Station", "Library & Tech Corner", "Visitor Sign-In Hub"]),
          stop("mirabella-avenue", "corridor", "Magnolia Avenue Corridor", "Residential corridor with memory shadowboxes outside every doorway to assist recognition.", ["Individual Memory Shadowboxes", "Glare-Free Soft Lighting", "Continuous Wall Railings"]),
          stop("mirabella-residence", "room", "Trinity Sunroom Residence", "Private studio apartment with floor-to-ceiling sunroom windows, emergency call system, and walk-in closet.", ["Voice & Pendant Alert System", "Walk-In Shower with Bench", "Kitchenette with Refrigerator"]),
        ],
      },
    },
    {
      id: "fac-tx-022",
      name: "Texas Health Springwood Skilled Nursing & Rehabilitation",
      type: "skilled_nursing_facility" as FacilityType,
      street: "1600 Hospital Pkwy", city: "Bedford", zipCode: "76022", county: "Tarrant",
      phone: "(817) 685-4000", email: "transitions@texashealth-springwood.demo.carebridge.example",
      website: "https://texashealth-springwood.demo.carebridge.example",
      capacity: 105, currentOccupancy: 96, rating: 4.7, reviewsCount: 167, waitlistDays: 2,
      careLevelsOffered: ["skilled_nursing" as CareLevel, "rehabilitation" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "UnitedHealthcare", "VA"],
      specialties: ["Post-operative orthopedic care", "Complex IV therapy", "Wound management", "Cardiopulmonary rehabilitation"],
      description: "Hospital-connected post-acute recovery center delivering high-acuity nursing, extensive rehab technology, and rapid transition planning.",
      orgId: "org-tx-fac-001",
      tourConfig: null,
    },
    {
      id: "fac-tx-023",
      name: "The Vantage at Cityview Rehabilitation",
      type: "rehabilitation_center" as FacilityType,
      street: "6301 Overton Ridge Blvd", city: "Fort Worth", zipCode: "76132", county: "Tarrant",
      phone: "(817) 292-5600", email: "admissions@vantagecityview.demo.carebridge.example",
      website: "https://vantagecityview.demo.carebridge.example",
      capacity: 72, currentOccupancy: 63, rating: 4.3, reviewsCount: 88, waitlistDays: 0,
      careLevelsOffered: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Private Pay"],
      specialties: ["Stroke rehabilitation", "Fall prevention training", "Occupational kitchen training", "Speech & cognitive therapy"],
      description: "Focused inpatient physical rehabilitation center helping seniors regain independence after surgery, stroke, or injury.",
      orgId: "org-tx-fac-001",
      tourConfig: null,
    },
    {
      id: "fac-tx-024",
      name: "Trinity River Hospice House",
      type: "hospice" as FacilityType,
      street: "301 College Ave", city: "Fort Worth", zipCode: "76104", county: "Tarrant",
      phone: "(817) 332-6000", email: "intake@trinityriverhospice.demo.carebridge.example",
      website: "https://trinityriverhospice.demo.carebridge.example",
      capacity: 20, currentOccupancy: 16, rating: 4.9, reviewsCount: 71, waitlistDays: 0,
      careLevelsOffered: ["hospice" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Private Pay", "VA", "Blue Cross"],
      specialties: ["Palliative symptom management", "Respite hospice care", "Bereavement coordination", "Family comfort suites"],
      description: "Warm, quiet residential hospice house in Fort Worth's Medical District dedicated to peaceful end-of-life care with 24-hour medical supervision.",
      orgId: "org-tx-fac-004",
      tourConfig: null,
    },

    // ── EL PASO (El Paso County) ──
    {
      id: "fac-tx-025",
      name: "Sun Ridge Skilled Nursing & Rehabilitation",
      type: "skilled_nursing_facility" as FacilityType,
      street: "8312 Sun Ridge Dr", city: "El Paso", zipCode: "79912", county: "El Paso",
      phone: "(915) 587-4400", email: "admissions@sunridgecare.demo.carebridge.example",
      website: "https://sunridgecare.demo.carebridge.example",
      capacity: 116, currentOccupancy: 101, rating: 4.5, reviewsCount: 108, waitlistDays: 2,
      careLevelsOffered: ["skilled_nursing" as CareLevel, "rehabilitation" as CareLevel, "long_term_care" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "VA", "Private Pay"],
      specialties: ["Bilingual post-acute care (Spanish/English)", "Orthopedic rehab", "Complex wound healing", "Dialysis coordination"],
      description: "Premier Westside El Paso skilled nursing center with mountain views, spacious therapy gym, bilingual clinical team, and advanced wound management.",
      orgId: "org-tx-fac-004",
      tourConfig: {
        accentColor: "#c2410c", wallColor: "#fafaf9", floorColor: "#f5f5f4", roomName: "Franklin Vista Recovery Suite",
        welcome: "Top-rated bilingual skilled nursing and complex wound care overlooking the Franklin Mountains.",
        stops: [
          stop("sunridge-foyer", "lobby", "Franklin Mountain Foyer", "Warm desert-toned reception hall staffed by bilingual admission liaisons 7 days a week.", ["Full Bilingual Admissions (EN/ES)", "Direct Medical Transport Entry", "Family Consultation Alcove"]),
          stop("sunridge-hall", "corridor", "Mountain View Therapy Hall", "Expansive corridor connecting therapy gym, nursing core, and courtyard gardens.", ["Wide Stretcher-Width Hallways", "Central Nursing Command Desk", "Dual-Height Handrails"]),
          stop("sunridge-suite", "room", "Franklin Vista Recovery Suite", "Private room featuring motorized hospital bed, wall-mounted oxygen, and Franklin Mountain view.", ["Franklin Mountain Views", "Wall-Mounted O₂ and Suction", "Low-Air-Loss Therapeutic Mattress"]),
        ],
      },
    },
    {
      id: "fac-tx-026",
      name: "Franklin Mountain Memory Care",
      type: "assisted_living" as FacilityType,
      street: "1551 N Mesa St", city: "El Paso", zipCode: "79902", county: "El Paso",
      phone: "(915) 532-8000", email: "contact@franklinmountain-mc.demo.carebridge.example",
      website: "https://franklinmountain-mc.demo.carebridge.example",
      capacity: 52, currentOccupancy: 46, rating: 4.7, reviewsCount: 59, waitlistDays: 5,
      careLevelsOffered: ["memory_care" as CareLevel, "assisted_living" as CareLevel],
      insuranceAccepted: ["Private Pay", "Medicaid", "VA", "Long-term care insurance"],
      specialties: ["Alzheimer's secure living", "Sensory music memory program", "Bilingual cognitive activities", "Secured outdoor promenade"],
      description: "Dedicated memory care residence near central El Paso providing compassionate, culturally resonant memory therapy in a secure, home-like setting.",
      orgId: "org-tx-fac-004",
      tourConfig: null,
    },
    {
      id: "fac-tx-027",
      name: "The Hospitals of Providence Inpatient Rehabilitation",
      type: "rehabilitation_center" as FacilityType,
      street: "2001 N Oregon St", city: "El Paso", zipCode: "79902", county: "El Paso",
      phone: "(915) 577-6011", email: "rehabtransitions@providence-elpaso.demo.carebridge.example",
      website: "https://providence-elpaso.demo.carebridge.example",
      capacity: 60, currentOccupancy: 52, rating: 4.8, reviewsCount: 144, waitlistDays: 0,
      careLevelsOffered: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Aetna", "VA"],
      specialties: ["Neurological rehabilitation", "Bilingual speech-language pathology", "Cardiac conditioning", "Post-surgical recovery"],
      description: "High-intensity hospital inpatient rehabilitation unit offering advanced therapy equipment, robotic walking assistance, and personalized transition plans.",
      orgId: "org-tx-fac-004",
      tourConfig: null,
    },
    {
      id: "fac-tx-028",
      name: "Paso del Norte Hospice Home",
      type: "hospice" as FacilityType,
      street: "4401 Montana Ave", city: "El Paso", zipCode: "79903", county: "El Paso",
      phone: "(915) 566-2200", email: "intake@pasodelnortehospice.demo.carebridge.example",
      website: "https://pasodelnortehospice.demo.carebridge.example",
      capacity: 20, currentOccupancy: 15, rating: 4.9, reviewsCount: 63, waitlistDays: 0,
      careLevelsOffered: ["hospice" as CareLevel, "home_health" as CareLevel],
      insuranceAccepted: ["Medicare", "Medicaid", "Private Pay", "VA", "Blue Cross"],
      specialties: ["Comfort care medicine", "Bilingual family bereavement", "Pain crisis management", "Culturally centered spiritual care"],
      description: "Dedicated, bilingual residential hospice providing gentle palliative care, tranquil private rooms, and supportive guidance for families.",
      orgId: "org-tx-fac-004",
      tourConfig: null,
    },
  ];

  for (const f of facilities) {
    const { street, city, zipCode, county, orgId, tourConfig, ...rest } = f;
    const data = {
      ...rest,
      address: { street, city, state: "TX", zipCode, county },
      contacts: [
        {
          name: "Admissions Director",
          role: "Admissions",
          phone: f.phone,
          email: f.email,
        },
      ],
      licensure: [`TX-DADS-LIC-${f.id.toUpperCase()}`],
      accreditations: ["The Joint Commission", "Texas Health and Human Services"],
      hasAvailability: f.currentOccupancy < f.capacity,
      acceptsMedicare: f.insuranceAccepted.includes("Medicare"),
      acceptsMedicaid: f.insuranceAccepted.includes("Medicaid"),
      tourConfig: (tourConfig ?? undefined) as any,
      organizationId: orgId,
    };

    await prisma.facility.upsert({
      where: { id: f.id },
      create: data,
      update: data,
    });

    // Seed photo media for each facility so cards render beautifully
    const photoUrl =
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&h=800&q=80";
    await prisma.facilityMedia.upsert({
      where: { id: `fmedia-${f.id}-0` },
      create: {
        id: `fmedia-${f.id}-0`,
        facilityId: f.id,
        type: "image",
        key: `demo/facilities/${f.id}/photo-0.jpg`,
        url: photoUrl,
        thumbnailUrl: photoUrl.replace("w=1200&h=800", "w=400&h=300"),
        displayOrder: 0,
      },
      update: {
        url: photoUrl,
        thumbnailUrl: photoUrl.replace("w=1200&h=800", "w=400&h=300"),
      },
    });
  }

  // ── 5. Patients ────────────────────────────────────────────────────────────
  console.log("  [5/8] Upserting 44 Diverse Patients across Texas with realistic conditions...");

  const patientTemplates = [
    // Houston
    { first: "Sofia", last: "Martinez", birth: "1948-04-12", age: 78, gender: "female", city: "Houston", zip: "77024", county: "Harris", diag: "Subcapital femoral neck fracture (post-hemiarthroplasty)", second: ["Osteopenia", "Mild hypertension"], care: "rehabilitation" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-001", worker: "usr-tx-001", payer: "Medicare Part A & B", pol: "TX-MED-9921", need: "Requires daily PT/OT for weight-bearing progression and transfer training before safely returning home." },
    { first: "Robert", last: "Campbell", birth: "1939-11-20", age: 86, gender: "male", city: "Houston", zip: "77005", county: "Harris", diag: "Acute ischemic stroke with right hemiparesis and expressive aphasia", second: ["Atrial fibrillation", "Hyperlipidemia"], care: "skilled_nursing" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-001", worker: "usr-tx-002", payer: "Blue Cross Blue Shield of Texas", pol: "BCBSTX-88402", need: "Needs 24-hour skilled nursing, speech-language therapy for dysphagia, and fall-risk precautions." },
    { first: "Elena", last: "Gonzalez", birth: "1943-08-15", age: 83, gender: "female", city: "Houston", zip: "77030", county: "Harris", diag: "Alzheimer's dementia with severe nighttime wandering and sun-downing", second: ["Urinary incontinence", "Osteoarthritis"], care: "memory_care" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-001", worker: "usr-tx-001", payer: "Texas Medicaid STAR+PLUS", pol: "TX-MCD-4410", need: "Family caregiver burnout. Requires secure memory-care neighborhood with 24/7 supervision and cueing." },
    { first: "Marcus", last: "Washington", birth: "1951-02-28", age: 75, gender: "male", city: "Houston", zip: "77004", county: "Harris", diag: "Acute exacerbation of COPD with chronic hypoxemic respiratory failure", second: ["Cor pulmonale", "Tobacco use disorder"], care: "skilled_nursing" as CareLevel, status: "assessment_in_progress" as PatientStatus, hospital: "hosp-tx-001", worker: "usr-tx-002", payer: "Medicare Part A & B", pol: "TX-MED-3381", need: "Oxygen dependent at 3.5 L/min via nasal cannula. Needs pulmonary rehabilitation and nebulizer management." },
    { first: "Walter", last: "Chen", birth: "1945-09-04", age: 80, gender: "male", city: "Houston", zip: "77079", county: "Harris", diag: "Decompensated systolic heart failure (NYHA Class III, EF 25%)", second: ["Type 2 diabetes", "Chronic kidney disease Stage 3b"], care: "skilled_nursing" as CareLevel, status: "admitted" as PatientStatus, hospital: "hosp-tx-001", worker: "usr-tx-001", payer: "UnitedHealthcare Medicare Advantage", pol: "UHC-99201", need: "Requires daily weights, telemetry assessment, and low-sodium dietary support with diuretic titration." },
    { first: "Maria", last: "Hernandez", birth: "1936-05-18", age: 90, gender: "female", city: "Houston", zip: "77009", county: "Harris", diag: "End-stage congestive cardiomyopathy with severe cachexia", second: ["Chronic pain", "Generalized debility"], care: "hospice" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-001", worker: "usr-tx-002", payer: "Medicare Part A & B", pol: "TX-MED-1102", need: "Palliative care goals established with family. Needs peaceful inpatient hospice for comfort and pain control." },
    { first: "James", last: "O'Connor", birth: "1947-12-11", age: 78, gender: "male", city: "Houston", zip: "77027", county: "Harris", diag: "Type 2 diabetes with severe peripheral neuropathy and Charcot neuroarthropathy", second: ["Peripheral artery disease", "Hypertension"], care: "assisted_living" as CareLevel, status: "placed" as PatientStatus, hospital: "hosp-tx-001", worker: "usr-tx-001", payer: "Private Pay", pol: "PPAY-8819", need: "Assistance with ADLs, diabetic foot checks, and mobility assistance with rollator." },

    // Dallas
    { first: "Dorothy", last: "Davis", birth: "1941-03-24", age: 85, gender: "female", city: "Dallas", zip: "75205", county: "Dallas", diag: "Right intertrochanteric hip fracture status-post intramedullary nailing", second: ["Mild cognitive impairment", "Osteoporosis"], care: "rehabilitation" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-002", worker: "usr-tx-003", payer: "Medicare Part A & B", pol: "TX-MED-7714", need: "Requires short-term inpatient rehabilitation for ambulation training, stair navigation, and ADLs." },
    { first: "Carlos", last: "Morales", birth: "1949-07-09", age: 77, gender: "male", city: "Dallas", zip: "75214", county: "Dallas", diag: "Left MCA thromboembolic stroke with mild dysarthria and right arm weakness", second: ["Hypertension", "Carotid stenosis"], care: "rehabilitation" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-002", worker: "usr-tx-004", payer: "Blue Cross Blue Shield of Texas", pol: "BCBSTX-44219", need: "Candidate for high-intensity inpatient physical and occupational therapy to regain fine motor coordination." },
    { first: "Margaret", last: "Taylor", birth: "1938-10-14", age: 87, gender: "female", city: "Dallas", zip: "75225", county: "Dallas", diag: "Moderate vascular dementia with executive dysfunction and fall risk", second: ["Macular degeneration", "Urinary frequency"], care: "memory_care" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-002", worker: "usr-tx-003", payer: "Private Pay", pol: "PPAY-3301", need: "Unable to manage medications or meals independently. Requires memory-care community placement." },
    { first: "Samuel", last: "Nguyen", birth: "1953-06-30", age: 73, gender: "male", city: "Dallas", zip: "75231", county: "Dallas", diag: "COPD exacerbation with persistent hypercapnia on nocturnal BiPAP", second: ["Sleep apnea", "Coronary artery disease"], care: "skilled_nursing" as CareLevel, status: "assessment_in_progress" as PatientStatus, hospital: "hosp-tx-002", worker: "usr-tx-004", payer: "Medicare Part A & B", pol: "TX-MED-5509", need: "Skilled respiratory therapy required with nightly BiPAP monitoring and pulmonary education." },
    { first: "Evelyn", last: "Jackson", birth: "1946-01-19", age: 80, gender: "female", city: "Dallas", zip: "75218", county: "Dallas", diag: "Diabetic plantar foot ulcer (Wagner Grade 3) requiring wound VAC therapy", second: ["Type 2 diabetes", "End-stage renal disease on hemodialysis"], care: "skilled_nursing" as CareLevel, status: "placed" as PatientStatus, hospital: "hosp-tx-002", worker: "usr-tx-003", payer: "Texas Medicaid STAR+PLUS", pol: "TX-MCD-8834", need: "Daily wound VAC dressing changes and 3x/week dialysis transport coordination." },
    { first: "Frank", last: "Rodriguez", birth: "1940-08-08", age: 86, gender: "male", city: "Dallas", zip: "75206", county: "Dallas", diag: "End-stage Parkinson's disease with profound dysphagia and recurrent aspiration", second: ["Severe gait freezing", "Postural hypotension"], care: "hospice" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-002", worker: "usr-tx-004", payer: "VA Health Care", pol: "VA-TX-9901", need: "Comfort-focused palliative care. Requires inpatient hospice placement with spiritual support." },
    { first: "Beatrice", last: "Clark", birth: "1944-11-03", age: 81, gender: "female", city: "Dallas", zip: "75240", county: "Dallas", diag: "Generalized muscular debility after severe COVID-19 pneumonia", second: ["Hypothyroidism", "Generalized anxiety"], care: "assisted_living" as CareLevel, status: "discharged" as PatientStatus, hospital: "hosp-tx-002", worker: "usr-tx-003", payer: "Private Pay", pol: "PPAY-6623", need: "Placed in assisted living; ongoing physical therapy support arranged." },

    // Austin
    { first: "Raymond", last: "Perez", birth: "1950-05-17", age: 76, gender: "male", city: "Austin", zip: "78704", county: "Travis", diag: "Bilateral knee arthroplasty recovery with delayed wound healing", second: ["Hypertension", "Obesity"], care: "rehabilitation" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-004", worker: "usr-tx-005", payer: "Humana Gold Plus", pol: "HUM-33821", need: "Intensive 3-hour daily physical therapy to achieve 90-degree flexion and independent transfers." },
    { first: "Alice", last: "Wright", birth: "1937-02-14", age: 89, gender: "female", city: "Austin", zip: "78703", county: "Travis", diag: "Subdural hematoma status-post burr hole drainage following mechanical fall", second: ["Cervical spondylosis", "Ataxia"], care: "skilled_nursing" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-004", worker: "usr-tx-006", payer: "Medicare Part A & B", pol: "TX-MED-4412", need: "Neurological checks every 4 hours, continuous fall-risk monitoring, and physical therapy." },
    { first: "Hector", last: "Cruz", birth: "1945-12-05", age: 80, gender: "male", city: "Austin", zip: "78745", county: "Travis", diag: "Lewy Body dementia with visual hallucinations and progressive gait instability", second: ["REM sleep behavior disorder", "Autonomic failure"], care: "memory_care" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-004", worker: "usr-tx-005", payer: "VA Health Care", pol: "VA-TX-1184", need: "Specialized memory-care placement with low-stimulus environment and fall-prevention bed." },
    { first: "Patricia", last: "Adams", birth: "1942-07-29", age: 84, gender: "female", city: "Austin", zip: "78759", county: "Travis", diag: "Severe chronic heart failure with frequent re-admissions", second: ["Atrial flutter", "Permanent pacemaker"], care: "assisted_living" as CareLevel, status: "placed" as PatientStatus, hospital: "hosp-tx-004", worker: "usr-tx-006", payer: "Private Pay", pol: "PPAY-5510", need: "Assisted living placement completed with on-site nursing medication supervision." },
    { first: "Kenneth", last: "Liu", birth: "1952-10-18", age: 73, gender: "male", city: "Austin", zip: "78750", county: "Travis", diag: "Diabetic peripheral neuropathy with neuropathic osteoarthropathy", second: ["Type 2 diabetes", "Hypertriglyceridemia"], care: "skilled_nursing" as CareLevel, status: "assessment_in_progress" as PatientStatus, hospital: "hosp-tx-004", worker: "usr-tx-005", payer: "Blue Cross Blue Shield of Texas", pol: "BCBSTX-77102", need: "Non-weight-bearing right lower extremity. Requires skilled nursing and OT for wheelchair adaptations." },
    { first: "Dolores", last: "Ramirez", birth: "1935-09-22", age: 91, gender: "female", city: "Austin", zip: "78702", county: "Travis", diag: "Metastatic pancreatic adenocarcinoma with intractable abdominal pain", second: ["Anorexia-cachexia syndrome", "Jaundice"], care: "hospice" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-004", worker: "usr-tx-006", payer: "Medicare Part A & B", pol: "TX-MED-8819", need: "Urgent hospice referral for inpatient symptom management and comfort care suite." },
    { first: "Thomas", last: "Baker", birth: "1948-03-31", age: 78, gender: "male", city: "Austin", zip: "78749", county: "Travis", diag: "Lumbar spinal canal stenosis status-post L3-L5 decompression laminectomy", second: ["Degenerative disc disease", "Hypertension"], care: "rehabilitation" as CareLevel, status: "admitted" as PatientStatus, hospital: "hosp-tx-004", worker: "usr-tx-005", payer: "Medicare Part A & B", pol: "TX-MED-6623", need: "Spine rehabilitation protocol with log-roll technique and core stabilization therapy." },

    // San Antonio
    { first: "Teresa", last: "Gomez", birth: "1943-06-25", age: 83, gender: "female", city: "San Antonio", zip: "78229", county: "Bexar", diag: "Peritrochanteric left hip fracture post-closed reduction and percutaneous pinning", second: ["Osteoarthritis", "Hypertension"], care: "skilled_nursing" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-005", worker: "usr-tx-007", payer: "Medicare Part A & B", pol: "TX-MED-9941", need: "Needs bilingual skilled nursing facility with daily physical therapy and weight-bearing guidance." },
    { first: "Richard", last: "Evans", birth: "1946-11-12", age: 79, gender: "male", city: "San Antonio", zip: "78209", county: "Bexar", diag: "Right hemispheric stroke with left-sided neglect and hemiparesis", second: ["Hypertension", "Dyslipidemia"], care: "rehabilitation" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-005", worker: "usr-tx-007", payer: "Blue Cross Blue Shield of Texas", pol: "BCBSTX-11928", need: "Intensive inpatient therapy required including visual scanning exercises and transfer training." },
    { first: "Rosa", last: "Delgado", birth: "1939-01-08", age: 87, gender: "female", city: "San Antonio", zip: "78207", county: "Bexar", diag: "Severe Alzheimer's disease with severe communication barrier and wandering risk", second: ["Depression", "Osteoporosis"], care: "memory_care" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-005", worker: "usr-tx-007", payer: "Texas Medicaid STAR+PLUS", pol: "TX-MCD-2291", need: "Spanish-speaking memory-care facility needed with secure courtyard and structured daily programs." },
    { first: "William", last: "Mitchell", birth: "1951-08-19", age: 75, gender: "male", city: "San Antonio", zip: "78230", county: "Bexar", diag: "Severe COPD exacerbation requiring ongoing tracheostomy suctioning", second: ["Cor pulmonale", "Anemia of chronic disease"], care: "skilled_nursing" as CareLevel, status: "placed" as PatientStatus, hospital: "hosp-tx-005", worker: "usr-tx-007", payer: "VA Health Care", pol: "VA-TX-4402", need: "Placed in skilled nursing with high-acuity tracheostomy care and respiratory weaning protocol." },
    { first: "Carmen", last: "Santos", birth: "1947-04-03", age: 79, gender: "female", city: "San Antonio", zip: "78228", county: "Bexar", diag: "Type 2 diabetes with severe diabetic gastroparesis and malnutrition", second: ["Peripheral neuropathy", "Diabetic retinopathy"], care: "assisted_living" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-005", worker: "usr-tx-007", payer: "Private Pay", pol: "PPAY-1182", need: "Requires assisted living with specialized dietary support, small frequent meals, and blood glucose monitoring." },
    { first: "George", last: "Harrison", birth: "1940-10-30", age: 85, gender: "male", city: "San Antonio", zip: "78216", county: "Bexar", diag: "End-stage renal disease declining hemodialysis; comfort measures", second: ["Uremic encephalopathy", "Hypertension"], care: "hospice" as CareLevel, status: "placed" as PatientStatus, hospital: "hosp-tx-005", worker: "usr-tx-007", payer: "Medicare Part A & B", pol: "TX-MED-3310", need: "Inpatient hospice placement complete with family spiritual chaplaincy." },
    { first: "Josefina", last: "Silva", birth: "1944-03-17", age: 82, gender: "female", city: "San Antonio", zip: "78212", county: "Bexar", diag: "Post-COVID muscular deconditioning and mechanical fall with pelvic ramus fracture", second: ["Osteoarthritis", "Hearing impairment"], care: "rehabilitation" as CareLevel, status: "assessment_in_progress" as PatientStatus, hospital: "hosp-tx-005", worker: "usr-tx-007", payer: "Aetna Senior Care", pol: "AET-88301", need: "Conservative pelvic fracture rehab with walker ambulation and pain management." },

    // Fort Worth
    { first: "Arthur", last: "King", birth: "1945-07-22", age: 81, gender: "male", city: "Fort Worth", zip: "76107", county: "Tarrant", diag: "Elective total hip arthroplasty with delayed wound edge healing", second: ["Type 2 diabetes", "Sleep apnea"], care: "skilled_nursing" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-003", worker: "usr-tx-003", payer: "Medicare Part A & B", pol: "TX-MED-2201", need: "Daily wound inspection, dressing changes, and physical therapy progression to cane ambulation." },
    { first: "Guadalupe", last: "Ortiz", birth: "1938-12-09", age: 87, gender: "female", city: "Fort Worth", zip: "76104", county: "Tarrant", diag: "Vascular dementia with progressive loss of ADL independence", second: ["Chronic kidney disease", "Hypertension"], care: "memory_care" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-003", worker: "usr-tx-004", payer: "Private Pay", pol: "PPAY-9932", need: "Lives alone currently, no longer safe. Daughter seeking secure memory-care community near Fort Worth." },
    { first: "Donald", last: "Scott", birth: "1949-09-14", age: 77, gender: "male", city: "Fort Worth", zip: "76109", county: "Tarrant", diag: "Ischemic stroke with left facial droop and mild hemiparesis", second: ["Hyperlipidemia", "Previous TIA"], care: "rehabilitation" as CareLevel, status: "placed" as PatientStatus, hospital: "hosp-tx-003", worker: "usr-tx-003", payer: "Blue Cross Blue Shield of Texas", pol: "BCBSTX-99410", need: "Rehabilitation placement completed with targeted OT for dominant hand strength." },
    { first: "Angela", last: "Morales", birth: "1953-01-26", age: 73, gender: "female", city: "Fort Worth", zip: "76116", county: "Tarrant", diag: "Congestive heart failure exacerbation with bilateral pitting lower extremity edema", second: ["Hypertension", "Morbid obesity"], care: "skilled_nursing" as CareLevel, status: "assessment_in_progress" as PatientStatus, hospital: "hosp-tx-003", worker: "usr-tx-004", payer: "Medicare Part A & B", pol: "TX-MED-7741", need: "Requires compression therapy, cardiac rehab, and medication reconciliation." },
    { first: "David", last: "Young", birth: "1941-05-02", age: 85, gender: "male", city: "Fort Worth", zip: "76132", county: "Tarrant", diag: "Severe Parkinson's disease with dyskinesia and frequent freezing episodes", second: ["Orthostatic hypotension", "Scoliosis"], care: "assisted_living" as CareLevel, status: "placed" as PatientStatus, hospital: "hosp-tx-003", worker: "usr-tx-003", payer: "Private Pay", pol: "PPAY-4411", need: "Assisted living placement completed with tailored physical therapy program." },
    { first: "Isabel", last: "Flores", birth: "1936-11-18", age: 89, gender: "female", city: "Fort Worth", zip: "76110", county: "Tarrant", diag: "End-stage pulmonary fibrosis requiring continuous high-flow oxygen", second: ["Pulmonary hypertension", "Anxiety"], care: "hospice" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-003", worker: "usr-tx-004", payer: "Medicare Part A & B", pol: "TX-MED-1194", need: "Hospice inpatient suite needed for high-flow comfort oxygenation and family respite." },
    { first: "Harold", last: "Green", birth: "1947-08-30", age: 79, gender: "male", city: "Fort Worth", zip: "76123", county: "Tarrant", diag: "Post-coronary artery bypass graft (CABG x3) recovery with sternal precautions", second: ["Type 2 diabetes", "Hyperlipidemia"], care: "rehabilitation" as CareLevel, status: "discharged" as PatientStatus, hospital: "hosp-tx-003", worker: "usr-tx-003", payer: "UnitedHealthcare Medicare Advantage", pol: "UHC-44910", need: "Successfully completed inpatient rehab and discharged to home health." },

    // El Paso
    { first: "Consuelo", last: "Castillo", birth: "1940-02-17", age: 86, gender: "female", city: "El Paso", zip: "79902", county: "El Paso", diag: "Left femoral neck fracture status-post hemiarthroplasty", second: ["Osteoarthritis", "Hypertension"], care: "skilled_nursing" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-006", worker: "usr-tx-008", payer: "Medicare Part A & B", pol: "TX-MED-8801", need: "Spanish-speaking skilled nursing facility needed with aggressive daily physical therapy." },
    { first: "Charles", last: "Hall", birth: "1948-10-05", age: 77, gender: "male", city: "El Paso", zip: "79912", county: "El Paso", diag: "Ischemic cerebellar stroke with profound ataxia and vertigo", second: ["Hypertension", "Previous myocardial infarction"], care: "rehabilitation" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-006", worker: "usr-tx-008", payer: "Blue Cross Blue Shield of Texas", pol: "BCBSTX-33190", need: "Balance retraining and vestibular physical therapy in an inpatient rehabilitation center." },
    { first: "Yolanda", last: "Rios", birth: "1943-07-13", age: 83, gender: "female", city: "El Paso", zip: "79925", county: "El Paso", diag: "Moderate-to-severe Alzheimer's dementia with exit-seeking behavior", second: ["Type 2 diabetes", "Urinary frequency"], care: "memory_care" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-006", worker: "usr-tx-008", payer: "Texas Medicaid STAR+PLUS", pol: "TX-MCD-9902", need: "Requires secure bilingual memory care community to prevent dangerous wandering." },
    { first: "Edward", last: "White", birth: "1951-12-01", age: 74, gender: "male", city: "El Paso", zip: "79936", county: "El Paso", diag: "Non-healing diabetic neuropathic heel ulcer with underlying calcaneal osteomyelitis", second: ["Type 2 diabetes", "Severe peripheral artery disease"], care: "skilled_nursing" as CareLevel, status: "placed" as PatientStatus, hospital: "hosp-tx-006", worker: "usr-tx-008", payer: "VA Health Care", pol: "VA-TX-7712", need: "Placed in skilled nursing for 6-week course of IV daptomycin and surgical wound care." },
    { first: "Francisca", last: "Vega", birth: "1937-04-28", age: 89, gender: "female", city: "El Paso", zip: "79901", county: "El Paso", diag: "Advanced Parkinson's disease with freezing episodes and severe weight loss", second: ["Dysphagia", "Severe postural tremor"], care: "assisted_living" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-006", worker: "usr-tx-008", payer: "Private Pay", pol: "PPAY-2219", need: "Assisted living with 24-hour caregiver assistance for dressing, feeding, and mobility." },
    { first: "Joseph", last: "Allen", birth: "1942-09-08", age: 84, gender: "male", city: "El Paso", zip: "79930", county: "El Paso", diag: "End-stage COPD with cor pulmonale and intractable dyspnea", second: ["Right heart failure", "Chronic CO2 retention"], care: "hospice" as CareLevel, status: "ready_for_discharge" as PatientStatus, hospital: "hosp-tx-006", worker: "usr-tx-008", payer: "Medicare Part A & B", pol: "TX-MED-4490", need: "Inpatient hospice care needed for palliative symptom relief and family support." },
    { first: "Gloria", last: "Ramos", birth: "1949-03-11", age: 77, gender: "female", city: "El Paso", zip: "79904", county: "El Paso", diag: "Severe spinal stenosis with multiple falls and gait instability", second: ["Osteoarthritis", "Hypertension"], care: "rehabilitation" as CareLevel, status: "assessment_in_progress" as PatientStatus, hospital: "hosp-tx-006", worker: "usr-tx-008", payer: "Medicare Part A & B", pol: "TX-MED-5512", need: "Pre-placement functional assessment underway for rehabilitation candidate." },
    { first: "Paul", last: "Bennett", birth: "1945-06-20", age: 81, gender: "male", city: "El Paso", zip: "79915", county: "El Paso", diag: "Right trimalleolar ankle fracture post-ORIF", second: ["Type 2 diabetes", "Peripheral neuropathy"], care: "skilled_nursing" as CareLevel, status: "discharged" as PatientStatus, hospital: "hosp-tx-006", worker: "usr-tx-008", payer: "Medicare Part A & B", pol: "TX-MED-6601", need: "Completed 4-week SNF stay and successfully transitioned to home with outpatient PT." },
    { first: "Mercedes", last: "Garza", birth: "1939-08-01", age: 87, gender: "female", city: "El Paso", zip: "79922", county: "El Paso", diag: "Recurrent syncope and multifactorial fall with left clavicle and rib fractures", second: ["Sinus node dysfunction", "Osteoporosis"], care: "skilled_nursing" as CareLevel, status: "admitted" as PatientStatus, hospital: "hosp-tx-006", worker: "usr-tx-008", payer: "Blue Cross Blue Shield of Texas", pol: "BCBSTX-66102", need: "Currently admitted on telemetry following pacemaker implant; evaluating SNF candidates." },
  ];

  for (const [index, p] of patientTemplates.entries()) {
    const id = `pat-tx-${String(index + 1).padStart(3, "0")}`;
    const mrn = `TX-MRN-${String(100 + index + 1)}`;
    const orgId = p.hospital === "hosp-tx-001" ? "org-tx-001" :
                  p.hospital === "hosp-tx-002" || p.hospital === "hosp-tx-003" ? "org-tx-002" :
                  p.hospital === "hosp-tx-004" ? "org-tx-003" :
                  p.hospital === "hosp-tx-005" ? "org-tx-004" : "org-tx-001";

    const patientData = {
      id,
      mrn,
      firstName: p.first,
      lastName: p.last,
      dateOfBirth: new Date(p.birth),
      age: p.age,
      gender: p.gender,
      address: { street: `${100 + index} Fictional Medical Lane`, city: p.city, state: "TX", zipCode: p.zip, county: p.county },
      phone: `(${p.city === "Houston" ? "713" : p.city === "Dallas" ? "214" : p.city === "Austin" ? "512" : p.city === "San Antonio" ? "210" : p.city === "Fort Worth" ? "817" : "915"}) 555-04${String(index).padStart(2, "0")}`,
      emergencyContact: {
        name: `Family Contact for ${p.first} ${p.last}`,
        role: "Family",
        phone: "(555) 019-9944",
        email: `family.${p.last.toLowerCase()}@demo.carebridge.example`,
      },
      insurance: [
        {
          provider: p.payer,
          policyNumber: p.pol,
          type: p.payer.toLowerCase().includes("medicaid") ? "medicaid" :
                p.payer.toLowerCase().includes("va") ? "va" :
                p.payer.toLowerCase().includes("private") ? "self_pay" :
                p.payer.toLowerCase().includes("medicare") ? "medicare" : "private",
          status: "verified",
        },
      ],
      primaryDiagnosis: p.diag,
      secondaryDiagnoses: p.second,
      careLevelRequired: p.care,
      notes: p.need,
      socialWorkerId: p.worker,
      hospitalId: p.hospital,
      organizationId: orgId,
      admissionDate: date(10, 1 + (index % 12)),
      estimatedDischargeDate: date(10, 10 + (index % 14)),
      status: p.status,
    };

    await prisma.patient.upsert({
      where: { id },
      create: patientData,
      update: patientData,
    });
  }

  // ── 6. Placements ──────────────────────────────────────────────────────────
  console.log("  [6/8] Upserting 25 Patient Placements across matching, approval, and completion...");

  const placementScenarios = [
    // Houston
    { id: "plc-tx-001", pat: "pat-tx-001", fac: "fac-tx-001", org: "org-tx-001", worker: "usr-tx-001", care: "rehabilitation" as CareLevel, status: "pending_approval" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-001", "fac-tx-002"] },
    { id: "plc-tx-002", pat: "pat-tx-002", fac: "fac-tx-001", org: "org-tx-001", worker: "usr-tx-002", care: "skilled_nursing" as CareLevel, status: "matching" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-001", "fac-tx-002"] },
    { id: "plc-tx-003", pat: "pat-tx-003", fac: "fac-tx-003", org: "org-tx-001", worker: "usr-tx-001", care: "memory_care" as CareLevel, status: "approved" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-003"] },
    { id: "plc-tx-006", pat: "pat-tx-006", fac: "fac-tx-005", org: "org-tx-001", worker: "usr-tx-002", care: "hospice" as CareLevel, status: "pending_approval" as PlacementStatus, priority: "emergency" as Priority, matches: ["fac-tx-005"] },
    { id: "plc-tx-007", pat: "pat-tx-007", fac: "fac-tx-004", org: "org-tx-001", worker: "usr-tx-001", care: "assisted_living" as CareLevel, status: "completed" as PlacementStatus, priority: "medium" as Priority, matches: ["fac-tx-004"] },

    // Dallas
    { id: "plc-tx-008", pat: "pat-tx-008", fac: "fac-tx-007", org: "org-tx-002", worker: "usr-tx-003", care: "rehabilitation" as CareLevel, status: "approved" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-007", "fac-tx-008"] },
    { id: "plc-tx-009", pat: "pat-tx-009", fac: "fac-tx-007", org: "org-tx-002", worker: "usr-tx-004", care: "rehabilitation" as CareLevel, status: "pending_approval" as PlacementStatus, priority: "medium" as Priority, matches: ["fac-tx-007"] },
    { id: "plc-tx-010", pat: "pat-tx-010", fac: "fac-tx-006", org: "org-tx-002", worker: "usr-tx-003", care: "memory_care" as CareLevel, status: "matching" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-006", "fac-tx-009"] },
    { id: "plc-tx-012", pat: "pat-tx-012", fac: "fac-tx-008", org: "org-tx-002", worker: "usr-tx-003", care: "skilled_nursing" as CareLevel, status: "completed" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-008"] },
    { id: "plc-tx-013", pat: "pat-tx-013", fac: "fac-tx-010", org: "org-tx-002", worker: "usr-tx-004", care: "hospice" as CareLevel, status: "approved" as PlacementStatus, priority: "emergency" as Priority, matches: ["fac-tx-010"] },

    // Austin
    { id: "plc-tx-015", pat: "pat-tx-015", fac: "fac-tx-011", org: "org-tx-003", worker: "usr-tx-005", care: "rehabilitation" as CareLevel, status: "approved" as PlacementStatus, priority: "medium" as Priority, matches: ["fac-tx-011", "fac-tx-013"] },
    { id: "plc-tx-016", pat: "pat-tx-016", fac: "fac-tx-011", org: "org-tx-003", worker: "usr-tx-006", care: "skilled_nursing" as CareLevel, status: "matching" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-011"] },
    { id: "plc-tx-017", pat: "pat-tx-017", fac: "fac-tx-014", org: "org-tx-003", worker: "usr-tx-005", care: "memory_care" as CareLevel, status: "pending_approval" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-014", "fac-tx-012"] },
    { id: "plc-tx-018", pat: "pat-tx-018", fac: "fac-tx-012", org: "org-tx-003", worker: "usr-tx-006", care: "assisted_living" as CareLevel, status: "completed" as PlacementStatus, priority: "low" as Priority, matches: ["fac-tx-012"] },
    { id: "plc-tx-020", pat: "pat-tx-020", fac: "fac-tx-015", org: "org-tx-003", worker: "usr-tx-006", care: "hospice" as CareLevel, status: "approved" as PlacementStatus, priority: "emergency" as Priority, matches: ["fac-tx-015"] },

    // San Antonio
    { id: "plc-tx-022", pat: "pat-tx-022", fac: "fac-tx-016", org: "org-tx-004", worker: "usr-tx-007", care: "skilled_nursing" as CareLevel, status: "pending_approval" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-016", "fac-tx-018"] },
    { id: "plc-tx-023", pat: "pat-tx-023", fac: "fac-tx-018", org: "org-tx-004", worker: "usr-tx-007", care: "rehabilitation" as CareLevel, status: "matching" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-018"] },
    { id: "plc-tx-024", pat: "pat-tx-024", fac: "fac-tx-017", org: "org-tx-004", worker: "usr-tx-007", care: "memory_care" as CareLevel, status: "approved" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-017", "fac-tx-019"] },
    { id: "plc-tx-025", pat: "pat-tx-025", fac: "fac-tx-016", org: "org-tx-004", worker: "usr-tx-007", care: "skilled_nursing" as CareLevel, status: "completed" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-016"] },
    { id: "plc-tx-027", pat: "pat-tx-027", fac: "fac-tx-020", org: "org-tx-004", worker: "usr-tx-007", care: "hospice" as CareLevel, status: "completed" as PlacementStatus, priority: "emergency" as Priority, matches: ["fac-tx-020"] },

    // Fort Worth & El Paso
    { id: "plc-tx-029", pat: "pat-tx-029", fac: "fac-tx-022", org: "org-tx-002", worker: "usr-tx-003", care: "skilled_nursing" as CareLevel, status: "matching" as PlacementStatus, priority: "medium" as Priority, matches: ["fac-tx-022"] },
    { id: "plc-tx-031", pat: "pat-tx-031", fac: "fac-tx-023", org: "org-tx-002", worker: "usr-tx-003", care: "rehabilitation" as CareLevel, status: "completed" as PlacementStatus, priority: "medium" as Priority, matches: ["fac-tx-023"] },
    { id: "plc-tx-033", pat: "pat-tx-033", fac: "fac-tx-021", org: "org-tx-002", worker: "usr-tx-003", care: "assisted_living" as CareLevel, status: "completed" as PlacementStatus, priority: "low" as Priority, matches: ["fac-tx-021"] },
    { id: "plc-tx-036", pat: "pat-tx-036", fac: "fac-tx-025", org: "org-tx-001", worker: "usr-tx-008", care: "skilled_nursing" as CareLevel, status: "pending_approval" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-025", "fac-tx-027"] },
    { id: "plc-tx-039", pat: "pat-tx-039", fac: "fac-tx-025", org: "org-tx-001", worker: "usr-tx-008", care: "skilled_nursing" as CareLevel, status: "completed" as PlacementStatus, priority: "high" as Priority, matches: ["fac-tx-025"] },
  ];

  for (const p of placementScenarios) {
    const isDone = p.status === "completed";
    const data = {
      id: p.id,
      patientId: p.pat,
      facilityId: p.fac,
      selectedFacilityId: p.fac,
      socialWorkerId: p.worker,
      organizationId: p.org,
      careLevel: p.care,
      priority: p.priority,
      status: p.status,
      matchedFacilities: p.matches,
      assessmentNotes: `CareBridge clinical placement scenario for ${p.care.replace(/_/g, " ")}. Patient has completed hospital acute medical phase and is ready for transition.`,
      preferredLocation: { city: "Texas Metro", state: "TX", maxDistanceMiles: 30 },
      insurancePreAuthorized: true,
      insuranceAuthStatus: "approved" as const,
      estimatedCost: 3800,
      startDate: isDone ? date(10, 8) : null,
      completedDate: isDone ? date(10, 15) : null,
      approvalDate: isDone || p.status === "approved" ? date(10, 7) : null,
      notes: isDone ? "Placement confirmed, room assigned, and patient transferred." : "Referral active in placement pipeline.",
    };

    await prisma.placement.upsert({
      where: { id: p.id },
      create: data,
      update: data,
    });
  }

  // ── 7. Referrals Pipeline ──────────────────────────────────────────────────
  console.log("  [7/8] Upserting 24 Referrals across the complete pipeline (Draft, Sent, Accepted, Declined, Converted)...");

  const referralPipeline = [
    // 4 Draft Referrals
    { id: "ref-tx-001", pat: "pat-tx-004", fac: "fac-tx-001", user: "usr-tx-002", status: "draft" as ReferralStatus, deposit: null, placement: null },
    { id: "ref-tx-002", pat: "pat-tx-011", fac: "fac-tx-008", user: "usr-tx-004", status: "draft" as ReferralStatus, deposit: null, placement: null },
    { id: "ref-tx-003", pat: "pat-tx-019", fac: "fac-tx-011", user: "usr-tx-005", status: "draft" as ReferralStatus, deposit: null, placement: null },
    { id: "ref-tx-004", pat: "pat-tx-042", fac: "fac-tx-027", user: "usr-tx-008", status: "draft" as ReferralStatus, deposit: null, placement: null },

    // 6 Sent Referrals (Pending facility review)
    { id: "ref-tx-005", pat: "pat-tx-002", fac: "fac-tx-001", user: "usr-tx-002", status: "sent" as ReferralStatus, deposit: null, placement: null },
    { id: "ref-tx-006", pat: "pat-tx-009", fac: "fac-tx-007", user: "usr-tx-004", status: "sent" as ReferralStatus, deposit: null, placement: null },
    { id: "ref-tx-007", pat: "pat-tx-010", fac: "fac-tx-006", user: "usr-tx-003", status: "sent" as ReferralStatus, deposit: null, placement: null },
    { id: "ref-tx-008", pat: "pat-tx-016", fac: "fac-tx-011", user: "usr-tx-006", status: "sent" as ReferralStatus, deposit: null, placement: null },
    { id: "ref-tx-009", pat: "pat-tx-023", fac: "fac-tx-018", user: "usr-tx-007", status: "sent" as ReferralStatus, deposit: null, placement: null },
    { id: "ref-tx-010", pat: "pat-tx-029", fac: "fac-tx-022", user: "usr-tx-003", status: "sent" as ReferralStatus, deposit: null, placement: null },

    // 6 Accepted Referrals (Facility accepted, contract / deposit pending)
    { id: "ref-tx-011", pat: "pat-tx-001", fac: "fac-tx-001", user: "usr-tx-001", status: "accepted" as ReferralStatus, deposit: 35000, placement: null },
    { id: "ref-tx-012", pat: "pat-tx-003", fac: "fac-tx-003", user: "usr-tx-001", status: "accepted" as ReferralStatus, deposit: 40000, placement: null },
    { id: "ref-tx-013", pat: "pat-tx-008", fac: "fac-tx-007", user: "usr-tx-003", status: "accepted" as ReferralStatus, deposit: 45000, placement: null },
    { id: "ref-tx-014", pat: "pat-tx-015", fac: "fac-tx-011", user: "usr-tx-005", status: "accepted" as ReferralStatus, deposit: 35000, placement: null },
    { id: "ref-tx-015", pat: "pat-tx-022", fac: "fac-tx-016", user: "usr-tx-007", status: "accepted" as ReferralStatus, deposit: 38000, placement: null },
    { id: "ref-tx-016", pat: "pat-tx-036", fac: "fac-tx-025", user: "usr-tx-008", status: "accepted" as ReferralStatus, deposit: 35000, placement: null },

    // 2 Declined Referrals
    { id: "ref-tx-017", pat: "pat-tx-005", fac: "fac-tx-001", user: "usr-tx-001", status: "declined" as ReferralStatus, deposit: null, placement: null },
    { id: "ref-tx-018", pat: "pat-tx-021", fac: "fac-tx-016", user: "usr-tx-005", status: "declined" as ReferralStatus, deposit: null, placement: null },

    // 6 Converted Referrals (Fully signed contract, demo deposit paid, bed reserved, linked to placement)
    { id: "ref-tx-019", pat: "pat-tx-007", fac: "fac-tx-004", user: "usr-tx-001", status: "converted" as ReferralStatus, deposit: 35000, placement: "plc-tx-007" },
    { id: "ref-tx-020", pat: "pat-tx-012", fac: "fac-tx-008", user: "usr-tx-003", status: "converted" as ReferralStatus, deposit: 45000, placement: "plc-tx-012" },
    { id: "ref-tx-021", pat: "pat-tx-018", fac: "fac-tx-012", user: "usr-tx-006", status: "converted" as ReferralStatus, deposit: 38000, placement: "plc-tx-018" },
    { id: "ref-tx-022", pat: "pat-tx-025", fac: "fac-tx-016", user: "usr-tx-007", status: "converted" as ReferralStatus, deposit: 50000, placement: "plc-tx-025" },
    { id: "ref-tx-023", pat: "pat-tx-031", fac: "fac-tx-023", user: "usr-tx-003", status: "converted" as ReferralStatus, deposit: 42000, placement: "plc-tx-031" },
    { id: "ref-tx-024", pat: "pat-tx-039", fac: "fac-tx-025", user: "usr-tx-008", status: "converted" as ReferralStatus, deposit: 40000, placement: "plc-tx-039" },
  ];

  for (const ref of referralPipeline) {
    const patient = await prisma.patient.findUniqueOrThrow({ where: { id: ref.pat } });
    const isSent = ref.status !== "draft";
    const isResponded = ref.status === "accepted" || ref.status === "declined" || ref.status === "converted";

    const refData = {
      id: ref.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientDateOfBirth: patient.dateOfBirth,
      patientMrn: patient.mrn,
      careLevel: patient.careLevelRequired,
      requiredServices: [patient.primaryDiagnosis, patient.careLevelRequired],
      sendingOrgId: patient.organizationId,
      facilityId: ref.fac,
      createdById: ref.user,
      status: ref.status,
      sentAt: isSent ? date(10, 10) : null,
      respondedAt: isResponded ? date(10, 11) : null,
      convertedPlacementId: ref.placement ?? null,
    };

    await prisma.referral.upsert({
      where: { id: ref.id },
      create: refData,
      update: refData,
    });

    // Handle Contracts, Signatures, Payments, and Bed Reservations for Accepted & Converted Referrals
    if (ref.deposit) {
      const isSigned = ref.status === "converted";
      const contractId = `contract-${ref.id}`;
      const contractDoc = `CAREBRIDGE BED PLACEMENT & ADMISSION AGREEMENT. Referral: ${ref.id}. Patient: ${patient.firstName} ${patient.lastName}. Facility: ${ref.fac}. Amount: $${(ref.deposit / 100).toFixed(2)}. SYNTHETIC SALES DEMO FIXTURE.`;
      const hash = createHash("sha256").update(contractDoc).digest("hex");

      const contractData = {
        id: contractId,
        referralId: ref.id,
        depositAmountCents: ref.deposit,
        currency: "usd",
        facilityTermsSnapshot: { demo: true, terms: "Standard 30-day post-acute placement guarantee" },
        status: isSigned ? ("signed" as const) : ("sent" as const),
        documentText: contractDoc,
        documentHash: hash,
        hospitalSignedBy: isSigned ? "Hospital Transitions Liaison" : null,
        hospitalSignedAt: isSigned ? date(10, 12) : null,
        facilitySignedBy: isSigned ? "Facility Admissions Director" : null,
        facilitySignedAt: isSigned ? date(10, 12, 14) : null,
        sentAt: date(10, 11),
      };

      await prisma.contract.upsert({
        where: { id: contractId },
        create: contractData,
        update: contractData,
      });

      if (isSigned) {
        // Hospital signature
        const hospSigId = `sig-${ref.id}-hosp`;
        await prisma.contractSignature.upsert({
          where: { contractId_party: { contractId, party: "hospital" } },
          create: {
            id: hospSigId,
            contractId,
            party: "hospital",
            typedName: "Hospital Transitions Director",
            signerUserId: ref.user,
            signerOrgId: patient.organizationId,
            consentStatement: "I hereby approve the transfer and care plan on behalf of the hospital.",
            signedAt: date(10, 12),
            ipHash: createHash("sha256").update(`ip-hosp-${ref.id}`).digest("hex"),
            documentHash: hash,
            provider: "demo_fixture",
          },
          update: {},
        });

        // Facility signature
        const facSigId = `sig-${ref.id}-fac`;
        await prisma.contractSignature.upsert({
          where: { contractId_party: { contractId, party: "facility" } },
          create: {
            id: facSigId,
            contractId,
            party: "facility",
            typedName: "Facility Intake Coordinator",
            signerUserId: "usr-tx-010",
            signerOrgId: "org-tx-fac-001",
            consentStatement: "Facility confirms clinical capability and bed readiness for admission.",
            signedAt: date(10, 12, 14),
            ipHash: createHash("sha256").update(`ip-fac-${ref.id}`).digest("hex"),
            documentHash: hash,
            provider: "demo_fixture",
          },
          update: {},
        });

        // Payment record (demo_paid)
        const paymentId = `pay-${ref.id}`;
        await prisma.payment.upsert({
          where: { id: paymentId },
          create: {
            id: paymentId,
            referralId: ref.id,
            contractId,
            amountCents: ref.deposit,
            amountRefundedCents: 0,
            currency: "usd",
            status: "demo_paid",
            isDemo: true,
          },
          update: {
            amountCents: ref.deposit,
            status: "demo_paid",
          },
        });

        // Bed reservation
        const resId = `bed-res-${ref.id}`;
        await prisma.bedReservation.upsert({
          where: { referralId: ref.id },
          create: {
            id: resId,
            referralId: ref.id,
            paymentId,
            facilityId: ref.fac,
          },
          update: {
            paymentId,
            facilityId: ref.fac,
          },
        });
      }
    }
  }

  // ── 8. Activity Events ─────────────────────────────────────────────────────
  console.log("  [8/8] Upserting 12 Activity Feed events for live dashboard demonstration...");

  const activityEvents = [
    { id: "act-tx-001", type: "placement" as const, title: "Referral Converted & Bed Claimed", desc: "Patient placement confirmed at The Vosswood with electronic contract and deposit recorded.", pat: "pat-tx-007", user: "usr-tx-001", org: "org-tx-001" },
    { id: "act-tx-002", type: "assessment" as const, title: "Pre-Admission Clinical Assessment Completed", desc: "Comprehensive PT/OT and respiratory assessment submitted for inpatient rehabilitation.", pat: "pat-tx-001", user: "usr-tx-001", org: "org-tx-001" },
    { id: "act-tx-003", type: "admission" as const, title: "Patient Admitted to Rehabilitation Center", desc: "Patient successfully transferred from UTSW to Baylor Institute for Rehabilitation.", pat: "pat-tx-012", user: "usr-tx-003", org: "org-tx-002" },
    { id: "act-tx-004", type: "note" as const, title: "Care Conference Held with Family", desc: "Social worker met with family to review memory care options at The Tradition Buffalo Speedway.", pat: "pat-tx-003", user: "usr-tx-001", org: "org-tx-001" },
    { id: "act-tx-005", type: "placement" as const, title: "Referral Accepted by Facility", desc: "Westlake Hills Rehabilitation Center accepted referral for orthopedic post-surgical care.", pat: "pat-tx-015", user: "usr-tx-005", org: "org-tx-003" },
    { id: "act-tx-006", type: "milestone" as const, title: "Insurance Pre-Authorization Approved", desc: "Medicare Advantage pre-authorization received for 21 days of subacute rehabilitation.", pat: "pat-tx-008", user: "usr-tx-003", org: "org-tx-002" },
    { id: "act-tx-007", type: "discharge" as const, title: "Hospital Discharge Order Finalized", desc: "Physician finalized discharge summary and medication reconciliation for SNF transfer.", pat: "pat-tx-022", user: "usr-tx-007", org: "org-tx-004" },
    { id: "act-tx-008", type: "admission" as const, title: "Casita Suite Reserved", desc: "Bed reserved at The Heights on Huebner with on-site hemodialysis coordination scheduled.", pat: "pat-tx-025", user: "usr-tx-007", org: "org-tx-004" },
    { id: "act-tx-009", type: "note" as const, title: "Bilingual Patient Navigation Consult", desc: "Bilingual navigator reviewed care plan and language accommodations with patient and son.", pat: "pat-tx-036", user: "usr-tx-008", org: "org-tx-001" },
    { id: "act-tx-010", type: "placement" as const, title: "3D Virtual Tour Viewed by Family", desc: "Patient daughter completed interactive 3D tour of Belmont Village Turtle Creek.", pat: "pat-tx-010", user: "usr-tx-003", org: "org-tx-002" },
    { id: "act-tx-011", type: "milestone" as const, title: "Palliative Transition Plan Activated", desc: "Comfort care orders verified and quiet suite prepared at Christopher House.", pat: "pat-tx-020", user: "usr-tx-006", org: "org-tx-003" },
    { id: "act-tx-012", type: "discharge" as const, title: "Post-Acute Rehab Milestone Achieved", desc: "Patient completed physical therapy goals and discharged safely home with home health.", pat: "pat-tx-044", user: "usr-tx-008", org: "org-tx-001" },
  ];

  for (const act of activityEvents) {
    const patient = await prisma.patient.findUniqueOrThrow({ where: { id: act.pat } });
    await prisma.activityEvent.upsert({
      where: { id: act.id },
      create: {
        id: act.id,
        type: act.type,
        title: act.title,
        description: act.desc,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientId: act.pat,
        timestamp: date(10, 14, 15),
        userId: act.user,
        organizationId: act.org,
      },
      update: {
        title: act.title,
        description: act.desc,
        patientName: `${patient.firstName} ${patient.lastName}`,
      },
    });
  }

  console.log("\n✅ Ample Texas sales demo seed data created successfully!");
  console.log("   • 8 Organizations (4 hospital systems, 4 facility alliances)");
  console.log("   • 6 Major Texas Hospital Medical Centers");
  console.log("   • 18 Clinical & Administrative Staff Members");
  console.log("   • 28 Facilities across 6 Texas Metros (6 with full 3D Virtual Tours)");
  console.log("   • 44 Diverse Patients with detailed clinical narratives");
  console.log("   • 25 Patient Placements across lifecycle stages");
  console.log("   • 24 Referrals across complete pipeline (Draft, Sent, Accepted, Declined, Converted)");
  console.log("   • Electronic contracts, signatures, demo payments & bed reservations");
  console.log("   • 12 Live Dashboard Activity Events\n");
}

// ── Standalone execution runner ───────────────────────────────────────────────
if (process.argv[1] && process.argv[1].includes("seed-ample")) {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  seedAmple(prisma)
    .catch((e) => {
      console.error("❌ Seed failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
