import { createHash } from "node:crypto";
import type { PrismaClient } from "../src/generated/prisma/client";
import { seedFacilityDemoPhotos } from "../scripts/facility-demo-photos";

/**
 * Deterministic, explicitly fictional demo fixtures for visual QA.
 * No real patients, contacts, credentials, signatures, or payments.
 * Fixed IDs and upserts make repeated `prisma db seed` runs safe.
 */
export async function seedDemoPolish(prisma: PrismaClient) {
  const date = (day: number, hour = 12) => new Date(Date.UTC(2026, 9, day, hour));
  const label = "SYNTHETIC DEMO DATA — NO REAL PHI.";

  await prisma.organization.update({
    where: { id: "org-001" }, data: { name: "Mercy General", slug: "mercy-general", type: "hospital" },
  });
  await prisma.organization.update({
    where: { id: "org-002" }, data: { name: "Pinecrest Regional Health (Demo)", slug: "pinecrest-regional-demo", type: "hospital" },
  });
  await prisma.organization.update({
    where: { id: "org-003" }, data: { name: "Juniper Demo Care Network", slug: "juniper-demo-care", type: "facility" },
  });
  await prisma.hospital.update({ where: { id: "hosp-001" }, data: {
    name: "Mercy General", address: { street: "101 Example Hospital Way", city: "Portland", state: "OR", zipCode: "97201" },
    phone: "(503) 555-0111", npi: "DEMO-NPI-001",
  } });
  await prisma.hospital.update({ where: { id: "hosp-002" }, data: {
    name: "Pinecrest Regional Hospital (Demo)", address: { street: "202 Fictional Medical Plaza", city: "Beaverton", state: "OR", zipCode: "97005" },
    phone: "(503) 555-0112", npi: "DEMO-NPI-002",
  } });
  // These two extra hospital rows were introduced by the legacy demo seed.
  await prisma.hospital.deleteMany({ where: { id: { in: ["hosp-003", "hosp-004"] } } });

  // Facility-facing demo operators belong to the facility org, not the hospital.
  for (const id of ["usr-fac-001", "usr-fac-002"]) {
    await prisma.user.update({ where: { id }, data: { organizationId: "org-003" } });
  }
  for (const staff of [
    { id: "usr-004", firstName: "Ellis", lastName: "Parker", role: "social_worker" as const,
      email: "ellis.parker@demo.carebridge.example", title: "Placement Social Worker" },
    { id: "usr-005", firstName: "Sage", lastName: "Monroe", role: "discharge_planner" as const,
      email: "sage.monroe@demo.carebridge.example", title: "Discharge Coordinator" },
  ]) {
    const data = {
      ...staff, department: "Care Transitions", hospitalId: "hosp-002",
      phone: "(503) 555-0110", organizationId: "org-002",
    };
    await prisma.user.upsert({ where: { id: staff.id }, create: data, update: data });
  }

  // Seeded ratings are fictional illustrative figures, not provider reviews or claims.
  const facilities = [
    { id: "fac-001", name: "Willow Harbor Rehabilitation (Demo)", description: "Short-stay recovery suites with daily PT, OT, and stroke rehabilitation.", capacity: 84, currentOccupancy: 70, rating: 4.6, reviewsCount: 76, hasAvailability: true, waitlistDays: 0, careLevelsOffered: ["rehabilitation", "skilled_nursing"] as const, specialties: ["Post-acute rehabilitation", "Stroke recovery", "Physical therapy", "Occupational therapy"] },
    { id: "fac-002", name: "Juniper Grove Assisted Living (Demo)", description: "A smaller assisted living community with medication support and daily activities.", capacity: 52, currentOccupancy: 47, rating: 4.4, reviewsCount: 43, hasAvailability: true, waitlistDays: 2, careLevelsOffered: ["assisted_living", "independent_living", "memory_care"] as const, specialties: ["Daily living assistance", "Medication support", "Memory care", "Family visiting"] },
    { id: "fac-003", name: "Cedar Bay Skilled Nursing (Demo)", description: "24-hour nursing, IV support, wound care, and longer-term clinical stays.", capacity: 108, currentOccupancy: 106, rating: 4.1, reviewsCount: 118, hasAvailability: true, waitlistDays: 5, careLevelsOffered: ["skilled_nursing", "long_term_care", "rehabilitation"] as const, specialties: ["Wound care", "24-hour nursing", "IV therapy", "Post-surgical monitoring"] },
    { id: "fac-004", name: "Harbor Light Home Health (Demo)", description: "Home-based nursing, oxygen support, and coordinated rehabilitative visits.", capacity: 36, currentOccupancy: 23, rating: 4.7, reviewsCount: 31, hasAvailability: true, waitlistDays: 0, careLevelsOffered: ["home_health", "hospice"] as const, specialties: ["In-home nursing", "Oxygen management", "Physical therapy", "Palliative support"] },
    { id: "fac-005", name: "Maple Rise Memory Care (Demo)", description: "Secure memory-care cottages with dementia-informed daily routines.", capacity: 42, currentOccupancy: 41, rating: 4.8, reviewsCount: 54, hasAvailability: true, waitlistDays: 7, careLevelsOffered: ["memory_care", "assisted_living", "long_term_care"] as const, specialties: ["Dementia care", "Secure memory unit", "Behavioral support", "24-hour supervision"] },
  ] as const;
  for (const [index, facility] of facilities.entries()) {
    const { id, careLevelsOffered, ...data } = facility;
    await prisma.facility.update({
      where: { id }, data: { ...data, careLevelsOffered: [...careLevelsOffered],
        specialties: [...data.specialties], organizationId: "org-003",
        address: { street: `${301 + index} Fictional Care Road`, city: "Portland", state: "OR", zipCode: "97201" },
        phone: `(503) 555-01${String(40 + index).padStart(2, "0")}`,
        email: `admissions${index + 1}@demo.carebridge.example`,
        website: `https://carebridge.example/facilities/${id}`,
        contacts: [{ name: "Demo Admissions Coordinator", role: "Admissions", phone: "(503) 555-0198", email: "admissions@demo.carebridge.example" }],
        licensure: [`DEMO-OR-LICENSE-${id}`], accreditations: ["Demo profile — not verified"],
      },
    });
  }

  const hospice = {
    id: "fac-006", name: "Cedar Light Hospice House (Demo)",
    description: "Small residential hospice residence focused on comfort, family visits, and symptom support.",
    type: "hospice" as const,
    address: JSON.stringify({ street: "116 Example Court", city: "Beaverton", state: "OR", zipCode: "97005" }),
    phone: "(503) 555-0116", email: "admissions@demo.carebridge.example",
    website: "https://carebridge.example/facilities/cedar-light",
    contacts: JSON.stringify([{ name: "Demo Admissions Desk", role: "Admissions", phone: "(503) 555-0116", email: "admissions@demo.carebridge.example" }]),
    licensure: ["DEMO-OR-HOSPICE-006"], accreditations: ["Illustrative accreditation — not verified"],
    capacity: 18, currentOccupancy: 13, insuranceAccepted: ["Medicare", "Medicaid", "Private Pay"],
    careLevelsOffered: ["hospice" as const], specialties: ["Comfort care", "Symptom management", "Family support", "Palliative nursing"],
    rating: 4.9, reviewsCount: 24, hasAvailability: true, waitlistDays: 0,
    acceptsMedicare: true, acceptsMedicaid: true, organizationId: "org-003",
  };
  await prisma.facility.upsert({ where: { id: hospice.id }, create: hospice, update: hospice });
  await seedFacilityDemoPhotos(prisma, ["fac-006"]);

  const oldPatients = [
    { id: "pat-001", firstName: "Avery", lastName: "Whitcomb", status: "ready_for_discharge" as const, careLevelRequired: "skilled_nursing" as const },
    { id: "pat-002", firstName: "Miles", lastName: "Ellery", status: "assessment_in_progress" as const, careLevelRequired: "rehabilitation" as const },
    { id: "pat-003", firstName: "Nora", lastName: "Bellamy", status: "ready_for_discharge" as const, careLevelRequired: "home_health" as const },
    { id: "pat-004", firstName: "Caleb", lastName: "Merritt", status: "admitted" as const, careLevelRequired: "memory_care" as const },
    { id: "pat-005", firstName: "Lina", lastName: "Ashford", status: "assessment_in_progress" as const, careLevelRequired: "rehabilitation" as const },
  ];
  for (const [index, patient] of oldPatients.entries()) {
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        ...patient,
        address: { street: `${121 + index} Fictional Way`, city: "Portland", state: "OR", zipCode: "97201" },
        mrn: `DEMO-MRN-00${index + 1}`,
        phone: `(503) 555-01${String(20 + index).padStart(2, "0")}`,
        emergencyContact: { name: "Demo Family Contact", role: "Family", phone: "(503) 555-0199", email: "family@demo.carebridge.example" },
        insurance: [{ provider: "Demo Insurance", policyNumber: `DEMO-POLICY-${index + 1}`, type: "private", status: "verified" }],
        notes: `${label} ${["Post-surgical nursing and mobility assistance.", "Intensive PT and OT following stroke.", "In-home respiratory support and nursing visits.", "24-hour dementia-informed care needed.", "Wheelchair-accessible intensive rehabilitation."][index]}`,
      },
    });
  }

  // Refresh legacy dashboard activity cards on repeat seeds as well.
  const legacyActivityPatients = ["pat-001", "pat-003", "pat-002", "pat-004", "pat-001", "pat-005"];
  for (const [index, id] of legacyActivityPatients.entries()) {
    const patient = await prisma.patient.findUniqueOrThrow({ where: { id } });
    await prisma.activityEvent.update({
      where: { id: `act-00${index + 1}` },
      data: { patientName: `${patient.firstName} ${patient.lastName}`,
        description: `${label} Example care transitions activity for ${patient.firstName} ${patient.lastName}.` },
    });
  }

  // Legacy vault fixtures used recognizable surnames in file metadata. Re-label
  // the seeded DEMO records on existing databases as well as fresh databases.
  const demoDocumentTitles: Record<string, string> = {
    "doc-001": "DEMO — Patient Consent — Avery Whitcomb",
    "doc-002": "DEMO — Mercy General / Willow Harbor BAA",
    "doc-006": "DEMO — Placement Assessment — Miles Ellery",
    "doc-009": "DEMO — Insurance Pre-Authorization — Nora Bellamy",
    "doc-011": "DEMO — Discharge Summary — Avery Whitcomb",
    "doc-013": "DEMO — Advance Directive — Miles Ellery",
  };
  for (let index = 1; index <= 15; index++) {
    const id = `doc-${String(index).padStart(3, "0")}`;
    const original = await prisma.document.findUniqueOrThrow({ where: { id } });
    const fileName = `synthetic-${id}.${original.fileName.endsWith(".xlsx") ? "xlsx" : "pdf"}`;
    await prisma.document.update({ where: { id }, data: {
      title: demoDocumentTitles[id] ?? `DEMO — ${original.title.replace(/^DEMO — /, "")}`,
      notes: label, fileName, storageKey: `demo-fixtures/${fileName}`,
      tags: ["demo", "synthetic"],
    } });
  }

  const newPatients = [
    { id: "pat-006", mrn: "DEMO-MRN-006", firstName: "Renee", lastName: "Valen", birth: "1944-02-12", age: 82, careLevelRequired: "memory_care" as const, status: "ready_for_discharge" as const, org: "org-001", hospital: "hosp-001", worker: "usr-002", diagnosis: "Cognitive decline with wandering risk", need: "Secured memory-care suite; medication reminders.", payer: "Medicaid" },
    { id: "pat-007", mrn: "DEMO-MRN-007", firstName: "Theo", lastName: "Larkin", birth: "1950-06-18", age: 76, careLevelRequired: "assisted_living" as const, status: "ready_for_discharge" as const, org: "org-002", hospital: "hosp-002", worker: "usr-004", diagnosis: "Reduced independence after prolonged admission", need: "Assistance with activities of daily living; ready for contract.", payer: "Private Pay" },
    { id: "pat-008", mrn: "DEMO-MRN-008", firstName: "Iris", lastName: "Kendall", birth: "1947-09-23", age: 79, careLevelRequired: "rehabilitation" as const, status: "placed" as const, org: "org-001", hospital: "hosp-001", worker: "usr-001", diagnosis: "Post-operative mobility limitations", need: "Short-stay multidisciplinary rehabilitation; placement complete.", payer: "Medicare" },
    { id: "pat-009", mrn: "DEMO-MRN-009", firstName: "Owen", lastName: "Sutter", birth: "1939-04-07", age: 87, careLevelRequired: "skilled_nursing" as const, status: "placed" as const, org: "org-002", hospital: "hosp-002", worker: "usr-005", diagnosis: "Complex dressing and wound-care needs", need: "24-hour skilled nursing; placement complete.", payer: "Medicare" },
    { id: "pat-010", mrn: "DEMO-MRN-010", firstName: "Esme", lastName: "Rowan", birth: "1941-11-11", age: 84, careLevelRequired: "hospice" as const, status: "ready_for_discharge" as const, org: "org-002", hospital: "hosp-002", worker: "usr-004", diagnosis: "Comfort-focused end-of-life care needs", need: "Residential hospice and family support; referral sent.", payer: "Medicare" },
  ];
  for (const [i, patient] of newPatients.entries()) {
    const create = {
      id: patient.id, mrn: patient.mrn, firstName: patient.firstName, lastName: patient.lastName,
      dateOfBirth: new Date(patient.birth), age: patient.age, gender: i % 2 ? "male" : "female",
      address: { street: `${201 + i} Fictional Way`, city: "Portland", state: "OR", zipCode: "97201" },
      phone: `(503) 555-01${String(30 + i).padStart(2, "0")}`,
      emergencyContact: { name: "Demo Family Contact", role: "Family", phone: "(503) 555-0199", email: "family@demo.carebridge.example" },
      insurance: [{ provider: patient.payer, policyNumber: `DEMO-POLICY-${i + 6}`, type: "private", status: "verified" }],
      primaryDiagnosis: patient.diagnosis, secondaryDiagnoses: ["Demo assessment — not a clinical record"],
      careLevelRequired: patient.careLevelRequired, notes: `${label} ${patient.need}`,
      socialWorkerId: patient.worker, hospitalId: patient.hospital, organizationId: patient.org,
      admissionDate: date(1 + i), estimatedDischargeDate: date(8 + i), status: patient.status,
    };
    await prisma.patient.upsert({ where: { id: patient.id }, create, update: create });
  }

  // Placement statuses represent workflow progression; only the last two are completed.
  for (const existing of [
    { id: "plc-001", status: "pending_approval" as const, facilityId: "fac-003" },
    { id: "plc-002", status: "matching" as const, facilityId: null },
    { id: "plc-003", status: "pending_approval" as const, facilityId: "fac-004" },
  ]) {
    await prisma.placement.update({ where: { id: existing.id },
      data: { status: existing.status, facilityId: existing.facilityId,
        selectedFacilityId: existing.facilityId,
        notes: `${label} ${existing.status.replaceAll("_", " ")} stage.` } });
  }
  const placements = [
    { id: "plc-006", pat: "pat-006", fac: "fac-005", org: "org-001", worker: "usr-002", care: "memory_care" as const, status: "approved" as const, priority: "high" as const, matches: ["fac-005", "fac-002"] },
    { id: "plc-007", pat: "pat-007", fac: "fac-002", org: "org-002", worker: "usr-004", care: "assisted_living" as const, status: "approved" as const, priority: "medium" as const, matches: ["fac-002"] },
    { id: "plc-008", pat: "pat-008", fac: "fac-001", org: "org-001", worker: "usr-001", care: "rehabilitation" as const, status: "completed" as const, priority: "medium" as const, matches: ["fac-001", "fac-003"] },
    { id: "plc-009", pat: "pat-009", fac: "fac-003", org: "org-002", worker: "usr-005", care: "skilled_nursing" as const, status: "completed" as const, priority: "high" as const, matches: ["fac-003", "fac-001"] },
    { id: "plc-010", pat: "pat-010", fac: "fac-006", org: "org-002", worker: "usr-004", care: "hospice" as const, status: "pending_approval" as const, priority: "high" as const, matches: ["fac-006", "fac-004"] },
  ];
  for (const p of placements) {
    const data = {
      id: p.id, patientId: p.pat, facilityId: p.fac, selectedFacilityId: p.fac,
      socialWorkerId: p.worker, organizationId: p.org, careLevel: p.care, priority: p.priority,
      status: p.status, matchedFacilities: p.matches,
      assessmentNotes: `${label} Placement scenario for ${p.care.replaceAll("_", " ")}.`,
      preferredLocation: { city: "Portland", state: "OR", maxDistanceMiles: 25 },
      insurancePreAuthorized: true, estimatedCost: 3200,
      startDate: p.status === "completed" ? date(5) : null,
      completedDate: p.status === "completed" ? date(7) : null,
      approvalDate: p.status === "completed" || p.status === "approved" ? date(4) : null,
      notes: `${label} ${p.status === "completed" ? "Placed and completed." : "Demo referral in progress."}`,
    };
    await prisma.placement.upsert({ where: { id: p.id }, create: data, update: data });
  }

  // A referral is denormalized by design in the existing schema (MRN/name/DOB snapshot).
  const referrals = [
    { id: "demo-ref-001", pat: "pat-001", fac: "fac-003", user: "usr-001", status: "accepted" as const },
    { id: "demo-ref-003", pat: "pat-003", fac: "fac-004", user: "usr-001", status: "sent" as const },
    { id: "demo-ref-006", pat: "pat-006", fac: "fac-005", user: "usr-002", status: "accepted" as const },
    { id: "demo-ref-007", pat: "pat-007", fac: "fac-002", user: "usr-004", status: "accepted" as const },
    { id: "demo-ref-008", pat: "pat-008", fac: "fac-001", user: "usr-001", status: "converted" as const, placement: "plc-008" },
    { id: "demo-ref-009", pat: "pat-009", fac: "fac-003", user: "usr-005", status: "converted" as const, placement: "plc-009" },
    { id: "demo-ref-010", pat: "pat-010", fac: "fac-006", user: "usr-004", status: "sent" as const },
  ];
  for (const item of referrals) {
    const patient = await prisma.patient.findUniqueOrThrow({ where: { id: item.pat } });
    const data = {
      id: item.id, patientName: `${patient.firstName} ${patient.lastName}`,
      patientDateOfBirth: patient.dateOfBirth, patientMrn: patient.mrn,
      careLevel: patient.careLevelRequired, requiredServices: ["Synthetic demo referral", patient.careLevelRequired],
      sendingOrgId: patient.organizationId, facilityId: item.fac, createdById: item.user,
      status: item.status, sentAt: date(3), respondedAt: item.status === "sent" ? null : date(4),
      convertedPlacementId: item.placement ?? null,
    };
    await prisma.referral.upsert({ where: { id: item.id }, create: data, update: data });
  }

  // Signed snapshots are clearly labeled TEST FIXTURES, not actual signatures.
  for (const item of [
    { ref: "demo-ref-007", amount: 35000, payer: "org-002", worker: "usr-004", paid: false },
    { ref: "demo-ref-008", amount: 45000, payer: "org-001", worker: "usr-001", paid: true },
    { ref: "demo-ref-009", amount: 50000, payer: "org-002", worker: "usr-005", paid: true },
  ]) {
    const documentText = `TEST FIXTURE — NOT A LEGAL CONTRACT. ${item.ref}. ${label}`;
    const hash = createHash("sha256").update(documentText).digest("hex");
    const contractId = `demo-contract-${item.ref.slice(-3)}`;
    const contract = {
      id: contractId, referralId: item.ref, depositAmountCents: item.amount,
      currency: "usd", facilityTermsSnapshot: { demo: true, notice: label },
      status: "signed" as const, documentText, documentHash: hash,
      hospitalSignedBy: "Demo Hospital Signer", hospitalSignedAt: date(5),
      facilitySignedBy: "Demo Facility Signer", facilitySignedAt: date(6), sentAt: date(4),
    };
    await prisma.contract.upsert({ where: { id: contractId }, create: contract, update: contract });
    for (const party of ["hospital", "facility"] as const) {
      const id = `demo-signature-${item.ref.slice(-3)}-${party}`;
      const signature = {
        id, contractId, party, typedName: `Demo ${party} signer (test only)`,
        signerUserId: party === "hospital" ? item.worker : "usr-fac-001",
        signerOrgId: party === "hospital" ? item.payer : "org-003",
        consentStatement: "TEST FIXTURE ONLY. No legal consent or signature was obtained.",
        signedAt: party === "hospital" ? date(5) : date(6),
        documentHash: hash,
        ipHash: createHash("sha256").update(`synthetic-demo-${item.ref}-${party}`).digest("hex"),
        provider: "demo_fixture",
      };
      await prisma.contractSignature.upsert({ where: { id }, create: signature, update: signature });
    }
    if (item.paid) {
      const payment = {
        id: `demo-payment-${item.ref.slice(-3)}`, referralId: item.ref,
        contractId, amountCents: item.amount, currency: "usd",
        status: "demo_paid" as const, isDemo: true, stripePaymentIntentId: null,
      };
      await prisma.payment.upsert({ where: { id: payment.id }, create: payment, update: payment });
    }
  }
  console.log("  Demo polish: 2 hospital orgs + 1 facility org, 6 facilities, 10 patients, 8 placements (2 completed), 7 referrals, 3 test contracts, 2 demo payments.");
}
