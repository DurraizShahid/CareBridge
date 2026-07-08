import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { UserRole, FacilityType, CareLevel, OrganizationType } from "../src/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const DEFAULT_PASSWORD = "CareBridge2026!";

interface SeedAccount {
  email: string;
  firstName: string;
  lastName: string;
  role: keyof typeof USER_ROLE_MAP;
  title: string;
  department: string;
  organizationId: string;
  hospitalId?: string;
}

const USER_ROLE_MAP: Record<string, UserRole> = {
  social_worker: "social_worker" as UserRole,
  discharge_planner: "discharge_planner" as UserRole,
  administrator: "administrator" as UserRole,
  facility_coordinator: "facility_coordinator" as UserRole,
  superadmin: "superadmin" as UserRole,
};

const ACCOUNTS: SeedAccount[] = [
  // ── Mercy Hospital Portland (org-001) ──
  {
    email: "sarah.johnson@mercyhospital.org",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "social_worker",
    title: "Senior Social Worker",
    department: "Discharge Planning",
    organizationId: "org-001",
    hospitalId: "hosp-001",
  },
  {
    email: "james.doe@mercyhospital.org",
    firstName: "James",
    lastName: "Doe",
    role: "discharge_planner",
    title: "Discharge Planner",
    department: "Discharge Planning",
    organizationId: "org-001",
    hospitalId: "hosp-001",
  },
  {
    email: "amanda.smith@mercyhospital.org",
    firstName: "Amanda",
    lastName: "Smith",
    role: "administrator",
    title: "Department Administrator",
    department: "Discharge Planning",
    organizationId: "org-001",
    hospitalId: "hosp-001",
  },
  {
    email: "patricia.moore@willametterehab.org",
    firstName: "Patricia",
    lastName: "Moore",
    role: "facility_coordinator",
    title: "Admissions Director",
    department: "Admissions",
    organizationId: "org-001",
    hospitalId: "fac-001",
  },
  {
    email: "michael.chen@stfranciscare.org",
    firstName: "Michael",
    lastName: "Chen",
    role: "facility_coordinator",
    title: "Executive Director",
    department: "Administration",
    organizationId: "org-001",
    hospitalId: "fac-002",
  },
  // ── Providence Health System (org-002) ──
  {
    email: "emily.rodriguez@providence.org",
    firstName: "Emily",
    lastName: "Rodriguez",
    role: "social_worker",
    title: "Medical Social Worker",
    department: "Care Coordination",
    organizationId: "org-002",
    hospitalId: "hosp-002",
  },
  {
    email: "thomas.brown@providence.org",
    firstName: "Thomas",
    lastName: "Brown",
    role: "discharge_planner",
    title: "Senior Discharge Planner",
    department: "Case Management",
    organizationId: "org-002",
    hospitalId: "hosp-002",
  },
  // ── OHSU Health (org-003) ──
  {
    email: "lisa.chang@ohsu.edu",
    firstName: "Lisa",
    lastName: "Chang",
    role: "social_worker",
    title: "Clinical Social Worker",
    department: "Patient Services",
    organizationId: "org-003",
    hospitalId: "hosp-003",
  },
  {
    email: "mark.wilson@ohsu.edu",
    firstName: "Mark",
    lastName: "Wilson",
    role: "administrator",
    title: "Administrative Director",
    department: "Operations",
    organizationId: "org-003",
    hospitalId: "hosp-003",
  },
  // ── Pacific Northwest Care Alliance (org-fac-001) ──
  {
    email: "jennifer.adams@pnwcare.org",
    firstName: "Jennifer",
    lastName: "Adams",
    role: "facility_coordinator",
    title: "Network Director",
    department: "Provider Relations",
    organizationId: "org-fac-001",
    hospitalId: "fac-006",
  },
  {
    email: "robert.kim@pnwcare.org",
    firstName: "Robert",
    lastName: "Kim",
    role: "facility_coordinator",
    title: "Admissions Coordinator",
    department: "Intake",
    organizationId: "org-fac-001",
    hospitalId: "fac-007",
  },
  // ── Super Admin ──
  {
    email: "admin@carebridgehealth.com",
    firstName: "Admin",
    lastName: "User",
    role: "superadmin",
    title: "System Administrator",
    department: "Operations",
    organizationId: "org-001",
    hospitalId: "hosp-001",
  },
];

async function seedOrganizations() {
  console.log("\n  Seeding organizations...");
  const orgs: { id: string; name: string; slug: string; type: OrganizationType }[] = [
    { id: "org-001", name: "Mercy Hospital Portland", slug: "mercy-hospital-portland", type: "hospital" as OrganizationType },
    { id: "org-002", name: "Providence Health System", slug: "providence-health", type: "hospital" as OrganizationType },
    { id: "org-003", name: "OHSU Health", slug: "ohsu-health", type: "hospital" as OrganizationType },
    { id: "org-fac-001", name: "Pacific Northwest Care Alliance", slug: "pacific-nw-care-alliance", type: "facility" as OrganizationType },
  ];
  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: { name: org.name, slug: org.slug, type: org.type },
      create: org,
    });
    console.log(`    ✔ ${org.id} — ${org.name}`);
  }
}

async function seedHospitals() {
  console.log("\n  Seeding hospitals...");
  const hospitals = [
    { id: "hosp-001", name: "Mercy Hospital Portland", street: "1000 Medical Center Drive", city: "Portland", zip: "97201", phone: "(503) 555-0000", npi: "1234567890", orgId: "org-001" },
    { id: "hosp-002", name: "Providence St. Vincent Medical Center", street: "9205 SW Barnes Road", city: "Portland", zip: "97225", phone: "(503) 555-0200", npi: "1234567891", orgId: "org-002" },
    { id: "hosp-003", name: "Oregon Health & Science University", street: "3181 SW Sam Jackson Park Road", city: "Portland", zip: "97239", phone: "(503) 555-0300", npi: "1234567892", orgId: "org-003" },
    { id: "hosp-004", name: "Legacy Emanuel Medical Center", street: "2801 N Gantenbein Avenue", city: "Portland", zip: "97227", phone: "(503) 555-0400", npi: "1234567893", orgId: "org-001" },
  ];
  for (const h of hospitals) {
    await prisma.hospital.upsert({
      where: { id: h.id },
      update: {},
      create: {
        id: h.id,
        name: h.name,
        address: JSON.stringify({ street: h.street, city: h.city, state: "OR", zipCode: h.zip }),
        phone: h.phone,
        npi: h.npi,
        organization: { connect: { id: h.orgId } },
      },
    });
    console.log(`    ✔ ${h.id} — ${h.name}`);
  }
}

async function seedFacilities() {
  console.log("\n  Seeding facilities...");
  const facilities = [
    {
      id: "fac-001", name: "Willamette Valley Rehabilitation Center", type: "rehabilitation_center" as FacilityType,
      street: "4500 Health Way", city: "Portland", zip: "97210", phone: "(503) 555-1000", email: "admissions@willametterehab.org",
      capacity: 120, occupancy: 98, orgId: "org-001", careLevels: ["skilled_nursing" as CareLevel, "rehabilitation" as CareLevel],
    },
    {
      id: "fac-002", name: "St. Francis Assisted Living Community", type: "assisted_living" as FacilityType,
      street: "2200 Peaceful Drive", city: "Portland", zip: "97202", phone: "(503) 555-2000", email: "info@stfranciscare.org",
      capacity: 80, occupancy: 72, orgId: "org-001", careLevels: ["independent_living" as CareLevel, "assisted_living" as CareLevel, "memory_care" as CareLevel],
    },
    {
      id: "fac-003", name: "Columbia River Skilled Nursing Facility", type: "skilled_nursing_facility" as FacilityType,
      street: "890 River Road", city: "Portland", zip: "97217", phone: "(503) 555-3000", email: "admissions@columbiasnf.org",
      capacity: 150, occupancy: 145, orgId: "org-001", careLevels: ["skilled_nursing" as CareLevel, "long_term_care" as CareLevel, "rehabilitation" as CareLevel],
    },
    {
      id: "fac-004", name: "Healing Hearts Home Health Agency", type: "home_health_agency" as FacilityType,
      street: "555 Care Lane", city: "Beaverton", zip: "97005", phone: "(503) 555-4000", email: "care@healinghearts.org",
      capacity: 200, occupancy: 165, orgId: "org-001", careLevels: ["home_health" as CareLevel, "hospice" as CareLevel],
    },
    {
      id: "fac-005", name: "Sunrise Memory Care Center", type: "assisted_living" as FacilityType,
      street: "1200 Sunrise Boulevard", city: "Gresham", zip: "97030", phone: "(503) 555-5000", email: "info@sunrisememory.org",
      capacity: 60, occupancy: 58, orgId: "org-001", careLevels: ["assisted_living" as CareLevel, "long_term_care" as CareLevel],
    },
    {
      id: "fac-006", name: "Pacific Northwest Home Health", type: "home_health_agency" as FacilityType,
      street: "7500 Greenway Road", city: "Portland", zip: "97201", phone: "(503) 555-6000", email: "admissions@pnwcare.org",
      capacity: 180, occupancy: 95, orgId: "org-fac-001", careLevels: ["home_health" as CareLevel, "hospice" as CareLevel],
    },
    {
      id: "fac-007", name: "Cascade Mountain Rehabilitation Center", type: "rehabilitation_center" as FacilityType,
      street: "3200 Recovery Lane", city: "Portland", zip: "97219", phone: "(503) 555-7000", email: "info@cascaderehab.org",
      capacity: 90, occupancy: 62, orgId: "org-fac-001", careLevels: ["rehabilitation" as CareLevel, "skilled_nursing" as CareLevel],
    },
  ];
  for (const f of facilities) {
    await prisma.facility.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        name: f.name,
        type: f.type,
        address: JSON.stringify({ street: f.street, city: f.city, state: "OR", zipCode: f.zip, county: "Multnomah" }),
        phone: f.phone,
        email: f.email,
        contacts: JSON.stringify([]),
        licensure: [],
        accreditations: [],
        capacity: f.capacity,
        currentOccupancy: f.occupancy,
        insuranceAccepted: ["Medicare", "Medicaid"],
        careLevelsOffered: f.careLevels,
        specialties: [],
        rating: 4.0,
        reviewsCount: 0,
        hasAvailability: true,
        acceptsMedicare: true,
        acceptsMedicaid: true,
        organization: { connect: { id: f.orgId } },
      },
    });
    console.log(`    ✔ ${f.id} — ${f.name}`);
  }
}

async function syncAccount(account: SeedAccount) {
  const roleKebab = account.role.replace(/_/g, "-");
  const dbRole = USER_ROLE_MAP[account.role];

  // Check if Clerk user already exists with this email
  let clerkUser;
  try {
    const existing = await clerk.users.getUserList({ emailAddress: [account.email], limit: 1 });
    if (existing.data.length > 0) {
      clerkUser = existing.data[0];
      console.log(`    ↻ Clerk user exists: ${clerkUser.id} — ${account.email}`);
      // Update metadata to ensure org/role are set (merge)
      await clerk.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: {
          role: roleKebab,
          organizationId: account.organizationId,
        },
      });
    } else {
      clerkUser = await clerk.users.createUser({
        emailAddress: [account.email],
        password: DEFAULT_PASSWORD,
        firstName: account.firstName,
        lastName: account.lastName,
        publicMetadata: {
          role: roleKebab,
          organizationId: account.organizationId,
        },
      });
      console.log(`    ✔ Created Clerk user: ${clerkUser.id} — ${account.email}`);
    }
  } catch (err: any) {
    console.error(`    ❌ Failed to create Clerk user ${account.email}: ${err.message ?? err}`);
    if (err.errors) console.error(`       ${JSON.stringify(err.errors)}`);
    return;
  }

  // Upsert DB user record — find by email first to avoid PK conflicts
  try {
    const existing = await prisma.user.findUnique({ where: { email: account.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: account.email },
        data: {
          id: clerkUser.id,
          firstName: account.firstName,
          lastName: account.lastName,
          role: dbRole,
          title: account.title,
          department: account.department,
          hospitalId: account.hospitalId ?? "",
          organizationId: account.organizationId,
          avatarUrl: clerkUser.imageUrl ?? undefined,
        },
      });
      console.log(`    ✔ DB user updated: ${account.email}`);
    } else {
      await prisma.user.create({
        data: {
          id: clerkUser.id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: dbRole,
          title: account.title,
          department: account.department,
          hospitalId: account.hospitalId ?? "",
          phone: "",
          organization: { connect: { id: account.organizationId } },
        },
      });
      console.log(`    ✔ DB user created: ${account.email}`);
    }
  } catch (err: any) {
    console.error(`    ❌ Failed to sync DB user ${account.email}: ${err.message ?? err}`);
    if (err.errors) console.error(`       ${JSON.stringify(err.errors)}`);
  }
}

async function main() {
  console.log("🌱 Syncing Clerk accounts and seed data for CareBridge...\n");

  await seedOrganizations();
  await seedHospitals();
  await seedFacilities();

  console.log("\n  Syncing user accounts...");
  for (const account of ACCOUNTS) {
    await syncAccount(account);
  }

  console.log("\n✅ Seed sync complete!");
  console.log(`   ${ACCOUNTS.length} accounts processed`);
  console.log(`   Default password: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
