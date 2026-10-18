import { renderContract, documentSha256 } from "@/lib/esign/document";
import "server-only";
import { prisma } from "@/lib/prisma";
import { getServerOrganization } from "@/lib/server-organization";
import { isFacilityRecommendedForOrg } from "@/lib/recommended-facilities";
import { calculateFacilityScore } from "@/lib/data-access";
import type { CareLevel, ReferralStatus } from "@/generated/prisma/client";

export class ReferralError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

const HOSPITAL_ROLES = new Set(["social-worker", "discharge-planner", "administrator", "superadmin"]);
const FACILITY_ROLES = new Set(["facility-coordinator", "administrator", "superadmin"]);

export async function referralContext() {
  const org = await getServerOrganization();
  if (!org) throw new ReferralError(401, "Authentication required");
  // Never rely on user-submitted organization IDs or mutable client metadata for tenancy.
  const dbOrg = await prisma.organization.findUnique({
    where: { id: org.organizationId }, select: { type: true },
  });
  if (!dbOrg) throw new ReferralError(403, "Organization not found");
  if (dbOrg.type !== "hospital" && dbOrg.type !== "facility")
    throw new ReferralError(403, "Only hospital and facility organizations can access referrals");
  if (dbOrg.type === "hospital" && !HOSPITAL_ROLES.has(org.role))
    throw new ReferralError(403, "Hospital staff access required");
  if (dbOrg.type === "facility" && !FACILITY_ROLES.has(org.role))
    throw new ReferralError(403, "Facility staff access required");
  return { organizationId: org.organizationId, userId: org.userId, type: dbOrg.type, isSuperadmin: org.isSuperadmin };
}

export const careLevels = [
  "independent_living", "assisted_living", "skilled_nursing", "long_term_care",
  "rehabilitation", "home_health", "hospice", "memory_care",
] as const;

export function parseReferralBody(value: unknown) {
  if (!value || typeof value !== "object") throw new ReferralError(400, "Invalid referral");
  const b = value as Record<string, unknown>;
  const patientName = typeof b.patientName === "string" ? b.patientName.trim() : "";
  const patientMrn = typeof b.patientMrn === "string" ? b.patientMrn.trim() : "";
  const dateString = typeof b.patientDateOfBirth === "string" ? b.patientDateOfBirth : "";
  const facilityId = typeof b.facilityId === "string" ? b.facilityId : "";
  if (patientName.length < 2 || patientName.length > 160 || patientMrn.length < 1 || patientMrn.length > 80)
    throw new ReferralError(400, "Patient name and MRN are required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString))
    throw new ReferralError(400, "Enter a valid date of birth");
  const dob = new Date(dateString + "T00:00:00.000Z");
  if (Number.isNaN(dob.valueOf()) || dob.toISOString().slice(0, 10) !== dateString || dob > new Date())
    throw new ReferralError(400, "Invalid date of birth");
  if (!careLevels.includes(b.careLevel as CareLevel))
    throw new ReferralError(400, "Invalid care level");
  if (!facilityId) throw new ReferralError(400, "Select a facility");
  if (!Array.isArray(b.requiredServices) || b.requiredServices.length > 20 ||
      b.requiredServices.some(x => typeof x !== "string" || x.length < 1 || x.length > 100))
    throw new ReferralError(400, "Invalid required services");
  const requiredServices = [...new Set((b.requiredServices as string[]).map(x => x.trim()).filter(Boolean))];
  const status: ReferralStatus | null = b.status === "sent" ? "sent" : b.status === "draft" || b.status === undefined ? "draft" : null;
  if (!status) throw new ReferralError(400, "Invalid referral status");
  return { patientName, patientMrn, patientDateOfBirth: dob, facilityId,
    careLevel: b.careLevel as CareLevel, requiredServices, status };
}

export function ensureCareMatch(facility: {
  careLevelsOffered: CareLevel[]; specialties: string[];
  hasAvailability: boolean; currentOccupancy: number; capacity: number;
}, careLevel: CareLevel, services: string[]) {
  const specialties = new Set(facility.specialties.map(s => s.trim().toLowerCase()));
  return facility.careLevelsOffered.includes(careLevel) &&
    facility.hasAvailability && facility.currentOccupancy < facility.capacity &&
    services.every(s => specialties.has(s.toLowerCase()));
}

export interface ReferralCandidatesOptions {
  facilityIds?: string[];
  take?: number;
  cursor?: string;
  patient?: { careLevelRequired?: string; insurance?: unknown };
  preferredLocation?: { city?: string; state?: string };
}

export async function listReferralCandidates(
  careLevel: CareLevel,
  services: string[],
  options?: ReferralCandidatesOptions | number,
  cursorParam?: string,
) {
  const context = await referralContext();
  if (context.type !== "hospital") throw new ReferralError(403, "Hospital access required");
  if (!careLevels.includes(careLevel)) throw new ReferralError(400, "Invalid care level");

  const opts: ReferralCandidatesOptions =
    typeof options === "number"
      ? { take: options, cursor: cursorParam }
      : (options ?? {});
  const take = opts.take !== undefined ? Math.max(1, opts.take) : undefined;
  const cursor = opts.cursor;

  const facilities = await prisma.facility.findMany({
    where: {
      ...(opts.facilityIds !== undefined ? { id: { in: opts.facilityIds } } : {}),
      organization: { type: "facility" },
      hasAvailability: true,
      currentOccupancy: { lt: prisma.facility.fields.capacity },
      careLevelsOffered: { has: careLevel },
      ...(services.length > 0 ? { specialties: { hasEvery: services } } : {}),
    },
    select: {
      id: true,
      name: true,
      capacity: true,
      currentOccupancy: true,
      hasAvailability: true,
      careLevelsOffered: true,
      specialties: true,
      waitlistDays: true,
      rating: true,
      insuranceAccepted: true,
      acceptsMedicare: true,
      acceptsMedicaid: true,
      address: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    ...(take !== undefined ? { take } : {}),
  });

  const patient = {
    careLevelRequired: opts.patient?.careLevelRequired ?? careLevel,
    insurance: opts.patient?.insurance ?? [],
  };
  const preferredLocation = opts.preferredLocation;

  return facilities
    .filter(f => ensureCareMatch(f, careLevel, services))
    .sort((a, b) => {
      const scoreA = calculateFacilityScore(a, patient, preferredLocation);
      const scoreB = calculateFacilityScore(b, patient, preferredLocation);
      if (scoreB !== scoreA) return scoreB - scoreA;
      const bedsA = a.capacity - a.currentOccupancy;
      const bedsB = b.capacity - b.currentOccupancy;
      if (bedsB !== bedsA) return bedsB - bedsA;
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.id.localeCompare(b.id);
    })
    .map(f => ({
      id: f.id,
      name: f.name,
      availableBeds: f.capacity - f.currentOccupancy,
      specialties: f.specialties,
      score: calculateFacilityScore(f, patient, preferredLocation),
    }));
}

export interface ListReferralsOptions {
  take?: number;
  cursor?: string;
  status?: ReferralStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  from?: Date | string;
  to?: Date | string;
  patient?: string;
  patientMrn?: string;
  patientName?: string;
  facility?: string;
  facilityId?: string;
}

export async function listReferrals(options?: ListReferralsOptions) {
  const ctx = await referralContext();
  const take = options?.take !== undefined ? Math.max(1, options.take) : 100;
  const cursor = options?.cursor;

  const where: Record<string, unknown> = ctx.type === "hospital"
    ? {
        sendingOrgId: ctx.organizationId,
        ...(options?.status ? { status: options.status } : {}),
      }
    : {
        facility: { organizationId: ctx.organizationId },
        status: options?.status && options.status !== "draft" ? options.status : { not: "draft" as const },
      };

  const from = options?.startDate ?? options?.from;
  const to = options?.endDate ?? options?.to;
  if (from || to) {
    const createdFilter: { gte?: Date; lte?: Date } = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.valueOf())) createdFilter.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.valueOf())) createdFilter.lte = d;
    }
    if (Object.keys(createdFilter).length > 0) {
      where.createdAt = createdFilter;
    }
  }

  if (options?.patient) {
    where.OR = [
      { patientName: { contains: options.patient, mode: "insensitive" } },
      { patientMrn: { contains: options.patient, mode: "insensitive" } },
    ];
  } else {
    if (options?.patientName) {
      where.patientName = { contains: options.patientName, mode: "insensitive" };
    }
    if (options?.patientMrn) {
      where.patientMrn = options.patientMrn;
    }
  }

  const facilityFilter = options?.facilityId ?? options?.facility;
  if (facilityFilter) {
    where.facilityId = facilityFilter;
  }

  return prisma.referral.findMany({
    where,
    select: {
      id: true,
      patientName: true,
      patientDateOfBirth: true,
      patientMrn: true,
      careLevel: true,
      requiredServices: true,
      status: true,
      createdAt: true,
      sentAt: true,
      respondedAt: true,
      facility: { select: { id: true, name: true } },
      sendingOrganization: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export async function getReferral(id: string) {
  const ctx = await referralContext();
  const referral = await prisma.referral.findFirst({
    where: { id, ...(ctx.type === "hospital" ? { sendingOrgId: ctx.organizationId }
      : { facility: { organizationId: ctx.organizationId }, status: { not: "draft" } }) },
    include: { facility: { select: { id: true, name: true } },
      sendingOrganization: { select: { name: true } } },
  });
  if (!referral) throw new ReferralError(404, "Referral not found");
  return referral;
}

export async function createReferral(body: unknown) {
  const ctx = await referralContext();
  if (ctx.type !== "hospital") throw new ReferralError(403, "Hospital access required");
  const b = parseReferralBody(body);
  // A new draft must not manufacture the relationship that unlocks a profile.
  if (!ctx.isSuperadmin && !await isFacilityRecommendedForOrg(ctx.organizationId, b.facilityId))
    throw new ReferralError(403, "Facility has not been recommended");
  const facility = await prisma.facility.findFirst({
    where: { id: b.facilityId, organization: { type: "facility" } },
    select: { careLevelsOffered: true, specialties: true, hasAvailability: true,
      currentOccupancy: true, capacity: true },
  });
  if (!facility || !ensureCareMatch(facility, b.careLevel, b.requiredServices))
    throw new ReferralError(409, "Facility no longer meets required care and availability");
  return prisma.referral.create({
    data: { ...b, sendingOrgId: ctx.organizationId, createdById: ctx.userId,
      sentAt: b.status === "sent" ? new Date() : null },
    select: { id: true, status: true },
  });
}

export async function transitionReferral(id: string, next: ReferralStatus) {
  const ctx = await referralContext();
  if (ctx.type === "hospital" && next !== "sent")
    throw new ReferralError(403, "Hospital staff can only send draft referrals");
  if (ctx.type === "facility" && next !== "accepted" && next !== "declined")
    throw new ReferralError(403, "Facility staff can only accept or decline");
  const expected = next === "sent" ? "draft" : "sent";
  const existing = await prisma.referral.findFirst({
    where: { id, status: expected,
      ...(ctx.type === "hospital" ? { sendingOrgId: ctx.organizationId }
        : { facility: { organizationId: ctx.organizationId } }) },
    select: { id: true },
  });
  if (!existing) throw new ReferralError(409, "Referral unavailable or already processed");
  // A single transaction commits the acceptance and the draft contract together.
  // Unique Contract.referralId and the status CAS make repeated acceptance idempotent-safe.
  return prisma.$transaction(async tx => {
    const result = await tx.referral.updateMany({
      where: { id, status: expected,
        ...(ctx.type === "hospital" ? { sendingOrgId: ctx.organizationId }
          : { facility: { organizationId: ctx.organizationId } }) },
      data: { status: next, ...(next === "sent" ? { sentAt: new Date() } : { respondedAt: new Date() }) },
    });
    if (!result.count) throw new ReferralError(409, "Referral already processed");
    if (next === "accepted") {
      const referral = await tx.referral.findUniqueOrThrow({
        where: { id },
        include: {
          sendingOrganization: { select: { name: true } },
          facility: { select: { name: true } },
        },
      });
      const snapshot = {
        referralId: referral.id,
        hospitalName: referral.sendingOrganization.name,
        facilityName: referral.facility.name,
        facilityId: referral.facilityId,
        careLevel: referral.careLevel,
        requiredServices: referral.requiredServices,
        depositAmountCents: 0,
        currency: "usd",
        facilityTerms: "Terms and deposit to be agreed before sending.",
      };
      const documentText = renderContract(snapshot);
      await tx.contract.create({
        data: {
          referralId: id,
          depositAmountCents: 0,
          currency: "usd",
          facilityTermsSnapshot: snapshot,
          status: "draft",
          documentText,
          documentHash: documentSha256(documentText),
        },
      });
    }
    return { id, status: next };
  });
}

export function referralFailure(error: unknown) {
  if (error instanceof ReferralError)
    return { error: error.message, status: error.statusCode };
  // Do not log error objects that may contain patient data.
  return { error: "Internal server error", status: 500 };
}
