import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { UserRole, FacilityType, CareLevel, OrganizationType } from "../src/generated/prisma/enums";
import { seedFacilityDemoPhotos } from "./facility-demo-photos";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const DEFAULT_PASSWORD = "CareBridge2026!";

// ── Type helpers ──

type FacilitySeed = {
  id: string;
  name: string;
  description: string;
  type: FacilityType;
  street: string;
  city: string;
  zip: string;
  county: string;
  phone: string;
  email: string;
  website: string;
  capacity: number;
  careLevels: CareLevel[];
  specialties: string[];
  insuranceAccepted: string[];
  rating: number;
  reviewsCount: number;
  hasAvailability: boolean;
  waitlistDays: number | null;
  acceptsMedicare: boolean;
  acceptsMedicaid: boolean;
  orgId: string;
};

type OrgSeed = {
  id: string;
  name: string;
  slug: string;
};

type UserSeed = {
  email: string;
  firstName: string;
  lastName: string;
  role: keyof typeof USER_ROLE_MAP;
  title: string;
  department: string;
  organizationId: string;
  facilityId: string;
};

const USER_ROLE_MAP: Record<string, UserRole> = {
  social_worker: "social_worker" as UserRole,
  discharge_planner: "discharge_planner" as UserRole,
  administrator: "administrator" as UserRole,
  facility_coordinator: "facility_coordinator" as UserRole,
  superadmin: "superadmin" as UserRole,
};

// ── Orgs ──

const FACILITY_ORGS: OrgSeed[] = [
  { id: "org-fac-001", name: "Pacific Northwest Care Alliance", slug: "pacific-nw-care-alliance" },
  { id: "org-fac-002", name: "Willamette Valley Senior Care Network", slug: "willamette-valley-senior-care" },
  { id: "org-fac-003", name: "Cascade Health Partners", slug: "cascade-health-partners" },
  { id: "org-fac-004", name: "Oregon Community Care", slug: "oregon-community-care" },
];

// ── Facilities ──

const FACILITIES: FacilitySeed[] = [
  // ── Pacific Northwest Care Alliance (org-fac-001) ──
  {
    id: "fac-008", name: "Columbia River Wellness Center",
    description: "A premier assisted living community overlooking the Columbia River, offering personalized care plans and vibrant social activities.",
    type: "assisted_living" as FacilityType,
    street: "450 Riverfront Drive", city: "Portland", zip: "97201", county: "Multnomah",
    phone: "(503) 555-8100", email: "wellness@pnwcare.org", website: "https://columbiawellness.pnwcare.org",
    capacity: 90, careLevels: ["assisted_living" as CareLevel, "independent_living" as CareLevel, "memory_care" as CareLevel],
    specialties: ["Memory care", "Medication management", "Physical therapy", "Social programs"],
    insuranceAccepted: ["Medicare", "Private Pay", "Long-term care insurance"],
    rating: 4.3, reviewsCount: 72, hasAvailability: true, waitlistDays: 10, acceptsMedicare: true, acceptsMedicaid: false,
    orgId: "org-fac-001",
  },
  {
    id: "fac-009", name: "Northwest Palliative & Hospice Care",
    description: "Compassionate end-of-life care and palliative support services for patients and families across the Portland metro area.",
    type: "hospice" as FacilityType,
    street: "220 Comfort Lane", city: "Portland", zip: "97210", county: "Multnomah",
    phone: "(503) 555-8200", email: "hospice@pnwcare.org", website: "https://nwpalliative.pnwcare.org",
    capacity: 60, careLevels: ["hospice" as CareLevel, "home_health" as CareLevel],
    specialties: ["Palliative care", "Pain management", "Bereavement support", "24/7 nursing"],
    insuranceAccepted: ["Medicare", "Medicaid", "Private Pay"],
    rating: 4.8, reviewsCount: 44, hasAvailability: true, waitlistDays: null, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-001",
  },
  {
    id: "fac-010", name: "Portland Metro Home Health Services",
    description: "Comprehensive home health services including skilled nursing, physical therapy, and occupational therapy delivered in the comfort of home.",
    type: "home_health_agency" as FacilityType,
    street: "880 NE 7th Avenue", city: "Portland", zip: "97232", county: "Multnomah",
    phone: "(503) 555-8300", email: "homehealth@pnwcare.org", website: "https://metropdxhomehealth.pnwcare.org",
    capacity: 250, careLevels: ["home_health" as CareLevel, "hospice" as CareLevel],
    specialties: ["Skilled nursing", "Physical therapy", "Occupational therapy", "Wound care", "Infusion therapy"],
    insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Providence", "Aetna"],
    rating: 4.5, reviewsCount: 118, hasAvailability: true, waitlistDays: 2, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-001",
  },
  {
    id: "fac-011", name: "Gresham Transitional Care Center",
    description: "Short-term skilled nursing and rehabilitation for patients transitioning from hospital to home, with 24/7 medical supervision.",
    type: "skilled_nursing_facility" as FacilityType,
    street: "1550 East Powell Boulevard", city: "Gresham", zip: "97030", county: "Multnomah",
    phone: "(503) 555-8400", email: "transitional@pnwcare.org", website: "https://greshamtc.pnwcare.org",
    capacity: 100, careLevels: ["skilled_nursing" as CareLevel, "rehabilitation" as CareLevel],
    specialties: ["Post-surgical recovery", "Stroke rehabilitation", "IV therapy", "Wound management"],
    insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Cigna"],
    rating: 4.0, reviewsCount: 56, hasAvailability: true, waitlistDays: 5, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-001",
  },
  {
    id: "fac-025", name: "Tualatin Valley Home Care",
    description: "Professional home health aides and skilled nursing services for seniors in Washington County.",
    type: "home_health_agency" as FacilityType,
    street: "7325 SW Hazelfern Road", city: "Tigard", zip: "97224", county: "Washington",
    phone: "(503) 555-8900", email: "tualatin@pnwcare.org", website: "https://tualatinhomecare.pnwcare.org",
    capacity: 160, careLevels: ["home_health" as CareLevel],
    specialties: ["Personal care", "Companionship", "Meal preparation", "Medication reminders"],
    insuranceAccepted: ["Medicare", "Medicaid", "Private Pay"],
    rating: 4.2, reviewsCount: 33, hasAvailability: true, waitlistDays: 1, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-001",
  },

  // ── Willamette Valley Senior Care Network (org-fac-002) ──
  {
    id: "fac-012", name: "Salem Senior Living Community",
    description: "A vibrant assisted living community in the heart of the Willamette Valley with independent living options and memory care.",
    type: "assisted_living" as FacilityType,
    street: "2600 Center Street NE", city: "Salem", zip: "97301", county: "Marion",
    phone: "(503) 555-9100", email: "info@saleMLiving.org", website: "https://salemseniorliving.org",
    capacity: 110, careLevels: ["independent_living" as CareLevel, "assisted_living" as CareLevel, "memory_care" as CareLevel],
    specialties: ["Alzheimer's care", "Dementia care", "Social activities", "Wellness programs"],
    insuranceAccepted: ["Medicare", "Private Pay", "Long-term care insurance"],
    rating: 4.4, reviewsCount: 89, hasAvailability: true, waitlistDays: 14, acceptsMedicare: true, acceptsMedicaid: false,
    orgId: "org-fac-002",
  },
  {
    id: "fac-013", name: "Eugene Rehabilitation & Recovery Center",
    description: "State-of-the-art rehabilitation center specializing in orthopedic and neurological recovery with dedicated therapy gyms.",
    type: "rehabilitation_center" as FacilityType,
    street: "1776 River Road", city: "Eugene", zip: "97404", county: "Lane",
    phone: "(541) 555-9200", email: "rehab@eugenerecovery.org", website: "https://eugenerehab.org",
    capacity: 80, careLevels: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
    specialties: ["Orthopedic rehab", "Neurological rehab", "Sports medicine", "Aquatic therapy"],
    insuranceAccepted: ["Medicare", "Blue Cross", "Providence", "PacificSource"],
    rating: 4.6, reviewsCount: 134, hasAvailability: false, waitlistDays: 18, acceptsMedicare: true, acceptsMedicaid: false,
    orgId: "org-fac-002",
  },
  {
    id: "fac-014", name: "Corvallis Long-Term Care Residence",
    description: "Comfortable long-term care residence offering round-the-clock skilled nursing and personalized care plans for chronic conditions.",
    type: "long_term_care" as FacilityType,
    street: "850 NW 9th Street", city: "Corvallis", zip: "97330", county: "Benton",
    phone: "(541) 555-9300", email: "info@corvallislrc.org", website: "https://corvallislrc.org",
    capacity: 120, careLevels: ["long_term_care" as CareLevel, "skilled_nursing" as CareLevel],
    specialties: ["Chronic disease management", "Wound care", "Palliative care", "Respiratory therapy"],
    insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross"],
    rating: 4.1, reviewsCount: 67, hasAvailability: true, waitlistDays: 7, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-002",
  },
  {
    id: "fac-015", name: "Springfield Home Health Services",
    description: "Trusted home health agency serving Lane County with skilled nursing, therapy, and personal care services.",
    type: "home_health_agency" as FacilityType,
    street: "440 Olympic Street", city: "Springfield", zip: "97477", county: "Lane",
    phone: "(541) 555-9400", email: "care@springfieldhh.org", website: "https://springfieldhh.org",
    capacity: 140, careLevels: ["home_health" as CareLevel, "hospice" as CareLevel],
    specialties: ["Skilled nursing", "Home health aide", "Physical therapy", "Speech therapy"],
    insuranceAccepted: ["Medicare", "Medicaid", "PacificSource", "Blue Cross"],
    rating: 4.3, reviewsCount: 51, hasAvailability: true, waitlistDays: 3, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-002",
  },
  {
    id: "fac-016", name: "Albany Memory Care Center",
    description: "Specialized memory care community designed for seniors with Alzheimer's and other forms of dementia, featuring secure outdoor gardens.",
    type: "assisted_living" as FacilityType,
    street: "3200 Santiam Highway SE", city: "Albany", zip: "97322", county: "Linn",
    phone: "(541) 555-9500", email: "info@albanymemory.org", website: "https://albanymemory.org",
    capacity: 55, careLevels: ["assisted_living" as CareLevel, "memory_care" as CareLevel, "long_term_care" as CareLevel],
    specialties: ["Alzheimer's care", "Dementia care", "Behavioral management", "Music therapy"],
    insuranceAccepted: ["Medicare", "Medicaid", "Private Pay"],
    rating: 4.7, reviewsCount: 38, hasAvailability: true, waitlistDays: 21, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-002",
  },

  // ── Cascade Health Partners (org-fac-003) ──
  {
    id: "fac-017", name: "Bend Rehabilitation Institute",
    description: "Central Oregon's premier rehabilitation facility combining mountain views with advanced therapy programs for orthopedic and sports injuries.",
    type: "rehabilitation_center" as FacilityType,
    street: "2200 NE Neff Road", city: "Bend", zip: "97701", county: "Deschutes",
    phone: "(541) 555-6100", email: "admissions@bendrehab.org", website: "https://bendrehab.org",
    capacity: 75, careLevels: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
    specialties: ["Orthopedic rehab", "Sports medicine", "Joint replacement recovery", "Physical therapy"],
    insuranceAccepted: ["Medicare", "Blue Cross", "Providence", "PacificSource"],
    rating: 4.5, reviewsCount: 98, hasAvailability: true, waitlistDays: 8, acceptsMedicare: true, acceptsMedicaid: false,
    orgId: "org-fac-003",
  },
  {
    id: "fac-018", name: "Sisters of Mercy Hospice House",
    description: "A peaceful hospice facility nestled in the Cascade foothills, providing comfort and dignity for patients with life-limiting illnesses.",
    type: "hospice" as FacilityType,
    street: "450 McKenzie Highway", city: "Sisters", zip: "97759", county: "Deschutes",
    phone: "(541) 555-6200", email: "care@sistershospice.org", website: "https://sistershospice.org",
    capacity: 25, careLevels: ["hospice" as CareLevel],
    specialties: ["End-of-life care", "Pain management", "Spiritual care", "Bereavement counseling"],
    insuranceAccepted: ["Medicare", "Medicaid", "Private Pay"],
    rating: 4.9, reviewsCount: 29, hasAvailability: true, waitlistDays: null, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-003",
  },
  {
    id: "fac-019", name: "Redmond Skilled Nursing & Rehabilitation",
    description: "Full-service skilled nursing facility offering short-term rehab and long-term care for residents of Central Oregon.",
    type: "skilled_nursing_facility" as FacilityType,
    street: "1255 NW Canal Boulevard", city: "Redmond", zip: "97756", county: "Deschutes",
    phone: "(541) 555-6300", email: "info@redmondsnf.org", website: "https://redmondsnf.org",
    capacity: 110, careLevels: ["skilled_nursing" as CareLevel, "long_term_care" as CareLevel, "rehabilitation" as CareLevel],
    specialties: ["Post-surgical care", "Stroke rehabilitation", "Wound management", "IV therapy"],
    insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Cigna"],
    rating: 3.9, reviewsCount: 82, hasAvailability: true, waitlistDays: 4, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-003",
  },
  {
    id: "fac-020", name: "Prineville Assisted Living & Memory Care",
    description: "Small-town assisted living community with a strong focus on memory care and personalized attention in Crook County.",
    type: "assisted_living" as FacilityType,
    street: "880 East 3rd Street", city: "Prineville", zip: "97754", county: "Crook",
    phone: "(541) 555-6400", email: "info@prinevillealc.org", website: "https://prinevillealc.org",
    capacity: 48, careLevels: ["assisted_living" as CareLevel, "memory_care" as CareLevel],
    specialties: ["Memory care", "Medication management", "Daily living assistance", "Social programs"],
    insuranceAccepted: ["Medicare", "Private Pay", "Long-term care insurance"],
    rating: 4.2, reviewsCount: 27, hasAvailability: true, waitlistDays: 12, acceptsMedicare: true, acceptsMedicaid: false,
    orgId: "org-fac-003",
  },
  {
    id: "fac-026", name: "Sunriver Wellness & Rehabilitation",
    description: "A holistic wellness-focused rehabilitation center offering physical therapy, occupational therapy, and wellness programs in a resort-like setting.",
    type: "rehabilitation_center" as FacilityType,
    street: "57000 Beaver Drive", city: "Sunriver", zip: "97707", county: "Deschutes",
    phone: "(541) 555-6500", email: "wellness@sunriverrehab.org", website: "https://sunriverrehab.org",
    capacity: 45, careLevels: ["rehabilitation" as CareLevel],
    specialties: ["Physical therapy", "Occupational therapy", "Wellness programs", "Aquatic therapy"],
    insuranceAccepted: ["Medicare", "Blue Cross", "Providence"],
    rating: 4.7, reviewsCount: 41, hasAvailability: true, waitlistDays: 14, acceptsMedicare: true, acceptsMedicaid: false,
    orgId: "org-fac-003",
  },

  // ── Oregon Community Care (org-fac-004) ──
  {
    id: "fac-021", name: "Hillsboro Home Health & Hospice",
    description: "Serving Washington County with comprehensive home health and hospice services, from post-surgical care to end-of-life support.",
    type: "home_health_agency" as FacilityType,
    street: "23000 NW Evergreen Parkway", city: "Hillsboro", zip: "97124", county: "Washington",
    phone: "(503) 555-7100", email: "care@hillsborohomehealth.org", website: "https://hillsborohomehealth.org",
    capacity: 200, careLevels: ["home_health" as CareLevel, "hospice" as CareLevel],
    specialties: ["Skilled nursing", "Home health aide", "Physical therapy", "Palliative care"],
    insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Kaiser", "Providence"],
    rating: 4.4, reviewsCount: 93, hasAvailability: true, waitlistDays: 1, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-004",
  },
  {
    id: "fac-022", name: "Beaverton Long-Term Care Residence",
    description: "A warm, family-oriented long-term care residence offering skilled nursing and personal care in a home-like environment.",
    type: "long_term_care" as FacilityType,
    street: "4900 SW 114th Avenue", city: "Beaverton", zip: "97005", county: "Washington",
    phone: "(503) 555-7200", email: "info@beavertonltc.org", website: "https://beavertonltc.org",
    capacity: 95, careLevels: ["long_term_care" as CareLevel, "skilled_nursing" as CareLevel],
    specialties: ["Chronic care", "Wound management", "Respiratory care", "Palliative care"],
    insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Private Pay"],
    rating: 4.0, reviewsCount: 61, hasAvailability: true, waitlistDays: 9, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-004",
  },
  {
    id: "fac-023", name: "Tigard Memory Support Community",
    description: "A dedicated memory care community with specially trained staff, secure surroundings, and evidence-based cognitive support programs.",
    type: "assisted_living" as FacilityType,
    street: "11950 SW King James Place", city: "Tigard", zip: "97224", county: "Washington",
    phone: "(503) 555-7300", email: "info@tigardmemory.org", website: "https://tigardmemory.org",
    capacity: 45, careLevels: ["assisted_living" as CareLevel, "memory_care" as CareLevel],
    specialties: ["Alzheimer's care", "Dementia care", "Cognitive therapy", "Music & art therapy"],
    insuranceAccepted: ["Medicare", "Private Pay", "Long-term care insurance"],
    rating: 4.6, reviewsCount: 34, hasAvailability: false, waitlistDays: 30, acceptsMedicare: true, acceptsMedicaid: false,
    orgId: "org-fac-004",
  },
  {
    id: "fac-024", name: "Lake Oswego Rehabilitation & Wellness",
    description: "Premier rehabilitation center offering one-on-one therapy, state-of-the-art equipment, and a luxurious healing environment.",
    type: "rehabilitation_center" as FacilityType,
    street: "3600 South Shore Boulevard", city: "Lake Oswego", zip: "97035", county: "Clackamas",
    phone: "(503) 555-7400", email: "info@lorehab.org", website: "https://lorehab.org",
    capacity: 60, careLevels: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
    specialties: ["Orthopedic rehab", "Neurological rehab", "Sports therapy", "Hand therapy"],
    insuranceAccepted: ["Medicare", "Blue Cross", "Providence", "Private Pay"],
    rating: 4.8, reviewsCount: 76, hasAvailability: true, waitlistDays: 10, acceptsMedicare: true, acceptsMedicaid: false,
    orgId: "org-fac-004",
  },
  {
    id: "fac-027", name: "Clackamas Community Home Health",
    description: "Bringing quality home health services to families across Clackamas County with personalized care plans and responsive support.",
    type: "home_health_agency" as FacilityType,
    street: "8500 SE Sunnybrook Boulevard", city: "Clackamas", zip: "97015", county: "Clackamas",
    phone: "(503) 555-7500", email: "care@clackamashomehealth.org", website: "https://clackamashomehealth.org",
    capacity: 130, careLevels: ["home_health" as CareLevel],
    specialties: ["Skilled nursing", "Physical therapy", "Occupational therapy", "Speech therapy"],
    insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Kaiser"],
    rating: 4.1, reviewsCount: 47, hasAvailability: true, waitlistDays: 2, acceptsMedicare: true, acceptsMedicaid: true,
    orgId: "org-fac-004",
  },
];

const FACILITY_USERS: UserSeed[] = [
  // ── Pacific Northwest Care Alliance (org-fac-001) ──
  {
    email: "sandra.weiss@pnwcare.org",
    firstName: "Sandra", lastName: "Weiss",
    role: "facility_coordinator",
    title: "Clinical Director", department: "Clinical Services",
    organizationId: "org-fac-001", facilityId: "fac-008",
  },
  {
    email: "david.nguyen@pnwcare.org",
    firstName: "David", lastName: "Nguyen",
    role: "facility_coordinator",
    title: "Hospice Director", department: "Hospice Services",
    organizationId: "org-fac-001", facilityId: "fac-009",
  },
  {
    email: "rachel.green@pnwcare.org",
    firstName: "Rachel", lastName: "Green",
    role: "facility_coordinator",
    title: "Clinical Director", department: "Home Health",
    organizationId: "org-fac-001", facilityId: "fac-010",
  },
  // ── Willamette Valley Senior Care Network (org-fac-002) ──
  {
    email: "margaret.oneill@wvseniorcare.org",
    firstName: "Margaret", lastName: "O'Neill",
    role: "facility_coordinator",
    title: "Executive Director", department: "Administration",
    organizationId: "org-fac-002", facilityId: "fac-012",
  },
  {
    email: "jason.wu@wvseniorcare.org",
    firstName: "Jason", lastName: "Wu",
    role: "facility_coordinator",
    title: "Rehab Director", department: "Therapy Services",
    organizationId: "org-fac-002", facilityId: "fac-013",
  },
  {
    email: "catherine.smith@wvseniorcare.org",
    firstName: "Catherine", lastName: "Smith",
    role: "facility_coordinator",
    title: "Admissions Coordinator", department: "Admissions",
    organizationId: "org-fac-002", facilityId: "fac-016",
  },
  // ── Cascade Health Partners (org-fac-003) ──
  {
    email: "kevin.johnson@cascadehp.org",
    firstName: "Kevin", lastName: "Johnson",
    role: "facility_coordinator",
    title: "Director of Therapy", department: "Rehabilitation",
    organizationId: "org-fac-003", facilityId: "fac-017",
  },
  {
    email: "susan.parker@cascadehp.org",
    firstName: "Susan", lastName: "Parker",
    role: "facility_coordinator",
    title: "Hospice Director", department: "Hospice",
    organizationId: "org-fac-003", facilityId: "fac-018",
  },
  {
    email: "michael.torres@cascadehp.org",
    firstName: "Michael", lastName: "Torres",
    role: "facility_coordinator",
    title: "Administrator", department: "Operations",
    organizationId: "org-fac-003", facilityId: "fac-019",
  },
  // ── Oregon Community Care (org-fac-004) ──
  {
    email: "laura.martinez@orcommunitycare.org",
    firstName: "Laura", lastName: "Martinez",
    role: "facility_coordinator",
    title: "Clinical Director", department: "Home Health",
    organizationId: "org-fac-004", facilityId: "fac-021",
  },
  {
    email: "daniel.cho@orcommunitycare.org",
    firstName: "Daniel", lastName: "Cho",
    role: "facility_coordinator",
    title: "Administrator", department: "Long-Term Care",
    organizationId: "org-fac-004", facilityId: "fac-022",
  },
  {
    email: "amanda.foster@orcommunitycare.org",
    firstName: "Amanda", lastName: "Foster",
    role: "facility_coordinator",
    title: "Memory Care Director", department: "Memory Care",
    organizationId: "org-fac-004", facilityId: "fac-023",
  },
];

// ── Seed functions ──

async function seedOrg(id: string, name: string, slug: string) {
  await prisma.organization.upsert({
    where: { id },
    update: { name, slug, type: "facility" as OrganizationType },
    create: { id, name, slug, type: "facility" as OrganizationType },
  });
  console.log(`    ✔ ${id} — ${name}`);
}

async function seedFacility(f: FacilitySeed) {
  await prisma.facility.upsert({
    where: { id: f.id },
    update: {},
    create: {
      id: f.id,
      name: f.name,
      description: f.description,
      type: f.type,
      address: JSON.stringify({
        street: f.street,
        city: f.city,
        state: "OR",
        zipCode: f.zip,
        county: f.county,
      }),
      phone: f.phone,
      email: f.email,
      website: f.website,
      contacts: JSON.stringify([]),
      licensure: [],
      accreditations: [],
      capacity: f.capacity,
      currentOccupancy: Math.round(f.capacity * (0.6 + Math.random() * 0.35)),
      insuranceAccepted: f.insuranceAccepted,
      careLevelsOffered: f.careLevels,
      specialties: f.specialties,
      rating: f.rating,
      reviewsCount: f.reviewsCount,
      hasAvailability: f.hasAvailability,
      waitlistDays: f.waitlistDays,
      acceptsMedicare: f.acceptsMedicare,
      acceptsMedicaid: f.acceptsMedicaid,
      organization: { connect: { id: f.orgId } },
    },
  });
  console.log(`    ✔ ${f.id} — ${f.name}`);
}

async function syncUser(u: UserSeed) {
  const roleKebab = u.role.replace(/_/g, "-");
  const dbRole = USER_ROLE_MAP[u.role];

  let clerkUser;
  try {
    const existing = await clerk.users.getUserList({ emailAddress: [u.email], limit: 1 });
    if (existing.data.length > 0) {
      clerkUser = existing.data[0];
      console.log(`    ↻ Clerk user exists: ${clerkUser.id} — ${u.email}`);
      await clerk.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: {
          role: roleKebab,
          organizationId: u.organizationId,
        },
      });
    } else {
      clerkUser = await clerk.users.createUser({
        emailAddress: [u.email],
        password: DEFAULT_PASSWORD,
        firstName: u.firstName,
        lastName: u.lastName,
        publicMetadata: {
          role: roleKebab,
          organizationId: u.organizationId,
        },
      });
      console.log(`    ✔ Created Clerk user: ${clerkUser.id} — ${u.email}`);
    }
  } catch (err: any) {
    console.error(`    ❌ Failed Clerk user ${u.email}: ${err.message ?? err}`);
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          id: clerkUser.id,
          firstName: u.firstName,
          lastName: u.lastName,
          role: dbRole,
          title: u.title,
          department: u.department,
          hospitalId: u.facilityId,
          organizationId: u.organizationId,
          avatarUrl: clerkUser.imageUrl ?? undefined,
        },
      });
      console.log(`    ✔ DB user updated: ${u.email}`);
    } else {
      await prisma.user.create({
        data: {
          id: clerkUser.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: dbRole,
          title: u.title,
          department: u.department,
          hospitalId: u.facilityId,
          phone: "",
          organization: { connect: { id: u.organizationId } },
        },
      });
      console.log(`    ✔ DB user created: ${u.email}`);
    }
  } catch (err: any) {
    console.error(`    ❌ Failed DB user ${u.email}: ${err.message ?? err}`);
  }
}

// ── Main ──

async function main() {
  console.log("🏥 Seeding care facilities...\n");

  console.log("  Facility organizations...");
  for (const org of FACILITY_ORGS) {
    await seedOrg(org.id, org.name, org.slug);
  }

  console.log("\n  Facilities...");
  for (const f of FACILITIES) {
    await seedFacility(f);
  }

  console.log("\n  Facility demo photos...");
  const photoCount = await seedFacilityDemoPhotos(
    prisma,
    FACILITIES.map((f) => f.id),
  );
  console.log(`    ✔ ${photoCount} facility media records`);

  console.log("\n  Facility users...");
  for (const u of FACILITY_USERS) {
    await syncUser(u);
  }

  console.log(`\n✅ Done! ${FACILITIES.length} facilities across ${FACILITY_ORGS.length} orgs, ${FACILITY_USERS.length} users synced.`);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
