import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("Syncing Clerk users to database...\n");

  // 1. Create all organizations
  const orgs = [
    { id: "org-001", name: "Mercy Hospital Portland", slug: "mercy-hospital-portland", type: "hospital" as const },
    { id: "org-002", name: "Providence Health System", slug: "providence-health-system", type: "hospital" as const },
    { id: "org-003", name: "OHSU Health", slug: "ohsu-health", type: "hospital" as const },
    { id: "org-fac-001", name: "PNW Care Network", slug: "pnw-care-network", type: "facility" as const },
    { id: "org-fac-002", name: "Willamette Valley Senior Care", slug: "willamette-valley-senior-care", type: "facility" as const },
    { id: "org-fac-003", name: "Cascade Health Partners", slug: "cascade-health-partners", type: "facility" as const },
    { id: "org-fac-004", name: "Oregon Community Care", slug: "oregon-community-care", type: "facility" as const },
    { id: "dd1ad99e-2169-4944-9c86-dd7ae2724285", name: "Helptribe Health", slug: "helptribe-health", type: "facility" as const },
    { id: "c7d71253-caea-4d7f-a986-336a70b072b0", name: "Dilivygo Medical", slug: "dilivygo-medical", type: "hospital" as const },
    { id: "203b4d6c-7b4f-4c56-95d1-57273bca2078", name: "Shahid Care Network", slug: "shahid-care-network", type: "facility" as const },
    { id: "a78ccc4e-0469-4b7d-9932-13111d6f86f7", name: "Zain Medical", slug: "zain-medical", type: "hospital" as const },
  ];

  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: { name: org.name, slug: org.slug, type: org.type },
      create: { id: org.id, name: org.name, slug: org.slug, type: org.type },
    });
    console.log(`  Organization: ${org.id} — ${org.name}`);
  }

  // 2. Migrate seed user IDs to real Clerk IDs via raw SQL (preserves FK references)
  const seedToClerkMap: Record<string, string> = {
    "usr-001": "user_3GEsg749KP6H6T6hWRmcYQQdUiJ",
    "usr-002": "user_3GEsgAOzcyP4DMkKDn5d5FYSwD3",
    "usr-003": "user_3GEsgTLgmitaObEI6FYzDJaosN6",
    "usr-fac-001": "user_3GEsghO8f05nIavWvz799m1O7Ae",
    "usr-fac-002": "user_3GEsgrTz1AZq2u8QADNsnGSfqDX",
    "usr-admin-001": "user_3GEsiKFV0PlEhRFKNLaiHvHrxQk",
  };

  for (const [oldId, newId] of Object.entries(seedToClerkMap)) {
    const exists = await prisma.user.findUnique({ where: { id: oldId } });
    if (exists) {
      // Update all FK references first, then the user ID
      const refs = [
        prisma.$executeRawUnsafe(`UPDATE "Document" SET "uploadedById" = $1 WHERE "uploadedById" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "DocumentAccessLog" SET "userId" = $1 WHERE "userId" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "DocumentVersion" SET "uploadedById" = $1 WHERE "uploadedById" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "Patient" SET "socialWorkerId" = $1 WHERE "socialWorkerId" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "Placement" SET "socialWorkerId" = $1 WHERE "socialWorkerId" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "Placement" SET "approvedBy" = $1 WHERE "approvedBy" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "InviteCode" SET "createdById" = $1 WHERE "createdById" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "JoinRequest" SET "userId" = $1 WHERE "userId" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "JoinRequest" SET "reviewedById" = $1 WHERE "reviewedById" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "ActivityEvent" SET "userId" = $1 WHERE "userId" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "Chat" SET "createdById" = $1 WHERE "createdById" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "ChatMessage" SET "senderId" = $1 WHERE "senderId" = $2`, newId, oldId),
        prisma.$executeRawUnsafe(`UPDATE "User" SET id = $1 WHERE id = $2`, newId, oldId),
      ];
      await Promise.all(refs.map((r) => r.catch(() => {})));
      // Now update the remaining fields
      await prisma.user.update({
        where: { id: newId },
        data: { role: seedToClerkRole(newId) as any },
      });
      console.log(`  Migrated user ${oldId} -> ${newId}`);
    }
  }

  // 3. Upsert all Clerk users
  const users = [
    { id: "user_3GOtu2hLVJR0qFIVSPP5YxJCNkU", email: "zainspam16@gmail.com", firstName: "Zain", lastName: "Spam", role: "administrator", org: "a78ccc4e-0469-4b7d-9932-13111d6f86f7" },
    { id: "user_3GEuacDpi6N3XRj1gtQg4cCdI6Z", email: "daniel.thompson@ohsu.edu", firstName: "Daniel", lastName: "Thompson", role: "social_worker", org: "org-003" },
    { id: "user_3GEuaRQMsR0NRHJnOhiIuNsYaaC", email: "victoria.martin@ohsu.edu", firstName: "Victoria", lastName: "Martin", role: "discharge_planner", org: "org-003" },
    { id: "user_3GEuaEVfPEIXGBq45IOfqBDWUcP", email: "james.anderson@ohsu.edu", firstName: "James", lastName: "Anderson", role: "social_worker", org: "org-003" },
    { id: "user_3GEua4nYqKUKV4jYtgzf2cB0hs0", email: "rebecca.taylor@providence.org", firstName: "Rebecca", lastName: "Taylor", role: "social_worker", org: "org-002" },
    { id: "user_3GEuZnUxYPiOLkJwdfWC8NJCzez", email: "christopher.garcia@providence.org", firstName: "Christopher", lastName: "Garcia", role: "discharge_planner", org: "org-002" },
    { id: "user_3GEuZYuDcW4ZtfSyeih8i3upXx1", email: "michelle.lee@providence.org", firstName: "Michelle", lastName: "Lee", role: "social_worker", org: "org-002" },
    { id: "user_3GEuZSRQkU10sWIY8xRmxR3Q0Z9", email: "robert.davis@mercyhospital.org", firstName: "Robert", lastName: "Davis", role: "discharge_planner", org: "org-001" },
    { id: "user_3GEuZBQ2IXonDnrZvcqKA3bYwRe", email: "jennifer.williams@mercyhospital.org", firstName: "Jennifer", lastName: "Williams", role: "social_worker", org: "org-001" },
    { id: "user_3GEtbp2uban8A2d5wa71aumvEIx", email: "amanda.foster@orcommunitycare.org", firstName: "Amanda", lastName: "Foster", role: "facility_coordinator", org: "org-fac-004" },
    { id: "user_3GEtbi7PAbcRSmNFb0HJBgpMq0L", email: "daniel.cho@orcommunitycare.org", firstName: "Daniel", lastName: "Cho", role: "facility_coordinator", org: "org-fac-004" },
    { id: "user_3GEtbNLp55RIfSgElnO1aN7rh6u", email: "laura.martinez@orcommunitycare.org", firstName: "Laura", lastName: "Martinez", role: "facility_coordinator", org: "org-fac-004" },
    { id: "user_3GEtb6sPT7cCcknxi5MUnZWqgWO", email: "michael.torres@cascadehp.org", firstName: "Michael", lastName: "Torres", role: "facility_coordinator", org: "org-fac-003" },
    { id: "user_3GEtaxfsupw5U9Noh3DyOrmhtq1", email: "susan.parker@cascadehp.org", firstName: "Susan", lastName: "Parker", role: "facility_coordinator", org: "org-fac-003" },
    { id: "user_3GEtarP47DFetiVQKdlHafoffHp", email: "kevin.johnson@cascadehp.org", firstName: "Kevin", lastName: "Johnson", role: "facility_coordinator", org: "org-fac-003" },
    { id: "user_3GEtadGHnynbfJ2CPebS3kOTxFA", email: "catherine.smith@wvseniorcare.org", firstName: "Catherine", lastName: "Smith", role: "facility_coordinator", org: "org-fac-002" },
    { id: "user_3GEtaW7p29O7qyx0afsSxXdG3nT", email: "jason.wu@wvseniorcare.org", firstName: "Jason", lastName: "Wu", role: "facility_coordinator", org: "org-fac-002" },
    { id: "user_3GEtaIpisRjxEmJwGq1hMDVFq77", email: "margaret.oneill@wvseniorcare.org", firstName: "Margaret", lastName: "O'Neill", role: "facility_coordinator", org: "org-fac-002" },
    { id: "user_3GEtaCN59UKaIs21lG9SUTvDP7k", email: "rachel.green@pnwcare.org", firstName: "Rachel", lastName: "Green", role: "facility_coordinator", org: "org-fac-001" },
    { id: "user_3GEtZrtZ4eN9AyEMraFp8atkQTf", email: "david.nguyen@pnwcare.org", firstName: "David", lastName: "Nguyen", role: "facility_coordinator", org: "org-fac-001" },
    { id: "user_3GEtZitYUSQkeaLXVQQ2EWDTmMX", email: "sandra.weiss@pnwcare.org", firstName: "Sandra", lastName: "Weiss", role: "facility_coordinator", org: "org-fac-001" },
    { id: "user_3GEsiKFV0PlEhRFKNLaiHvHrxQk", email: "admin@carebridgehealth.com", firstName: "Admin", lastName: "User", role: "superadmin", org: "org-001" },
    { id: "user_3GEsi5wS4PxtNwGmDpfi5Dsptav", email: "robert.kim@pnwcare.org", firstName: "Robert", lastName: "Kim", role: "facility_coordinator", org: "org-fac-001" },
    { id: "user_3GEshpUiJFDKHwkuy4h9FYpnBwn", email: "jennifer.adams@pnwcare.org", firstName: "Jennifer", lastName: "Adams", role: "facility_coordinator", org: "org-fac-001" },
    { id: "user_3GEshZV1H8BW9m0BN6tdSJbmA29", email: "mark.wilson@ohsu.edu", firstName: "Mark", lastName: "Wilson", role: "administrator", org: "org-003" },
    { id: "user_3GEshRhAPaw6rcLbZ8gTH2pBIZX", email: "lisa.chang@ohsu.edu", firstName: "Lisa", lastName: "Chang", role: "social_worker", org: "org-003" },
    { id: "user_3GEshNOs0I23Vz8eDIQbW0Lpgu7", email: "thomas.brown@providence.org", firstName: "Thomas", lastName: "Brown", role: "discharge_planner", org: "org-002" },
    { id: "user_3GEsh7DjWeLSMxoeIVj98OglK84", email: "emily.rodriguez@providence.org", firstName: "Emily", lastName: "Rodriguez", role: "social_worker", org: "org-002" },
    { id: "user_3GEcNoywpHJMZBqAkZk7cLpMBjc", email: "helptribepk@gmail.com", firstName: "helptribe", lastName: "", role: "facility_coordinator", org: "dd1ad99e-2169-4944-9c86-dd7ae2724285" },
    { id: "user_3GEbciqGGhrPcazOrLcvVhjd8kh", email: "dilivygo.app@gmail.com", firstName: "Dilivygo", lastName: "", role: "administrator", org: "c7d71253-caea-4d7f-a986-336a70b072b0" },
    { id: "user_3GEFBTvw4wcJDZyaGeUF5GNlrjW", email: "durraizshahid99@gmail.com", firstName: "Durraiz", lastName: "Shahid", role: "facility_coordinator", org: "203b4d6c-7b4f-4c56-95d1-57273bca2078" },
  ];

  for (const u of users) {
    // Skip users whose IDs were already migrated in step 2
    const alreadyMigrated = Object.values(seedToClerkMap).includes(u.id);
    if (alreadyMigrated) continue;

    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role as any,
        organizationId: u.org,
      },
      create: {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role as any,
        title: u.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        department: "General",
        hospitalId: "",
        phone: "",
        organizationId: u.org,
      },
    });
    console.log(`  User: ${u.id} — ${u.firstName} ${u.lastName} (${u.role}) @ ${u.org}`);
  }

  await prisma.$disconnect();
  console.log("\nDone! All Clerk users synced to database.");
}

function seedToClerkRole(newId: string): string {
  const roleMap: Record<string, string> = {
    "user_3GEsg749KP6H6T6hWRmcYQQdUiJ": "social_worker",
    "user_3GEsgAOzcyP4DMkKDn5d5FYSwD3": "discharge_planner",
    "user_3GEsgTLgmitaObEI6FYzDJaosN6": "administrator",
    "user_3GEsghO8f05nIavWvz799m1O7Ae": "facility_coordinator",
    "user_3GEsgrTz1AZq2u8QADNsnGSfqDX": "facility_coordinator",
  };
  return roleMap[newId] ?? "customer";
}

main().catch((e) => {
  console.error("Sync failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
