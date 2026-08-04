import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedFacilityDemoPhotos } from "../scripts/facility-demo-photos";

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

  console.log("  Seeding facility demo photos...");
  const photoCount = await seedFacilityDemoPhotos(prisma, [
    "fac-001",
    "fac-002",
    "fac-003",
    "fac-004",
    "fac-005",
  ]);
  console.log(`    ✔ ${photoCount} facility media records`);

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

  // ── 8. Seed Documentation Vault Documents ──
  console.log("  Seeding documentation vault documents...");

  // ── Document 1: Patient Consent Form ──
  await prisma.document.upsert({
    where: { id: "doc-001" },
    update: {},
    create: {
      id: "doc-001",
      organizationId: "org-001",
      uploadedById: "usr-001",
      title: "Patient Consent Form - Eleanor Roosevelt",
      description: "Signed patient consent for treatment and data sharing authorization for post-discharge care coordination.",
      category: "consent_forms",
      tags: ["consent", "hipaa", "release-of-information", "eleanor-roosevelt", "mrn-88472"],
      fileName: "consent_form_roosevelt_eleanor_20260701.pdf",
      fileType: "application/pdf",
      fileSize: 245760,
      storageKey: "orgs/org-001/documents/a1b2c3d4-consent_form_roosevelt_eleanor_20260701.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "a4f8c2d9e1b7a3f6c8d0e2b4a6c8e0d2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c1d",
      mimeType: "application/pdf",
      version: 1,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2031-07-01T00:00:00Z"),
      notes: "Signed original on file. Scanned copy stored per record retention policy.",
      createdAt: new Date("2026-07-01T10:30:00Z"),
      updatedAt: new Date("2026-07-01T10:30:00Z"),
    },
  });
  console.log("    ✔ doc-001 — Patient Consent Form - Eleanor Roosevelt");

  // ── Document 2: Business Associate Agreement ──
  await prisma.document.upsert({
    where: { id: "doc-002" },
    update: {},
    create: {
      id: "doc-002",
      organizationId: "org-001",
      uploadedById: "usr-003",
      title: "Mercy Hospital BAA - Willamette Rehab 2026",
      description: "Business Associate Agreement between Mercy Hospital Portland and Willamette Valley Rehabilitation Center for 2026-2027 term.",
      category: "business_associate_agreements",
      tags: ["baa", "hipaa", "willamette-rehab", "vendor-agreement", "fac-001"],
      fileName: "baa_mercy_willamette_rehab_2026_signed.pdf",
      fileType: "application/pdf",
      fileSize: 1228800,
      storageKey: "orgs/org-001/documents/b2c3d4e5-baa_mercy_willamette_rehab_2026_signed.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "b5a9d3e0f2c7b4a8d6e1f3c5a7b9d1e3f5a7c9d1e3f5b7a9c1d3e5f7a9b1c3d5",
      mimeType: "application/pdf",
      version: 3,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2032-06-15T00:00:00Z"),
      notes: "Signed by both parties. Effective 07/01/2026 through 06/30/2027.",
      createdAt: new Date("2026-06-15T14:00:00Z"),
      updatedAt: new Date("2026-06-15T14:00:00Z"),
    },
  });
  console.log("    ✔ doc-002 — Mercy Hospital BAA - Willamette Rehab 2026");

  // ── Document 3: HIPAA Privacy Practices Notice ──
  await prisma.document.upsert({
    where: { id: "doc-003" },
    update: {},
    create: {
      id: "doc-003",
      organizationId: "org-001",
      uploadedById: "usr-admin-001",
      title: "HIPAA Privacy Practices Notice v2",
      description: "Updated Notice of Privacy Practices compliant with 2026 HIPAA Omnibus Rule amendments.",
      category: "privacy_documentation",
      tags: ["hipaa", "privacy-practices", "notice", "patient-rights", "compliance"],
      fileName: "hipaa_privacy_notice_v2_20260520.pdf",
      fileType: "application/pdf",
      fileSize: 870400,
      storageKey: "orgs/org-001/documents/c3d4e5f6-hipaa_privacy_notice_v2_20260520.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "c6b0d4e1f3a8c5b9d7e2f4a6c8b0d2e4f6a8c0d2e4f6b8a0c2d4e6f8a0b2c3d4",
      mimeType: "application/pdf",
      version: 2,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2031-05-20T00:00:00Z"),
      notes: "Supersedes v1 dated 01/15/2025. Spanish translation available.",
      createdAt: new Date("2026-05-20T11:00:00Z"),
      updatedAt: new Date("2026-05-20T11:00:00Z"),
    },
  });
  console.log("    ✔ doc-003 — HIPAA Privacy Practices Notice v2");

  // ── Document 4: Infection Control Policy ──
  await prisma.document.upsert({
    where: { id: "doc-004" },
    update: {},
    create: {
      id: "doc-004",
      organizationId: "org-001",
      uploadedById: "usr-003",
      title: "Infection Control Policy - Q2 2026",
      description: "Updated infection prevention and control policy incorporating CDC seasonal guidance and enhanced droplet precautions.",
      category: "policies",
      tags: ["infection-control", "policy", "cdc-guidelines", "q2-2026", "safety"],
      fileName: "infection_control_policy_q2_2026_final.pdf",
      fileType: "application/pdf",
      fileSize: 3584000,
      storageKey: "orgs/org-001/documents/d4e5f6a7-infection_control_policy_q2_2026_final.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "d7c1e5f2a4b9d6c8e0f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d6",
      mimeType: "application/pdf",
      version: 3,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2028-04-01T00:00:00Z"),
      notes: "Reviewed by Infection Control Committee on 03/25/2026. Effective 04/01/2026.",
      createdAt: new Date("2026-04-01T09:00:00Z"),
      updatedAt: new Date("2026-04-01T09:00:00Z"),
    },
  });
  console.log("    ✔ doc-004 — Infection Control Policy - Q2 2026");

  // ── Document 5: Patient Rights Brochure ──
  await prisma.document.upsert({
    where: { id: "doc-005" },
    update: {},
    create: {
      id: "doc-005",
      organizationId: "org-001",
      uploadedById: "usr-002",
      title: "Patient Rights & Responsibilities Brochure",
      description: "Patient-facing brochure outlining rights, responsibilities, and grievance procedures under Oregon law and federal regulations.",
      category: "policies",
      tags: ["patient-rights", "brochure", "patient-education", "grievance", "oregon-law"],
      fileName: "patient_rights_brochure_2026_final.pdf",
      fileType: "application/pdf",
      fileSize: 524288,
      storageKey: "orgs/org-001/documents/e5f6a7b8-patient_rights_brochure_2026_final.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "e8d2f6a3b5c0d7e9f1a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e7",
      mimeType: "application/pdf",
      version: 1,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2028-03-15T00:00:00Z"),
      notes: "Available in English and Spanish. Also posted in waiting areas.",
      createdAt: new Date("2026-03-15T09:00:00Z"),
      updatedAt: new Date("2026-03-15T09:00:00Z"),
    },
  });
  console.log("    ✔ doc-005 — Patient Rights & Responsibilities Brochure");

  // ── Document 6: Placement Assessment ──
  await prisma.document.upsert({
    where: { id: "doc-006" },
    update: {},
    create: {
      id: "doc-006",
      organizationId: "org-001",
      uploadedById: "usr-001",
      title: "Washington Placement Assessment - MRN-89103",
      description: "Comprehensive placement assessment for George Washington including functional status, care needs, and facility matching recommendations.",
      category: "patient_records",
      tags: ["placement-assessment", "george-washington", "mrn-89103", "functional-status", "facility-matching"],
      fileName: "washington_george_placement_assessment_20260702.pdf",
      fileType: "application/pdf",
      fileSize: 4300800,
      storageKey: "orgs/org-001/documents/f6a7b8c9-washington_george_placement_assessment_20260702.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "f9e3a7b4c6d1e8f0a2b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f8",
      mimeType: "application/pdf",
      version: 1,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2031-07-02T00:00:00Z"),
      notes: "Contains PT/OT evaluation reports and social work assessment.",
      createdAt: new Date("2026-07-02T15:00:00Z"),
      updatedAt: new Date("2026-07-02T15:00:00Z"),
    },
  });
  console.log("    ✔ doc-006 — Washington Placement Assessment - MRN-89103");

  // ── Document 7: Monthly Compliance Report ──
  await prisma.document.upsert({
    where: { id: "doc-007" },
    update: {},
    create: {
      id: "doc-007",
      organizationId: "org-001",
      uploadedById: "usr-admin-001",
      title: "Monthly Compliance Report - June 2026",
      description: "Monthly compliance summary covering HIPAA audits, incident reports, staff training completion rates, and policy adherence metrics.",
      category: "compliance_documents",
      tags: ["compliance", "monthly-report", "hipaa", "audit", "june-2026"],
      fileName: "monthly_compliance_report_june_2026.pdf",
      fileType: "application/pdf",
      fileSize: 1884160,
      storageKey: "orgs/org-001/documents/a7b8c9d0-monthly_compliance_report_june_2026.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "a0b4c8d2e6f0a4b8c2d6e0f4a8b2c6d0e4f8a2b6c0d4e8f2a6b0c4d8e2f6a0b4",
      mimeType: "application/pdf",
      version: 1,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2029-07-05T00:00:00Z"),
      notes: "Reviewed by Compliance Officer. All metrics within acceptable thresholds.",
      createdAt: new Date("2026-07-05T11:00:00Z"),
      updatedAt: new Date("2026-07-05T11:00:00Z"),
    },
  });
  console.log("    ✔ doc-007 — Monthly Compliance Report - June 2026");

  // ── Document 8: Staff Training Log ──
  await prisma.document.upsert({
    where: { id: "doc-008" },
    update: {},
    create: {
      id: "doc-008",
      organizationId: "org-001",
      uploadedById: "usr-003",
      title: "Staff Training Log - HIPAA Refresher May 2026",
      description: "Training attendance log and completion certificates for mandatory HIPAA refresher training conducted May 2026.",
      category: "employee_training_records",
      tags: ["training", "hipaa", "staff-development", "may-2026", "compliance-training"],
      fileName: "hipaa_refresher_training_log_may_2026.xlsx",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 2150400,
      storageKey: "orgs/org-001/documents/b8c9d0e1-hipaa_refresher_training_log_may_2026.xlsx",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "b1c5d9e3f7a1b5c9d3e7f1a5b9c3d7e1f5a9b3c7d1e5f9a3b7c1d5e9f3a7b1c5",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      version: 1,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2031-06-01T00:00:00Z"),
      notes: "142 staff members completed. 3 pending makeup sessions.",
      createdAt: new Date("2026-06-01T08:00:00Z"),
      updatedAt: new Date("2026-06-01T08:00:00Z"),
    },
  });
  console.log("    ✔ doc-008 — Staff Training Log - HIPAA Refresher May 2026");

  // ── Document 9: Insurance Pre-Authorization ──
  await prisma.document.upsert({
    where: { id: "doc-009" },
    update: {},
    create: {
      id: "doc-009",
      organizationId: "org-001",
      uploadedById: "usr-002",
      title: "Insurance Pre-Authorization - Garcia MRN-90345",
      description: "Pre-authorization approval documentation for Maria Garcia's home health services under BCBS policy BCBS-77203.",
      category: "insurance_documents",
      tags: ["insurance", "pre-authorization", "maria-garcia", "mrn-90345", "bcbs"],
      fileName: "garcia_maria_preauth_BCBS77203_20260703.pdf",
      fileType: "application/pdf",
      fileSize: 327680,
      storageKey: "orgs/org-001/documents/c9d0e1f2-garcia_maria_preauth_BCBS77203_20260703.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "c2d6e0f4a8b2c6d0e4f8a2b6c0d4e8f2a6b0c4d8e2f6a0b4c8d2e6f0a4b8c2d6",
      mimeType: "application/pdf",
      version: 1,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2028-07-03T00:00:00Z"),
      notes: "Approved for 60 days of home health nursing (3 visits/week).",
      createdAt: new Date("2026-07-03T16:00:00Z"),
      updatedAt: new Date("2026-07-03T16:00:00Z"),
    },
  });
  console.log("    ✔ doc-009 — Insurance Pre-Authorization - Garcia MRN-90345");

  // ── Document 10: Security Incident Report ──
  await prisma.document.upsert({
    where: { id: "doc-010" },
    update: {},
    create: {
      id: "doc-010",
      organizationId: "org-001",
      uploadedById: "usr-admin-001",
      title: "Security Incident Report - PHI Access Audit",
      description: "Investigation report for unauthorized PHI access attempt detected by SIEM on 06/25/2026. Includes remediation actions.",
      category: "security_documentation",
      tags: ["security", "phi", "incident-response", "audit", "siem", "breach-prevention"],
      fileName: "phi_access_audit_incident_report_20260628.pdf",
      fileType: "application/pdf",
      fileSize: 696320,
      storageKey: "orgs/org-001/documents/d0e1f2a3-phi_access_audit_incident_report_20260628.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "d3e7f1a5b9c3d7e1f5a9b3c7d1e5f9a3b7c1d5e9f3a7b1c5d9e3f7a1b5c9d3e7",
      mimeType: "application/pdf",
      version: 1,
      isArchived: false,
      isOnLegalHold: true,
      retentionDate: new Date("2031-06-28T00:00:00Z"),
      notes: "ON LEGAL HOLD per legal counsel. Do not delete or modify.",
      createdAt: new Date("2026-06-28T13:00:00Z"),
      updatedAt: new Date("2026-06-28T13:00:00Z"),
    },
  });
  console.log("    ✔ doc-010 — Security Incident Report - PHI Access Audit");

  // ── Document 11: Discharge Summary ──
  await prisma.document.upsert({
    where: { id: "doc-011" },
    update: {},
    create: {
      id: "doc-011",
      organizationId: "org-001",
      uploadedById: "usr-001",
      title: "Discharge Summary - Roosevelt MRN-88472",
      description: "Discharge summary for Eleanor Roosevelt including medication reconciliation, follow-up appointments, and post-discharge care instructions.",
      category: "medical_documentation",
      tags: ["discharge-summary", "eleanor-roosevelt", "mrn-88472", "medication-reconciliation", "follow-up"],
      fileName: "roosevelt_eleanor_discharge_summary_20260706.pdf",
      fileType: "application/pdf",
      fileSize: 1572864,
      storageKey: "orgs/org-001/documents/e1f2a3b4-roosevelt_eleanor_discharge_summary_20260706.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "e4f8a2b6c0d4e8f2a6b0c4d8e2f6a0b4c8d2e6f0a4b8c2d6e0f4a8b2c6d0e4f8",
      mimeType: "application/pdf",
      version: 2,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2031-07-06T00:00:00Z"),
      notes: "Final version reviewed and signed by attending physician Dr. Williams.",
      createdAt: new Date("2026-07-06T09:00:00Z"),
      updatedAt: new Date("2026-07-06T09:00:00Z"),
    },
  });
  console.log("    ✔ doc-011 — Discharge Summary - Roosevelt MRN-88472");

  // ── Document 12: Facility Audit Checklist ──
  await prisma.document.upsert({
    where: { id: "doc-012" },
    update: {},
    create: {
      id: "doc-012",
      organizationId: "org-001",
      uploadedById: "usr-fac-001",
      title: "Facility Audit Checklist - Q2 2026",
      description: "Completed Q2 2026 audit checklist for Willamette Valley Rehabilitation Center covering safety, compliance, and operational standards.",
      category: "audit_documents",
      tags: ["audit", "checklist", "q2-2026", "willamette-rehab", "fac-001", "safety"],
      fileName: "facility_audit_checklist_q2_2026_willamette.pdf",
      fileType: "application/pdf",
      fileSize: 942080,
      storageKey: "orgs/org-001/documents/f2a3b4c5-facility_audit_checklist_q2_2026_willamette.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "f5a9b3c7d1e5f9a3b7c1d5e9f3a7b1c5d9e3f7a1b5c9d3e7f1a5b9c3d7e1f5a9",
      mimeType: "application/pdf",
      version: 1,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2029-06-20T00:00:00Z"),
      notes: "Score: 94/100. Two minor findings resolved same day.",
      createdAt: new Date("2026-06-20T10:00:00Z"),
      updatedAt: new Date("2026-06-20T10:00:00Z"),
    },
  });
  console.log("    ✔ doc-012 — Facility Audit Checklist - Q2 2026");

  // ── Document 13: Advance Directive ──
  await prisma.document.upsert({
    where: { id: "doc-013" },
    update: {},
    create: {
      id: "doc-013",
      organizationId: "org-001",
      uploadedById: "usr-001",
      title: "Advance Directive - Washington MRN-89103",
      description: "Notarized advance directive and living will for George Washington including healthcare power of attorney designation.",
      category: "consent_forms",
      tags: ["advance-directive", "living-will", "george-washington", "mrn-89103", "power-of-attorney"],
      fileName: "advance_directive_washington_george_20260702.pdf",
      fileType: "application/pdf",
      fileSize: 184320,
      storageKey: "orgs/org-001/documents/a3b4c5d6-advance_directive_washington_george_20260702.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "a6b0c4d8e2f6a0b4c8d2e6f0a4b8c2d6e0f4a8b2c6d0e4f8a2b6c0d4e8f2a6b0",
      mimeType: "application/pdf",
      version: 1,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2031-07-02T00:00:00Z"),
      notes: "Notarized by Amanda Smith, Notary Public. Witnessed by two staff members.",
      createdAt: new Date("2026-07-02T11:00:00Z"),
      updatedAt: new Date("2026-07-02T11:00:00Z"),
    },
  });
  console.log("    ✔ doc-013 — Advance Directive - Washington MRN-89103");

  // ── Document 14: Procedure Manual ──
  await prisma.document.upsert({
    where: { id: "doc-014" },
    update: {},
    create: {
      id: "doc-014",
      organizationId: "org-001",
      uploadedById: "usr-003",
      title: "Procedure Manual - Patient Intake v4",
      description: "Standard operating procedure manual for patient intake and admission processes including verification, assessment, and documentation workflows.",
      category: "procedures",
      tags: ["procedure-manual", "patient-intake", "sop", "admissions", "version-4"],
      fileName: "patient_intake_procedure_manual_v4_20260201.pdf",
      fileType: "application/pdf",
      fileSize: 12582912,
      storageKey: "orgs/org-001/documents/b4c5d6e7-patient_intake_procedure_manual_v4_20260201.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "b7c1d5e9f3a7b1c5d9e3f7a1b5c9d3e7f1a5b9c3d7e1f5a9b3c7d1e5f9a3b7c1",
      mimeType: "application/pdf",
      version: 4,
      isArchived: true,
      isOnLegalHold: false,
      retentionDate: new Date("2028-02-01T00:00:00Z"),
      notes: "Superseded by v5. Retained per document retention schedule.",
      createdAt: new Date("2026-02-01T09:00:00Z"),
      updatedAt: new Date("2026-02-01T09:00:00Z"),
    },
  });
  console.log("    ✔ doc-014 — Procedure Manual - Patient Intake v4");

  // ── Document 15: Risk Assessment Report ──
  await prisma.document.upsert({
    where: { id: "doc-015" },
    update: {},
    create: {
      id: "doc-015",
      organizationId: "org-001",
      uploadedById: "usr-admin-001",
      title: "Risk Assessment Report - Q2 2026",
      description: "Quarterly information security risk assessment including vulnerability scan results, penetration test findings, and remediation roadmap.",
      category: "security_documentation",
      tags: ["risk-assessment", "security", "q2-2026", "vulnerability-scan", "penetration-test"],
      fileName: "risk_assessment_report_q2_2026_confidential.pdf",
      fileType: "application/pdf",
      fileSize: 2936016,
      storageKey: "orgs/org-001/documents/c5d6e7f8-risk_assessment_report_q2_2026_confidential.pdf",
      storageBucket: "carebridge-storage",
      storageEndpoint: "https://storage.railway.app",
      checksum: "c8d2e6f0a4b8c2d6e0f4a8b2c6d0e4f8a2b6c0d4e8f2a6b0c4d8e2f6a0b4c8d2",
      mimeType: "application/pdf",
      version: 1,
      isArchived: false,
      isOnLegalHold: false,
      retentionDate: new Date("2029-06-25T00:00:00Z"),
      notes: "CONFIDENTIAL. Reviewed by IT Security Steering Committee.",
      createdAt: new Date("2026-06-25T14:00:00Z"),
      updatedAt: new Date("2026-06-25T14:00:00Z"),
    },
  });
  console.log("    ✔ doc-015 — Risk Assessment Report - Q2 2026");

  // ── 8b. Seed Document Version History ──
  console.log("  Seeding document version history...");

  // Version history for doc-002 (BAA) - now on v3
  await prisma.documentVersion.upsert({
    where: { id: "dv-001" },
    update: {},
    create: {
      id: "dv-001",
      documentId: "doc-002",
      version: 1,
      fileName: "baa_mercy_willamette_rehab_2026_draft1.pdf",
      fileType: "application/pdf",
      fileSize: 1048576,
      storageKey: "orgs/org-001/documents/baa_v1_20260501.pdf",
      storageBucket: "carebridge-storage",
      checksum: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      uploadedById: "usr-003",
      changeNotes: "Initial BAA draft for 2026 renewal term.",
      createdAt: new Date("2026-05-01T10:00:00Z"),
    },
  });

  await prisma.documentVersion.upsert({
    where: { id: "dv-002" },
    update: {},
    create: {
      id: "dv-002",
      documentId: "doc-002",
      version: 2,
      fileName: "baa_mercy_willamette_rehab_2026_draft2.pdf",
      fileType: "application/pdf",
      fileSize: 1155072,
      storageKey: "orgs/org-001/documents/baa_v2_20260601.pdf",
      storageBucket: "carebridge-storage",
      checksum: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
      uploadedById: "usr-003",
      changeNotes: "Updated liability clauses and indemnification language per legal review.",
      createdAt: new Date("2026-06-01T14:00:00Z"),
    },
  });

  // Version history for doc-004 (Infection Control Policy) - now on v3
  await prisma.documentVersion.upsert({
    where: { id: "dv-003" },
    update: {},
    create: {
      id: "dv-003",
      documentId: "doc-004",
      version: 1,
      fileName: "infection_control_policy_q2_2026_draft.docx",
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 3072000,
      storageKey: "orgs/org-001/documents/infection_control_v1_20260301.docx",
      storageBucket: "carebridge-storage",
      checksum: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
      uploadedById: "usr-003",
      changeNotes: "Q2 draft based on CDC seasonal respiratory virus guidance.",
      createdAt: new Date("2026-03-01T09:00:00Z"),
    },
  });

  await prisma.documentVersion.upsert({
    where: { id: "dv-004" },
    update: {},
    create: {
      id: "dv-004",
      documentId: "doc-004",
      version: 2,
      fileName: "infection_control_policy_q2_2026_rev1.docx",
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 3354624,
      storageKey: "orgs/org-001/documents/infection_control_v2_20260415.docx",
      storageBucket: "carebridge-storage",
      checksum: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
      uploadedById: "usr-admin-001",
      changeNotes: "Added enhanced droplet precautions and N95 fit-testing requirements.",
      createdAt: new Date("2026-04-15T11:00:00Z"),
    },
  });

  // Version history for doc-011 (Discharge Summary) - now on v2
  await prisma.documentVersion.upsert({
    where: { id: "dv-005" },
    update: {},
    create: {
      id: "dv-005",
      documentId: "doc-011",
      version: 1,
      fileName: "roosevelt_eleanor_discharge_summary_draft.pdf",
      fileType: "application/pdf",
      fileSize: 1048576,
      storageKey: "orgs/org-001/documents/roosevelt_discharge_v1_20260701.pdf",
      storageBucket: "carebridge-storage",
      checksum: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
      uploadedById: "usr-001",
      changeNotes: "Preliminary discharge summary drafted after attending review.",
      createdAt: new Date("2026-07-01T14:00:00Z"),
    },
  });

  console.log("    ✔ 5 document version records seeded");

  // ── 8c. Seed Document Access Logs ──
  console.log("  Seeding document access logs...");

  await prisma.documentAccessLog.upsert({ where: { id: "dal-001" }, update: {}, create: { id: "dal-001", documentId: "doc-001", userId: "usr-001", action: "UPLOAD", timestamp: new Date("2026-07-01T10:30:00Z"), ipAddress: "10.0.1.45", userAgent: "Mozilla/5.0", success: true, details: "Initial document upload" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-002" }, update: {}, create: { id: "dal-002", documentId: "doc-001", userId: "usr-002", action: "VIEW", timestamp: new Date("2026-07-01T11:00:00Z"), ipAddress: "10.0.1.46", userAgent: "Mozilla/5.0", success: true, details: "Consent form review for placement packet" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-003" }, update: {}, create: { id: "dal-003", documentId: "doc-001", userId: "usr-003", action: "VIEW", timestamp: new Date("2026-07-02T09:00:00Z"), ipAddress: "10.0.1.47", userAgent: "Mozilla/5.0", success: true, details: "Reviewed for compliance verification" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-004" }, update: {}, create: { id: "dal-004", documentId: "doc-002", userId: "usr-003", action: "UPLOAD", timestamp: new Date("2026-06-15T14:00:00Z"), ipAddress: "10.0.1.47", userAgent: "Mozilla/5.0", success: true, details: "Signed BAA uploaded after execution" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-005" }, update: {}, create: { id: "dal-005", documentId: "doc-002", userId: "usr-admin-001", action: "VIEW", timestamp: new Date("2026-06-15T16:30:00Z"), ipAddress: "10.0.1.50", userAgent: "Mozilla/5.0", success: true, details: "Admin review of executed BAA" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-006" }, update: {}, create: { id: "dal-006", documentId: "doc-002", userId: "usr-001", action: "DOWNLOAD", timestamp: new Date("2026-06-20T10:00:00Z"), ipAddress: "10.0.1.45", userAgent: "Mozilla/5.0", success: true, details: "Downloaded for placement file" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-007" }, update: {}, create: { id: "dal-007", documentId: "doc-003", userId: "usr-admin-001", action: "UPLOAD", timestamp: new Date("2026-05-20T11:00:00Z"), ipAddress: "10.0.1.50", userAgent: "Mozilla/5.0", success: true, details: "Published v2 of NPP document" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-008" }, update: {}, create: { id: "dal-008", documentId: "doc-003", userId: "usr-001", action: "VIEW", timestamp: new Date("2026-06-10T08:00:00Z"), ipAddress: "10.0.1.45", userAgent: "Mozilla/5.0", success: true, details: "Reviewed for patient rights discussion" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-009" }, update: {}, create: { id: "dal-009", documentId: "doc-004", userId: "usr-003", action: "UPLOAD", timestamp: new Date("2026-04-01T09:00:00Z"), ipAddress: "10.0.1.47", userAgent: "Mozilla/5.0", success: true, details: "Final policy published" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-010" }, update: {}, create: { id: "dal-010", documentId: "doc-004", userId: "usr-admin-001", action: "UPDATE", timestamp: new Date("2026-05-15T10:00:00Z"), ipAddress: "10.0.1.50", userAgent: "Mozilla/5.0", success: true, details: "CDC addendum incorporated" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-011" }, update: {}, create: { id: "dal-011", documentId: "doc-005", userId: "usr-002", action: "VIEW", timestamp: new Date("2026-06-25T13:00:00Z"), ipAddress: "10.0.1.46", userAgent: "Mozilla/5.0", success: true, details: "Checked for accuracy before reprint" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-012" }, update: {}, create: { id: "dal-012", documentId: "doc-006", userId: "usr-001", action: "UPLOAD", timestamp: new Date("2026-07-02T15:00:00Z"), ipAddress: "10.0.1.45", userAgent: "Mozilla/5.0", success: true, details: "Placement assessment uploaded" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-013" }, update: {}, create: { id: "dal-013", documentId: "doc-006", userId: "usr-002", action: "DOWNLOAD", timestamp: new Date("2026-07-03T09:00:00Z"), ipAddress: "10.0.1.46", userAgent: "Mozilla/5.0", success: true, details: "Downloaded for referral packet" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-014" }, update: {}, create: { id: "dal-014", documentId: "doc-007", userId: "usr-admin-001", action: "UPLOAD", timestamp: new Date("2026-07-05T11:00:00Z"), ipAddress: "10.0.1.50", userAgent: "Mozilla/5.0", success: true, details: "Monthly compliance report filed" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-015" }, update: {}, create: { id: "dal-015", documentId: "doc-007", userId: "usr-003", action: "VIEW", timestamp: new Date("2026-07-06T10:00:00Z"), ipAddress: "10.0.1.47", userAgent: "Mozilla/5.0", success: true, details: "Department head review" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-016" }, update: {}, create: { id: "dal-016", documentId: "doc-008", userId: "usr-003", action: "UPLOAD", timestamp: new Date("2026-06-01T08:00:00Z"), ipAddress: "10.0.1.47", userAgent: "Mozilla/5.0", success: true, details: "Training completion log filed" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-017" }, update: {}, create: { id: "dal-017", documentId: "doc-008", userId: "usr-fac-001", action: "VIEW", timestamp: new Date("2026-06-05T14:00:00Z"), ipAddress: "10.0.2.10", userAgent: "Mozilla/5.0", success: true, details: "Facility staff training verification" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-018" }, update: {}, create: { id: "dal-018", documentId: "doc-009", userId: "usr-002", action: "UPLOAD", timestamp: new Date("2026-07-03T16:00:00Z"), ipAddress: "10.0.1.46", userAgent: "Mozilla/5.0", success: true, details: "Insurance pre-auth documentation" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-019" }, update: {}, create: { id: "dal-019", documentId: "doc-009", userId: "usr-001", action: "VIEW", timestamp: new Date("2026-07-04T10:00:00Z"), ipAddress: "10.0.1.45", userAgent: "Mozilla/5.0", success: true, details: "Verified pre-auth for discharge planning" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-020" }, update: {}, create: { id: "dal-020", documentId: "doc-010", userId: "usr-admin-001", action: "UPLOAD", timestamp: new Date("2026-06-28T13:00:00Z"), ipAddress: "10.0.1.50", userAgent: "Mozilla/5.0", success: true, details: "Security incident report filed under legal hold" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-021" }, update: {}, create: { id: "dal-021", documentId: "doc-011", userId: "usr-001", action: "UPLOAD", timestamp: new Date("2026-07-06T09:00:00Z"), ipAddress: "10.0.1.45", userAgent: "Mozilla/5.0", success: true, details: "Final discharge summary uploaded" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-022" }, update: {}, create: { id: "dal-022", documentId: "doc-011", userId: "usr-002", action: "DOWNLOAD", timestamp: new Date("2026-07-06T14:00:00Z"), ipAddress: "10.0.1.46", userAgent: "Mozilla/5.0", success: true, details: "Downloaded for discharge coordination" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-023" }, update: {}, create: { id: "dal-023", documentId: "doc-012", userId: "usr-fac-001", action: "UPLOAD", timestamp: new Date("2026-06-20T10:00:00Z"), ipAddress: "10.0.2.10", userAgent: "Mozilla/5.0", success: true, details: "Q2 audit checklist completed and uploaded" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-024" }, update: {}, create: { id: "dal-024", documentId: "doc-013", userId: "usr-001", action: "UPLOAD", timestamp: new Date("2026-07-02T11:00:00Z"), ipAddress: "10.0.1.45", userAgent: "Mozilla/5.0", success: true, details: "Signed advance directive uploaded" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-025" }, update: {}, create: { id: "dal-025", documentId: "doc-014", userId: "usr-003", action: "UPLOAD", timestamp: new Date("2026-02-01T09:00:00Z"), ipAddress: "10.0.1.47", userAgent: "Mozilla/5.0", success: true, details: "Procedure manual v4 published" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-026" }, update: {}, create: { id: "dal-026", documentId: "doc-015", userId: "usr-admin-001", action: "UPLOAD", timestamp: new Date("2026-06-25T14:00:00Z"), ipAddress: "10.0.1.50", userAgent: "Mozilla/5.0", success: true, details: "Q2 risk assessment report filed" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-027" }, update: {}, create: { id: "dal-027", documentId: "doc-015", userId: "usr-001", action: "VIEW", timestamp: new Date("2026-06-26T11:00:00Z"), ipAddress: "10.0.1.45", userAgent: "Mozilla/5.0", success: true, details: "Read-only review of risk findings" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-028" }, update: {}, create: { id: "dal-028", documentId: "doc-015", userId: "usr-003", action: "DOWNLOAD", timestamp: new Date("2026-06-27T09:00:00Z"), ipAddress: "10.0.1.47", userAgent: "Mozilla/5.0", success: true, details: "Downloaded for departmental action items" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-029" }, update: {}, create: { id: "dal-029", documentId: "doc-003", userId: "usr-fac-001", action: "VIEW", timestamp: new Date("2026-06-18T08:00:00Z"), ipAddress: "10.0.2.10", userAgent: "Mozilla/5.0", success: true, details: "Facility review of privacy notice" } });
  await prisma.documentAccessLog.upsert({ where: { id: "dal-030" }, update: {}, create: { id: "dal-030", documentId: "doc-010", userId: "usr-001", action: "VIEW", timestamp: new Date("2026-06-29T10:00:00Z"), ipAddress: "10.0.1.45", userAgent: "Mozilla/5.0", success: true, details: "Social work notified of security incident" } });
  console.log("    ✔ 30 document access log records seeded");

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
