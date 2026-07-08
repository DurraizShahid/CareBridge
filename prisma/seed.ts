import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ── Adapter ──
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ── Helpers ──
// Convert the string IDs (like "usr-001") from mock data to match Prisma schema
// JSON.stringify for complex objects that map to Json fields

async function main() {
  console.log("🌱 Seeding CareBridge database...\n");

  // ── 1. Seed Organizations ──
  console.log("  Seeding organizations...");

  await prisma.organization.upsert({
    where: { id: "org-001" },
    update: {},
    create: {
      id: "org-001",
      name: "Mercy Hospital Portland",
      slug: "mercy-hospital-portland",
      type: "hospital",
    },
  });
  console.log("    ✔ org-001 — Mercy Hospital Portland");

  await prisma.organization.upsert({
    where: { id: "org-002" },
    update: {},
    create: {
      id: "org-002",
      name: "Providence Health System",
      slug: "providence-health",
      type: "hospital",
    },
  });
  console.log("    ✔ org-002 — Providence Health System");

  await prisma.organization.upsert({
    where: { id: "org-003" },
    update: {},
    create: {
      id: "org-003",
      name: "OHSU Health",
      slug: "ohsu-health",
      type: "hospital",
    },
  });
  console.log("    ✔ org-003 — OHSU Health");

  // ── 2. Seed Users ──
  console.log("  Seeding users...");

  // Hospital Staff
  await prisma.user.upsert({
    where: { id: "usr-001" },
    update: {},
    create: {
      id: "usr-001",
      email: "sjohnson@mercyhospital.org",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "social_worker",
      title: "Senior Social Worker",
      department: "Discharge Planning",
      hospitalId: "hosp-001",
      phone: "(555) 234-5678",
      organization: { connect: { id: "org-001" } },
      createdAt: new Date("2024-09-01T08:00:00Z"),
      updatedAt: new Date("2026-07-01T12:00:00Z"),
    },
  });
  console.log("    ✔ usr-001 — Sarah Johnson (social_worker)");

  await prisma.user.upsert({
    where: { id: "usr-002" },
    update: {},
    create: {
      id: "usr-002",
      email: "jdoe@mercyhospital.org",
      firstName: "James",
      lastName: "Doe",
      role: "discharge_planner",
      title: "Discharge Planner",
      department: "Discharge Planning",
      hospitalId: "hosp-001",
      phone: "(555) 234-5679",
      organization: { connect: { id: "org-001" } },
      createdAt: new Date("2024-10-15T08:00:00Z"),
      updatedAt: new Date("2026-06-15T12:00:00Z"),
    },
  });
  console.log("    ✔ usr-002 — James Doe (discharge_planner)");

  await prisma.user.upsert({
    where: { id: "usr-003" },
    update: {},
    create: {
      id: "usr-003",
      email: "asmith@mercyhospital.org",
      firstName: "Amanda",
      lastName: "Smith",
      role: "administrator",
      title: "Department Administrator",
      department: "Discharge Planning",
      hospitalId: "hosp-001",
      phone: "(555) 234-5680",
      organization: { connect: { id: "org-001" } },
      createdAt: new Date("2023-03-01T08:00:00Z"),
      updatedAt: new Date("2026-07-05T12:00:00Z"),
    },
  });
  console.log("    ✔ usr-003 — Amanda Smith (administrator)");

  // Facility Operators
  await prisma.user.upsert({
    where: { id: "usr-fac-001" },
    update: {},
    create: {
      id: "usr-fac-001",
      email: "pmoore@willametterehab.org",
      firstName: "Patricia",
      lastName: "Moore",
      role: "facility_coordinator",
      title: "Admissions Director",
      department: "Admissions",
      hospitalId: "fac-001",
      phone: "(503) 555-1001",
      organization: { connect: { id: "org-001" } },
      createdAt: new Date("2024-01-15T00:00:00Z"),
      updatedAt: new Date("2026-07-01T00:00:00Z"),
    },
  });
  console.log("    ✔ usr-fac-001 — Patricia Moore (facility_coordinator)");

  await prisma.user.upsert({
    where: { id: "usr-fac-002" },
    update: {},
    create: {
      id: "usr-fac-002",
      email: "mchen@stfranciscare.org",
      firstName: "Michael",
      lastName: "Chen",
      role: "facility_coordinator",
      title: "Executive Director",
      department: "Administration",
      hospitalId: "fac-002",
      phone: "(503) 555-2001",
      organization: { connect: { id: "org-001" } },
      createdAt: new Date("2023-06-01T00:00:00Z"),
      updatedAt: new Date("2026-06-28T00:00:00Z"),
    },
  });
  console.log("    ✔ usr-fac-002 — Michael Chen (facility_coordinator)");

  // Super Admin
  await prisma.user.upsert({
    where: { id: "usr-admin-001" },
    update: {},
    create: {
      id: "usr-admin-001",
      email: "admin@carebridgehealth.com",
      firstName: "Admin",
      lastName: "User",
      role: "superadmin",
      title: "System Administrator",
      department: "Operations",
      hospitalId: "hosp-001",
      phone: "(555) 000-0001",
      organization: { connect: { id: "org-001" } },
      createdAt: new Date("2023-01-01T08:00:00Z"),
      updatedAt: new Date("2026-07-08T12:00:00Z"),
    },
  });
  console.log("    ✔ usr-admin-001 — Admin User (superadmin)");

  // ── 3. Seed Hospitals ──
  console.log("  Seeding hospitals...");

  await prisma.hospital.upsert({
    where: { id: "hosp-001" },
    update: {},
    create: {
      id: "hosp-001",
      name: "Mercy Hospital Portland",
      address: JSON.stringify({
        street: "1000 Medical Center Drive",
        city: "Portland",
        state: "OR",
        zipCode: "97201",
      }),
      phone: "(503) 555-0000",
      npi: "1234567890",
      organization: { connect: { id: "org-001" } },
    },
  });
  console.log("    ✔ hosp-001 — Mercy Hospital Portland");

  await prisma.hospital.upsert({
    where: { id: "hosp-002" },
    update: {},
    create: {
      id: "hosp-002",
      name: "Providence St. Vincent Medical Center",
      address: JSON.stringify({
        street: "9205 SW Barnes Road",
        city: "Portland",
        state: "OR",
        zipCode: "97225",
      }),
      phone: "(503) 555-0200",
      npi: "1234567891",
      organization: { connect: { id: "org-002" } },
    },
  });
  console.log("    ✔ hosp-002 — Providence St. Vincent Medical Center");

  await prisma.hospital.upsert({
    where: { id: "hosp-003" },
    update: {},
    create: {
      id: "hosp-003",
      name: "Oregon Health & Science University",
      address: JSON.stringify({
        street: "3181 SW Sam Jackson Park Road",
        city: "Portland",
        state: "OR",
        zipCode: "97239",
      }),
      phone: "(503) 555-0300",
      npi: "1234567892",
      organization: { connect: { id: "org-003" } },
    },
  });
  console.log("    ✔ hosp-003 — Oregon Health & Science University");

  await prisma.hospital.upsert({
    where: { id: "hosp-004" },
    update: {},
    create: {
      id: "hosp-004",
      name: "Legacy Emanuel Medical Center",
      address: JSON.stringify({
        street: "2801 N Gantenbein Avenue",
        city: "Portland",
        state: "OR",
        zipCode: "97227",
      }),
      phone: "(503) 555-0400",
      npi: "1234567893",
      organization: { connect: { id: "org-001" } },
    },
  });
  console.log("    ✔ hosp-004 — Legacy Emanuel Medical Center");

  // ── 4. Seed Patients ──
  console.log("  Seeding patients...");

  // Patient 1: Eleanor Roosevelt
  await prisma.patient.upsert({
    where: { id: "pat-001" },
    update: {},
    create: {
      id: "pat-001",
      mrn: "MRN-88472",
      firstName: "Eleanor",
      lastName: "Roosevelt",
      dateOfBirth: new Date("1942-03-15"),
      age: 84,
      gender: "female",
      address: JSON.stringify({
        street: "42 Maple Avenue",
        city: "Portland",
        state: "OR",
        zipCode: "97201",
        county: "Multnomah",
      }),
      phone: "(503) 555-1212",
      emergencyContact: JSON.stringify({
        name: "James Roosevelt",
        role: "Son",
        phone: "(503) 555-3434",
        email: "james.r@email.com",
      }),
      insurance: JSON.stringify([
        {
          provider: "Medicare Part A & B",
          policyNumber: "MED-88472-A",
          type: "medicare",
          status: "verified",
        },
      ]),
      primaryDiagnosis: "Hip fracture (post-surgical)",
      secondaryDiagnoses: ["Hypertension", "Type 2 diabetes", "Osteoporosis"],
      careLevelRequired: "skilled_nursing",
      notes:
        "Patient lives alone. Two-story home with stairs. Requires 6-8 weeks of rehab post-hip replacement.",
      socialWorkerId: "usr-001",
      hospitalId: "hosp-001",
      organizationId: "org-001",
      admissionDate: new Date("2026-06-28T14:30:00Z"),
      estimatedDischargeDate: new Date("2026-07-10T00:00:00Z"),
      status: "ready_for_discharge",
      createdAt: new Date("2026-06-28T14:30:00Z"),
      updatedAt: new Date("2026-07-07T09:00:00Z"),
    },
  });
  console.log("    ✔ pat-001 — Eleanor Roosevelt");

  // Patient 2: George Washington
  await prisma.patient.upsert({
    where: { id: "pat-002" },
    update: {},
    create: {
      id: "pat-002",
      mrn: "MRN-89103",
      firstName: "George",
      lastName: "Washington",
      dateOfBirth: new Date("1938-07-22"),
      age: 87,
      gender: "male",
      address: JSON.stringify({
        street: "1888 Liberty Street",
        city: "Portland",
        state: "OR",
        zipCode: "97204",
      }),
      phone: "(503) 555-9876",
      emergencyContact: JSON.stringify({
        name: "Martha Washington",
        role: "Daughter",
        phone: "(503) 555-5656",
        email: "martha.w@email.com",
      }),
      insurance: JSON.stringify([
        {
          provider: "Medicare Advantage",
          policyNumber: "MA-89103-B",
          type: "medicare",
          status: "active",
        },
        {
          provider: "Aetna Supplemental",
          policyNumber: "AET-44567",
          type: "private",
          status: "verified",
        },
      ]),
      primaryDiagnosis: "Cerebrovascular accident (CVA) - Ischemic stroke",
      secondaryDiagnoses: ["Atrial fibrillation", "Hyperlipidemia", "History of TIA"],
      careLevelRequired: "rehabilitation",
      notes:
        "Right-sided weakness. Needs intensive PT/OT. Unable to return home without 24/7 support.",
      socialWorkerId: "usr-001",
      hospitalId: "hosp-001",
      organizationId: "org-001",
      admissionDate: new Date("2026-07-01T11:00:00Z"),
      estimatedDischargeDate: new Date("2026-07-15T00:00:00Z"),
      status: "assessment_in_progress",
      createdAt: new Date("2026-07-01T11:00:00Z"),
      updatedAt: new Date("2026-07-06T16:00:00Z"),
    },
  });
  console.log("    ✔ pat-002 — George Washington");

  // Patient 3: Maria Garcia
  await prisma.patient.upsert({
    where: { id: "pat-003" },
    update: {},
    create: {
      id: "pat-003",
      mrn: "MRN-90345",
      firstName: "Maria",
      lastName: "Garcia",
      dateOfBirth: new Date("1955-11-02"),
      age: 70,
      gender: "female",
      address: JSON.stringify({
        street: "750 Cedar Lane",
        city: "Beaverton",
        state: "OR",
        zipCode: "97005",
        county: "Washington",
      }),
      phone: "(503) 555-3344",
      emergencyContact: JSON.stringify({
        name: "Carlos Garcia",
        role: "Spouse",
        phone: "(503) 555-2233",
        email: "carlos.g@email.com",
      }),
      insurance: JSON.stringify([
        {
          provider: "Blue Cross Blue Shield",
          policyNumber: "BCBS-77203",
          type: "private",
          status: "verified",
        },
      ]),
      primaryDiagnosis: "COPD exacerbation",
      secondaryDiagnoses: ["Congestive heart failure", "Sleep apnea", "Obesity"],
      careLevelRequired: "home_health",
      notes:
        "Lives with spouse who works during day. Needs home health for oxygen management and daily monitoring. Home is accessible - single level.",
      socialWorkerId: "usr-001",
      hospitalId: "hosp-001",
      organizationId: "org-001",
      admissionDate: new Date("2026-07-03T09:00:00Z"),
      estimatedDischargeDate: new Date("2026-07-12T00:00:00Z"),
      status: "assessment_in_progress",
      createdAt: new Date("2026-07-03T09:00:00Z"),
      updatedAt: new Date("2026-07-07T11:00:00Z"),
    },
  });
  console.log("    ✔ pat-003 — Maria Garcia");

  // Patient 4: Robert Frost
  await prisma.patient.upsert({
    where: { id: "pat-004" },
    update: {},
    create: {
      id: "pat-004",
      mrn: "MRN-91456",
      firstName: "Robert",
      lastName: "Frost",
      dateOfBirth: new Date("1948-12-26"),
      age: 77,
      gender: "male",
      address: JSON.stringify({
        street: "112 Woodland Path",
        city: "Gresham",
        state: "OR",
        zipCode: "97030",
      }),
      phone: "(503) 555-7788",
      emergencyContact: JSON.stringify({
        name: "Emily Frost",
        role: "Daughter",
        phone: "(503) 555-9900",
        email: "emily.f@email.com",
      }),
      insurance: JSON.stringify([
        {
          provider: "Medicare Part A",
          policyNumber: "MED-91456-A",
          type: "medicare",
          status: "active",
        },
      ]),
      primaryDiagnosis: "Alzheimer's disease (advanced)",
      secondaryDiagnoses: ["Malnutrition", "Dehydration", "Urinary tract infection"],
      careLevelRequired: "long_term_care",
      notes:
        "Wandering risk. Requires 24/7 supervised care. Family unable to provide necessary level of support at home.",
      socialWorkerId: "usr-001",
      hospitalId: "hosp-001",
      organizationId: "org-001",
      admissionDate: new Date("2026-07-05T16:00:00Z"),
      status: "admitted",
      createdAt: new Date("2026-07-05T16:00:00Z"),
      updatedAt: new Date("2026-07-06T10:00:00Z"),
    },
  });
  console.log("    ✔ pat-004 — Robert Frost");

  // Patient 5: Yuki Tanaka
  await prisma.patient.upsert({
    where: { id: "pat-005" },
    update: {},
    create: {
      id: "pat-005",
      mrn: "MRN-92789",
      firstName: "Yuki",
      lastName: "Tanaka",
      dateOfBirth: new Date("1963-05-18"),
      age: 63,
      gender: "female",
      address: JSON.stringify({
        street: "890 Cherry Blossom Drive",
        city: "Portland",
        state: "OR",
        zipCode: "97219",
      }),
      phone: "(503) 555-4455",
      emergencyContact: JSON.stringify({
        name: "Ken Tanaka",
        role: "Brother",
        phone: "(503) 555-6677",
        email: "ken.t@email.com",
      }),
      insurance: JSON.stringify([
        {
          provider: "Providence Health Plan",
          policyNumber: "PHP-55678",
          type: "private",
          status: "verified",
        },
      ]),
      primaryDiagnosis: "Spinal cord injury - L1 fracture",
      secondaryDiagnoses: ["Neurogenic bladder", "Chronic back pain"],
      careLevelRequired: "rehabilitation",
      notes:
        "Full-time wheelchair user. Home needs modification. Requires intensive inpatient rehab before discharge planning.",
      socialWorkerId: "usr-001",
      hospitalId: "hosp-001",
      organizationId: "org-001",
      admissionDate: new Date("2026-07-01T08:30:00Z"),
      estimatedDischargeDate: new Date("2026-08-01T00:00:00Z"),
      status: "admitted",
      createdAt: new Date("2026-07-01T08:30:00Z"),
      updatedAt: new Date("2026-07-05T14:00:00Z"),
    },
  });
  console.log("    ✔ pat-005 — Yuki Tanaka");

  // ── 5. Seed Facilities ──
  console.log("  Seeding facilities...");

  // Facility 1: Willamette Valley Rehabilitation Center
  await prisma.facility.upsert({
    where: { id: "fac-001" },
    update: {},
    create: {
      id: "fac-001",
      name: "Willamette Valley Rehabilitation Center",
      type: "rehabilitation_center",
      address: JSON.stringify({
        street: "4500 Health Way",
        city: "Portland",
        state: "OR",
        zipCode: "97210",
        county: "Multnomah",
      }),
      phone: "(503) 555-1000",
      email: "admissions@willametterehab.org",
      website: "https://willametterehab.org",
      contacts: JSON.stringify([
        {
          name: "Patricia Moore",
          role: "Admissions Director",
          phone: "(503) 555-1001",
          email: "pmoore@willametterehab.org",
        },
      ]),
      licensure: ["OR-DHS-8821", "CARF-Accredited"],
      accreditations: ["CARF", "Joint Commission"],
      capacity: 120,
      currentOccupancy: 98,
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Providence", "Aetna"],
      careLevelsOffered: ["skilled_nursing", "rehabilitation"],
      specialties: ["Orthopedic rehab", "Stroke recovery", "Cardiac rehab", "Neurological rehab"],
      rating: 4.5,
      reviewsCount: 128,
      hasAvailability: true,
      waitlistDays: 3,
      acceptsMedicare: true,
      acceptsMedicaid: true,
      organizationId: "org-001",
      createdAt: new Date("2024-01-15T00:00:00Z"),
      updatedAt: new Date("2026-07-01T00:00:00Z"),
    },
  });
  console.log("    ✔ fac-001 — Willamette Valley Rehabilitation Center");

  // Facility 2: St. Francis Assisted Living
  await prisma.facility.upsert({
    where: { id: "fac-002" },
    update: {},
    create: {
      id: "fac-002",
      name: "St. Francis Assisted Living Community",
      type: "assisted_living",
      address: JSON.stringify({
        street: "2200 Peaceful Drive",
        city: "Portland",
        state: "OR",
        zipCode: "97202",
        county: "Multnomah",
      }),
      phone: "(503) 555-2000",
      email: "info@stfranciscare.org",
      contacts: JSON.stringify([
        {
          name: "Michael Chen",
          role: "Executive Director",
          phone: "(503) 555-2001",
          email: "mchen@stfranciscare.org",
        },
      ]),
      licensure: ["OR-DHS-6634"],
      accreditations: ["Joint Commission"],
      capacity: 80,
      currentOccupancy: 72,
      insuranceAccepted: ["Medicare", "Private Pay", "Long-term care insurance"],
      careLevelsOffered: ["independent_living", "assisted_living", "memory_care"],
      specialties: ["Memory care", "Alzheimer's care", "Medication management"],
      rating: 4.3,
      reviewsCount: 94,
      hasAvailability: true,
      waitlistDays: 14,
      acceptsMedicare: true,
      acceptsMedicaid: false,
      organizationId: "org-001",
      createdAt: new Date("2023-06-01T00:00:00Z"),
      updatedAt: new Date("2026-06-28T00:00:00Z"),
    },
  });
  console.log("    ✔ fac-002 — St. Francis Assisted Living Community");

  // Facility 3: Columbia River Skilled Nursing Facility
  await prisma.facility.upsert({
    where: { id: "fac-003" },
    update: {},
    create: {
      id: "fac-003",
      name: "Columbia River Skilled Nursing Facility",
      type: "skilled_nursing_facility",
      address: JSON.stringify({
        street: "890 River Road",
        city: "Portland",
        state: "OR",
        zipCode: "97217",
        county: "Multnomah",
      }),
      phone: "(503) 555-3000",
      email: "admissions@columbiasnf.org",
      contacts: JSON.stringify([
        {
          name: "David Williams",
          role: "Director of Nursing",
          phone: "(503) 555-3001",
          email: "dwilliams@columbiasnf.org",
        },
        {
          name: "Amanda Torres",
          role: "Admissions Coordinator",
          phone: "(503) 555-3002",
          email: "atorres@columbiasnf.org",
        },
      ]),
      licensure: ["OR-DHS-4412", "CMS-Certified"],
      accreditations: ["Joint Commission", "AHCA"],
      capacity: 150,
      currentOccupancy: 145,
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Aetna", "Cigna"],
      careLevelsOffered: ["skilled_nursing", "long_term_care", "rehabilitation"],
      specialties: ["Wound care", "Post-surgical recovery", "Palliative care", "IV therapy"],
      rating: 4.1,
      reviewsCount: 203,
      hasAvailability: false,
      acceptsMedicare: true,
      acceptsMedicaid: true,
      organizationId: "org-001",
      createdAt: new Date("2022-09-01T00:00:00Z"),
      updatedAt: new Date("2026-07-02T00:00:00Z"),
    },
  });
  console.log("    ✔ fac-003 — Columbia River Skilled Nursing Facility");

  // Facility 4: Healing Hearts Home Health Agency
  await prisma.facility.upsert({
    where: { id: "fac-004" },
    update: {},
    create: {
      id: "fac-004",
      name: "Healing Hearts Home Health Agency",
      type: "home_health_agency",
      address: JSON.stringify({
        street: "555 Care Lane",
        city: "Beaverton",
        state: "OR",
        zipCode: "97005",
        county: "Washington",
      }),
      phone: "(503) 555-4000",
      email: "care@healinghearts.org",
      contacts: JSON.stringify([
        {
          name: "Rachel Green",
          role: "Clinical Director",
          phone: "(503) 555-4001",
          email: "rgreen@healinghearts.org",
        },
      ]),
      licensure: ["OR-DHS-3341", "CHAP-Accredited"],
      accreditations: ["CHAP", "BBB"],
      capacity: 200,
      currentOccupancy: 165,
      insuranceAccepted: ["Medicare", "Medicaid", "Blue Cross", "Providence"],
      careLevelsOffered: ["home_health", "hospice"],
      specialties: [
        "Wound care",
        "Infusion therapy",
        "Palliative care",
        "Physical therapy",
        "Occupational therapy",
      ],
      rating: 4.7,
      reviewsCount: 67,
      hasAvailability: true,
      acceptsMedicare: true,
      acceptsMedicaid: true,
      organizationId: "org-001",
      createdAt: new Date("2023-03-15T00:00:00Z"),
      updatedAt: new Date("2026-06-30T00:00:00Z"),
    },
  });
  console.log("    ✔ fac-004 — Healing Hearts Home Health Agency");

  // Facility 5: Sunrise Memory Care Center
  await prisma.facility.upsert({
    where: { id: "fac-005" },
    update: {},
    create: {
      id: "fac-005",
      name: "Sunrise Memory Care Center",
      type: "assisted_living",
      address: JSON.stringify({
        street: "1200 Sunrise Boulevard",
        city: "Gresham",
        state: "OR",
        zipCode: "97030",
        county: "Multnomah",
      }),
      phone: "(503) 555-5000",
      email: "info@sunrisememory.org",
      contacts: JSON.stringify([
        {
          name: "Lisa Park",
          role: "Community Relations",
          phone: "(503) 555-5001",
          email: "lpark@sunrisememory.org",
        },
      ]),
      licensure: ["OR-DHS-7712"],
      accreditations: ["Alzheimer's Association Certified"],
      capacity: 60,
      currentOccupancy: 58,
      insuranceAccepted: ["Medicare", "Medicaid", "Private Pay"],
      careLevelsOffered: ["assisted_living", "long_term_care"],
      specialties: ["Alzheimer's care", "Dementia care", "Behavioral management"],
      rating: 4.4,
      reviewsCount: 41,
      hasAvailability: true,
      waitlistDays: 21,
      acceptsMedicare: true,
      acceptsMedicaid: true,
      organizationId: "org-001",
      createdAt: new Date("2023-11-01T00:00:00Z"),
      updatedAt: new Date("2026-07-05T00:00:00Z"),
    },
  });
  console.log("    ✔ fac-005 — Sunrise Memory Care Center");

  // ── 6. Seed Placements ──
  console.log("  Seeding placements...");

  // Placement 1
  await prisma.placement.upsert({
    where: { id: "plc-001" },
    update: {},
    create: {
      id: "plc-001",
      patientId: "pat-001",
      facilityId: "fac-003",
      socialWorkerId: "usr-001",
      status: "pending_approval",
      careLevel: "skilled_nursing",
      priority: "high",
      assessmentNotes:
        "Patient requires 24/7 nursing care for wound management and post-surgical monitoring. Hip replacement recovery expected 6-8 weeks.",
      preferredLocation: JSON.stringify({
        city: "Portland",
        state: "OR",
        maxDistanceMiles: 20,
      }),
      matchedFacilities: ["fac-003", "fac-001"],
      selectedFacilityId: "fac-003",
      insurancePreAuthorized: true,
      notes: "Columbia River SNF has bed available starting 7/11. Family has toured and approved.",
      organizationId: "org-001",
      createdAt: new Date("2026-07-02T10:00:00Z"),
      updatedAt: new Date("2026-07-07T14:00:00Z"),
    },
  });
  console.log("    ✔ plc-001 — Eleanor Roosevelt → Columbia River SNF");

  // Placement 2
  await prisma.placement.upsert({
    where: { id: "plc-002" },
    update: {},
    create: {
      id: "plc-002",
      patientId: "pat-002",
      socialWorkerId: "usr-001",
      status: "searching",
      careLevel: "rehabilitation",
      priority: "high",
      assessmentNotes:
        "Stroke patient needing intensive PT/OT. Right-sided hemiparesis. Good rehab potential.",
      preferredLocation: JSON.stringify({
        city: "Portland",
        state: "OR",
        maxDistanceMiles: 15,
      }),
      matchedFacilities: ["fac-001", "fac-003"],
      insurancePreAuthorized: false,
      notes:
        "Waiting on insurance pre-authorization. Willamette Valley Rehab has expressed interest.",
      organizationId: "org-001",
      createdAt: new Date("2026-07-03T09:00:00Z"),
      updatedAt: new Date("2026-07-07T11:00:00Z"),
    },
  });
  console.log("    ✔ plc-002 — George Washington → Searching");

  // Placement 3
  await prisma.placement.upsert({
    where: { id: "plc-003" },
    update: {},
    create: {
      id: "plc-003",
      patientId: "pat-003",
      socialWorkerId: "usr-001",
      status: "assessment",
      careLevel: "home_health",
      priority: "medium",
      assessmentNotes:
        "COPD patient stable for home with supportive services. Needs daily nursing visits and oxygen management.",
      preferredLocation: JSON.stringify({
        city: "Beaverton",
        state: "OR",
        maxDistanceMiles: 10,
      }),
      matchedFacilities: ["fac-004"],
      insurancePreAuthorized: true,
      notes:
        "Healing Hearts can start home health services upon discharge. Spouse trained on oxygen equipment.",
      organizationId: "org-001",
      createdAt: new Date("2026-07-05T14:00:00Z"),
      updatedAt: new Date("2026-07-07T09:00:00Z"),
    },
  });
  console.log("    ✔ plc-003 — Maria Garcia → Assessment");

  // ── 7. Seed Activity Events ──
  console.log("  Seeding activity events...");

  await prisma.activityEvent.upsert({
    where: { id: "act-001" },
    update: {},
    create: {
      id: "act-001",
      type: "placement",
      title: "Placement pending approval",
      description:
        "Eleanor Roosevelt's placement at Columbia River SNF submitted for approval.",
      patientName: "Eleanor Roosevelt",
      patientId: "pat-001",
      timestamp: new Date("2026-07-07T14:00:00Z"),
      userId: "usr-001",
      organizationId: "org-001",
    },
  });

  await prisma.activityEvent.upsert({
    where: { id: "act-002" },
    update: {},
    create: {
      id: "act-002",
      type: "assessment",
      title: "Assessment completed",
      description: "Maria Garcia assessed for home health needs. Healing Hearts recommended.",
      patientName: "Maria Garcia",
      patientId: "pat-003",
      timestamp: new Date("2026-07-07T09:00:00Z"),
      userId: "usr-001",
      organizationId: "org-001",
    },
  });

  await prisma.activityEvent.upsert({
    where: { id: "act-003" },
    update: {},
    create: {
      id: "act-003",
      type: "milestone",
      title: "Insurance verified",
      description:
        "George Washington's Aetna supplemental coverage confirmed for inpatient rehab.",
      patientName: "George Washington",
      patientId: "pat-002",
      timestamp: new Date("2026-07-06T16:00:00Z"),
      userId: "usr-001",
      organizationId: "org-001",
    },
  });

  await prisma.activityEvent.upsert({
    where: { id: "act-004" },
    update: {},
    create: {
      id: "act-004",
      type: "admission",
      title: "New patient admitted",
      description: "Robert Frost admitted for advanced Alzheimer's care assessment.",
      patientName: "Robert Frost",
      patientId: "pat-004",
      timestamp: new Date("2026-07-05T16:00:00Z"),
      userId: "usr-001",
      organizationId: "org-001",
    },
  });

  await prisma.activityEvent.upsert({
    where: { id: "act-005" },
    update: {},
    create: {
      id: "act-005",
      type: "placement",
      title: "Facilities matched",
      description:
        "3 skilled nursing facilities matched for Eleanor Roosevelt's care needs.",
      patientName: "Eleanor Roosevelt",
      patientId: "pat-001",
      timestamp: new Date("2026-07-04T11:00:00Z"),
      userId: "usr-001",
      organizationId: "org-001",
    },
  });

  await prisma.activityEvent.upsert({
    where: { id: "act-006" },
    update: {},
    create: {
      id: "act-006",
      type: "note",
      title: "Care plan updated",
      description:
        "Yuki Tanaka's rehab goals updated. Extended stay recommended by PT team.",
      patientName: "Yuki Tanaka",
      patientId: "pat-005",
      timestamp: new Date("2026-07-05T14:00:00Z"),
      userId: "usr-001",
      organizationId: "org-001",
    },
  });
  console.log("    ✔ 6 activity events seeded");

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
