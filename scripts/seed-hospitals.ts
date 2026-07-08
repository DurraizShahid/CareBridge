import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { UserRole } from "../src/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const DEFAULT_PASSWORD = "CareBridge2026!";

const USER_ROLE_MAP: Record<string, UserRole> = {
  social_worker: "social_worker" as UserRole,
  discharge_planner: "discharge_planner" as UserRole,
  administrator: "administrator" as UserRole,
  facility_coordinator: "facility_coordinator" as UserRole,
  superadmin: "superadmin" as UserRole,
};

type HospitalSeed = {
  id: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  phone: string;
  npi: string;
  orgId: string;
};

type UserSeed = {
  email: string;
  firstName: string;
  lastName: string;
  role: keyof typeof USER_ROLE_MAP;
  title: string;
  department: string;
  organizationId: string;
  hospitalId: string;
};

const HOSPITALS: HospitalSeed[] = [
  // ── Mercy Hospital Portland (org-001) — currently has hosp-001, hosp-004 ──
  {
    id: "hosp-005", name: "Mercy Children's Hospital of Portland",
    street: "830 NW 10th Avenue", city: "Portland", zip: "97209", phone: "(503) 555-0500", npi: "1234567894", orgId: "org-001",
  },
  // ── Providence Health System (org-002) — currently has hosp-002 ──
  {
    id: "hosp-006", name: "Providence Portland Medical Center",
    street: "4805 NE Glisan Street", city: "Portland", zip: "97213", phone: "(503) 555-0600", npi: "1234567895", orgId: "org-002",
  },
  {
    id: "hosp-007", name: "Providence Willamette Falls Medical Center",
    street: "1500 Division Street", city: "Oregon City", zip: "97045", phone: "(503) 555-0700", npi: "1234567896", orgId: "org-002",
  },
  // ── OHSU Health (org-003) — currently has hosp-003 ──
  {
    id: "hosp-008", name: "OHSU Hillsboro Medical Center",
    street: "335 SE 8th Avenue", city: "Hillsboro", zip: "97123", phone: "(503) 555-0800", npi: "1234567897", orgId: "org-003",
  },
  {
    id: "hosp-009", name: "OHSU Doernbecher Children's Hospital",
    street: "700 SW Campus Drive", city: "Portland", zip: "97239", phone: "(503) 555-0900", npi: "1234567898", orgId: "org-003",
  },
];

const HOSPITAL_USERS: UserSeed[] = [
  // ── Mercy Children's Hospital ──
  {
    email: "jennifer.williams@mercyhospital.org",
    firstName: "Jennifer", lastName: "Williams",
    role: "social_worker",
    title: "Pediatric Social Worker", department: "Pediatric Services",
    organizationId: "org-001", hospitalId: "hosp-005",
  },
  {
    email: "robert.davis@mercyhospital.org",
    firstName: "Robert", lastName: "Davis",
    role: "discharge_planner",
    title: "Pediatric Discharge Coordinator", department: "Case Management",
    organizationId: "org-001", hospitalId: "hosp-005",
  },
  // ── Providence Portland Medical Center ──
  {
    email: "michelle.lee@providence.org",
    firstName: "Michelle", lastName: "Lee",
    role: "social_worker",
    title: "Clinical Social Worker", department: "Patient Support",
    organizationId: "org-002", hospitalId: "hosp-006",
  },
  {
    email: "christopher.garcia@providence.org",
    firstName: "Christopher", lastName: "Garcia",
    role: "discharge_planner",
    title: "Discharge Planning Specialist", department: "Care Coordination",
    organizationId: "org-002", hospitalId: "hosp-006",
  },
  // ── Providence Willamette Falls ──
  {
    email: "rebecca.taylor@providence.org",
    firstName: "Rebecca", lastName: "Taylor",
    role: "social_worker",
    title: "Medical Social Worker", department: "Social Services",
    organizationId: "org-002", hospitalId: "hosp-007",
  },
  // ── OHSU Hillsboro Medical Center ──
  {
    email: "james.anderson@ohsu.edu",
    firstName: "James", lastName: "Anderson",
    role: "social_worker",
    title: "Clinical Social Worker", department: "Patient Care",
    organizationId: "org-003", hospitalId: "hosp-008",
  },
  {
    email: "victoria.martin@ohsu.edu",
    firstName: "Victoria", lastName: "Martin",
    role: "discharge_planner",
    title: "Discharge Planner", department: "Care Coordination",
    organizationId: "org-003", hospitalId: "hosp-008",
  },
  // ── OHSU Doernbecher Children's Hospital ──
  {
    email: "daniel.thompson@ohsu.edu",
    firstName: "Daniel", lastName: "Thompson",
    role: "social_worker",
    title: "Pediatric Social Worker", department: "Child & Family Services",
    organizationId: "org-003", hospitalId: "hosp-009",
  },
];

async function seedHospital(h: HospitalSeed) {
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

async function syncUser(u: UserSeed) {
  const roleKebab = u.role.replace(/_/g, "-");
  const dbRole = USER_ROLE_MAP[u.role];

  let clerkUser;
  try {
    const existing = await clerk.users.getUserList({ emailAddress: [u.email], limit: 1 });
    if (existing.data.length > 0) {
      clerkUser = existing.data[0];
      console.log(`    ↻ Clerk user: ${clerkUser.id} — ${u.email}`);
      await clerk.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: { role: roleKebab, organizationId: u.organizationId },
      });
    } else {
      clerkUser = await clerk.users.createUser({
        emailAddress: [u.email], password: DEFAULT_PASSWORD,
        firstName: u.firstName, lastName: u.lastName,
        publicMetadata: { role: roleKebab, organizationId: u.organizationId },
      });
      console.log(`    ✔ Clerk user: ${clerkUser.id} — ${u.email}`);
    }
  } catch (err: any) {
    console.error(`    ❌ Clerk ${u.email}: ${err.message ?? err}`);
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          id: clerkUser.id, firstName: u.firstName, lastName: u.lastName,
          role: dbRole, title: u.title, department: u.department,
          hospitalId: u.hospitalId, organizationId: u.organizationId,
          avatarUrl: clerkUser.imageUrl ?? undefined,
        },
      });
      console.log(`    ✔ DB updated: ${u.email}`);
    } else {
      await prisma.user.create({
        data: {
          id: clerkUser.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
          role: dbRole, title: u.title, department: u.department,
          hospitalId: u.hospitalId, phone: "",
          organization: { connect: { id: u.organizationId } },
        },
      });
      console.log(`    ✔ DB created: ${u.email}`);
    }
  } catch (err: any) {
    console.error(`    ❌ DB ${u.email}: ${err.message ?? err}`);
  }
}

async function main() {
  console.log("🏥 Seeding hospitals...\n");

  console.log("  Hospitals...");
  for (const h of HOSPITALS) await seedHospital(h);

  console.log("\n  Users...");
  for (const u of HOSPITAL_USERS) await syncUser(u);

  // Summary
  const prisma2 = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const orgs = await prisma2.organization.findMany({ where: { type: "hospital" }, select: { id: true, name: true } });
  console.log("\n📊 Per org:");
  for (const o of orgs) {
    const count = await prisma2.hospital.count({ where: { organizationId: o.id } });
    console.log(`  ${o.name.padEnd(36)} ${count} hospitals`);
  }
  await prisma2.$disconnect();

  console.log(`\n✅ Done! ${HOSPITALS.length} hospitals, ${HOSPITAL_USERS.length} users.`);
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
