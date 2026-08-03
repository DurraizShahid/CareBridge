// ─── Org-Scoped Data Access Layer ───
// Provides data filtered by the current user's organization.
// Superadmin users bypass organization scoping.
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  Patient,
  PatientStatus,
  Contact,
  Facility,
  FacilityType,
  Placement,
  PlacementStatus,
  DashboardStats,
  DashboardWidgetData,
  FacilityDashboardStats,
  FacilityCategoryData,
  ScheduleEvent,
  ScheduleEventType,
  Referral,
  ActivityEvent,
  User,
  UserRole,
  Organization,
  OrganizationType,
  InviteCode,
  JoinRequest,
  JoinRequestStatus,
  Hospital,
  FacilityMedia,
  PatientDocument,
  CareLevel,
  FacilityMatchBreakdown,
  FacilityMatchResult,
  PatientMatchResult,
} from "@/types";
import { Prisma } from "@/generated/prisma/client";
import { consumeInviteCodeUse } from "@/lib/invite-codes";
import { prisma } from "@/lib/prisma";

// ── Helpers ──

function isSuperadmin(role: string): boolean {
  return role === "superadmin";
}

// Convert Prisma dates to ISO strings
function toISO(date: Date | null | undefined): string {
  return date ? date.toISOString() : new Date().toISOString();
}

// Convert Prisma snake_case enums to UI kebab-case
function snakeToKebab(str: string | null | undefined): string {
  return str?.replace(/_/g, "-") ?? "";
}

// Convert UI kebab-case enums to Prisma snake_case
function kebabToSnake(str: string): string {
  return str.replace(/-/g, "_");
}

function toCareLevel(value: string): CareLevel {
  return snakeToKebab(value) as CareLevel;
}

function toPatientStatus(value: string): PatientStatus {
  return snakeToKebab(value) as PatientStatus;
}

function toPlacementStatus(value: string): PlacementStatus {
  return snakeToKebab(value) as PlacementStatus;
}

function toFacilityType(value: string): FacilityType {
  return snakeToKebab(value) as FacilityType;
}

function toUserRole(value: string): UserRole {
  return snakeToKebab(value) as UserRole;
}

function toPrismaCareLevels(values: CareLevel[]): string[] {
  return values.map(kebabToSnake);
}

function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function averageDays(
  records: { createdAt?: Date; startDate?: Date | null; completedDate: Date | null }[],
  startKey: "createdAt" | "startDate",
): number {
  const durations = records
    .map((record) => {
      const start = startKey === "createdAt" ? record.createdAt : record.startDate;
      if (!start || !record.completedDate) return null;
      return (record.completedDate.getTime() - start.getTime()) / 86400000;
    })
    .filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);

  if (durations.length === 0) return 0;
  return roundOneDecimal(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

// Generate random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export class DataAccessError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "DataAccessError";
    this.status = status;
  }
}

type PlacementInput = Omit<Placement, "id" | "createdAt" | "updatedAt">;
type PlacementUpdateInput = Partial<PlacementInput>;

const CONFIRMED_PLACEMENT_STATUSES = new Set<PlacementStatus>([
  "approved",
  "in-progress",
  "completed",
]);

// Statuses whose placement holds a bed at the assigned facility.
// Approving a placement reserves the bed; moving it in_progress admits
// the patient; completed/cancelled release the bed.
const BED_OCCUPYING_STATUSES = new Set<string>(["approved", "in_progress"]);

function isBedOccupyingStatus(status: string | null | undefined): boolean {
  return BED_OCCUPYING_STATUSES.has(kebabToSnake(status ?? ""));
}

function uniqueStrings(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function normalizeSearchValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getPatientInsuranceTerms(insurance: unknown): string[] {
  const entries = Array.isArray(insurance) ? insurance : [insurance];
  return entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    return ["provider", "type", "plan", "payer"]
      .map((key) => record[key])
      .filter((value): value is string => typeof value === "string")
      .map(normalizeSearchValue);
  });
}

function facilityAcceptsPatientInsurance(facility: {
  insuranceAccepted: string[];
  acceptsMedicare: boolean;
  acceptsMedicaid: boolean;
}, patientInsurance: unknown): boolean {
  const terms = getPatientInsuranceTerms(patientInsurance);
  if (terms.length === 0) return true;
  if (terms.some((term) => term.includes("medicare"))) return facility.acceptsMedicare;
  if (terms.some((term) => term.includes("medicaid"))) return facility.acceptsMedicaid;

  const accepted = facility.insuranceAccepted.map(normalizeSearchValue);
  return terms.some((term) =>
    accepted.some((acceptedTerm) => term.includes(acceptedTerm) || acceptedTerm.includes(term)),
  );
}

function patientStatusForPlacementStatus(status: PlacementStatus): PatientStatus | null {
  if (status === "completed" || status === "in-progress") return "placed";
  if (status === "approved" || status === "pending-approval") return "ready-for-discharge";
  if (status === "assessment" || status === "searching" || status === "matching") {
    return "assessment-in-progress";
  }
  return null;
}

function isConfirmedPlacementStatus(status: PlacementStatus): boolean {
  return CONFIRMED_PLACEMENT_STATUSES.has(status);
}

function calculateFacilityScore(
  facility: {
    id: string;
    capacity: number;
    currentOccupancy: number;
    hasAvailability: boolean;
    waitlistDays: number | null;
    rating: number;
    careLevelsOffered: string[];
    insuranceAccepted: string[];
    acceptsMedicare: boolean;
    acceptsMedicaid: boolean;
    address: unknown;
  },
  patient: { careLevelRequired: string; insurance: unknown },
  preferredLocation: Placement["preferredLocation"] | undefined,
): number {
  const careLevel = kebabToSnake(toCareLevel(patient.careLevelRequired));
  if (!facility.careLevelsOffered.includes(careLevel)) return -1;
  if (!facility.hasAvailability || facility.currentOccupancy >= facility.capacity) return -1;
  if (!facilityAcceptsPatientInsurance(facility, patient.insurance)) return -1;

  let score = 50;
  score += Math.max(facility.capacity - facility.currentOccupancy, 0);
  score += Math.round(facility.rating * 5);
  score -= facility.waitlistDays ?? 0;

  const address = facility.address as Record<string, unknown> | null;
  const facilityCity = typeof address?.city === "string" ? normalizeSearchValue(address.city) : "";
  const facilityState = typeof address?.state === "string" ? normalizeSearchValue(address.state) : "";
  const preferredCity = preferredLocation?.city ? normalizeSearchValue(preferredLocation.city) : "";
  const preferredState = preferredLocation?.state ? normalizeSearchValue(preferredLocation.state) : "";
  if (preferredCity && facilityCity === preferredCity) score += 10;
  if (preferredState && facilityState === preferredState) score += 5;

  return score;
}

function calculateFacilityScoreWithBreakdown(
  facility: Facility,
  patient: { careLevelRequired: string; insurance: unknown },
  preferredLocation: Placement["preferredLocation"] | undefined,
): FacilityMatchBreakdown {
  const careLevelMatch = facility.careLevelsOffered.includes(patient.careLevelRequired as any);
  const hasAvailability = facility.hasAvailability && facility.currentOccupancy < facility.capacity;
  const insuranceAccepted = facilityAcceptsPatientInsurance(facility, patient.insurance);

  if (!careLevelMatch || !hasAvailability || !insuranceAccepted) {
    return {
      careLevelMatch,
      insuranceAccepted,
      hasAvailability,
      baseScore: 0,
      capacityScore: 0,
      ratingScore: 0,
      waitlistPenalty: 0,
      locationBonus: 0,
      totalScore: -1,
    };
  }

  let baseScore = 50;
  const capacityScore = Math.max(facility.capacity - facility.currentOccupancy, 0);
  const ratingScore = Math.round(facility.rating * 5);
  const waitlistPenalty = facility.waitlistDays ?? 0;

  const address = facility.address;
  const facilityCity = normalizeSearchValue(address.city);
  const facilityState = normalizeSearchValue(address.state);
  const preferredCity = preferredLocation?.city ? normalizeSearchValue(preferredLocation.city) : "";
  const preferredState = preferredLocation?.state ? normalizeSearchValue(preferredLocation.state) : "";
  let locationBonus = 0;
  if (preferredCity && facilityCity === preferredCity) locationBonus += 10;
  if (preferredState && facilityState === preferredState) locationBonus += 5;

  const totalScore = baseScore + capacityScore + ratingScore - waitlistPenalty + locationBonus;

  return {
    careLevelMatch,
    insuranceAccepted,
    hasAvailability,
    baseScore,
    capacityScore,
    ratingScore,
    waitlistPenalty,
    locationBonus,
    totalScore,
  };
}

async function computeMatchedFacilities(
  tx: any,
  organizationId: string,
  patient: { careLevelRequired: string; insurance: unknown },
  preferredLocation: Placement["preferredLocation"] | undefined,
): Promise<string[]> {
  const facilities = await tx.facility.findMany({
    where: { organizationId },
  });

  return facilities
    .map((facility: any) => ({
      id: facility.id,
      score: calculateFacilityScore(facility, patient, preferredLocation),
    }))
    .filter((facility: { score: number }) => facility.score >= 0)
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
    .slice(0, 5)
    .map((facility: { id: string }) => facility.id);
}

const careLevelLabels: Record<string, string> = {
  "independent-living": "Independent Living",
  "assisted-living": "Assisted Living",
  "skilled-nursing": "Skilled Nursing",
  "long-term-care": "Long Term Care",
  rehabilitation: "Rehabilitation",
  "home-health": "Home Health",
  hospice: "Hospice",
  "memory-care": "Memory Care",
};

function buildMatchExplanation(
  facility: Facility,
  patient: Patient,
  breakdown: FacilityMatchBreakdown,
): string {
  const careLabel = careLevelLabels[patient.careLevelRequired] ?? patient.careLevelRequired;
  const parts: string[] = [];

  if (breakdown.careLevelMatch) parts.push(`Offers required care level (${careLabel})`);
  if (breakdown.insuranceAccepted) {
    const raw = Array.isArray(patient.insurance) ? (patient.insurance[0] as any)?.type ?? null : null;
    const insLabel = typeof raw === "string" ? raw.replace(/-/g, " ") : "your insurance";
    parts.push(`Accepts ${insLabel}`);
  }
  if (breakdown.hasAvailability) {
    const available = facility.capacity - facility.currentOccupancy;
    parts.push(`${available} bed${available === 1 ? "" : "s"} available`);
  }

  const factors: string[] = [];
  factors.push(`${breakdown.baseScore} base`);
  if (breakdown.capacityScore > 0) factors.push(`+${breakdown.capacityScore} capacity`);
  if (breakdown.ratingScore > 0) factors.push(`+${breakdown.ratingScore} rating`);
  if (breakdown.waitlistPenalty > 0) factors.push(`-${breakdown.waitlistPenalty} waitlist`);
  if (breakdown.locationBonus > 0) factors.push(`+${breakdown.locationBonus} location`);

  return `${parts.join("; ")}. Score: ${factors.join(" ")} = ${breakdown.totalScore} pts.`;
}

export async function getPatientFacilityMatches(
  patientId: string,
  organizationId: string,
  role: string,
): Promise<FacilityMatchResult[]> {
  const patient = await getPatient(patientId, organizationId, role);
  if (!patient) return [];

  const facilities = await getFacilities(organizationId, role);

  return facilities
    .map((facility) => {
      const breakdown = calculateFacilityScoreWithBreakdown(
        facility,
        {
          careLevelRequired: patient.careLevelRequired,
          insurance: patient.insurance,
        },
        undefined,
      );
      const explanation = buildMatchExplanation(facility, patient, breakdown);
      return { facility, score: breakdown.totalScore, breakdown, explanation };
    })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export async function getFacilityPatientMatches(
  facilityId: string,
  organizationId: string,
  role: string,
): Promise<PatientMatchResult[]> {
  const facility = await getFacility(facilityId, organizationId, role);
  if (!facility) return [];

  const patients = await getPatients(organizationId, role);

  return patients
    .map((patient) => {
      const breakdown = calculateFacilityScoreWithBreakdown(
        facility,
        {
          careLevelRequired: patient.careLevelRequired,
          insurance: patient.insurance,
        },
        undefined,
      );
      const explanation = buildMatchExplanation(facility, patient, breakdown);
      return { patient, score: breakdown.totalScore, breakdown, explanation };
    })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function recalculateFacilityOccupancy(
  tx: any,
  facilityIds: (string | null | undefined)[],
): Promise<void> {
  await Promise.all(uniqueStrings(facilityIds).map(async (facilityId) => {
    const [facility, activeCount] = await Promise.all([
      tx.facility.findUnique({ where: { id: facilityId }, select: { capacity: true } }),
      tx.placement.count({
        where: {
          facilityId,
          status: { in: Array.from(BED_OCCUPYING_STATUSES) },
        },
      }),
    ]);
    if (!facility) return;
    await tx.facility.update({
      where: { id: facilityId },
      data: {
        currentOccupancy: activeCount,
        hasAvailability: activeCount < facility.capacity,
      },
    });
  }));
}

/**
 * Take a row-level lock (SELECT ... FOR UPDATE) on the facility so that
 * concurrent confirmations/admissions serialize on the same row. All
 * capacity reads and the occupancy write must happen inside the same
 * transaction while this lock is held.
 */
async function lockFacilityRow(tx: any, facilityId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "Facility" WHERE "id" = ${facilityId} FOR UPDATE`;
}

async function countBedOccupyingPlacements(
  tx: any,
  facilityId: string,
  excludePlacementId?: string | null,
): Promise<number> {
  return tx.placement.count({
    where: {
      facilityId,
      status: { in: Array.from(BED_OCCUPYING_STATUSES) },
      ...(excludePlacementId ? { id: { not: excludePlacementId } } : {}),
    },
  });
}

/**
 * Atomically verify that the target facility has capacity for the placement
 * in its post-transition state. Must be called inside the placement
 * transaction. The facility row is locked first so that two concurrent
 * confirmations cannot both observe the same free bed.
 *
 * - `newStatus` is the prisma (snake_case) status after the transition.
 * - `existing` is the current placement row (update path only).
 * - Confirming a placement that already holds a bed at this facility is
 *   idempotent: it is not double-counted and is not gated on availability.
 */
async function assertFacilityCapacityAvailable(
  tx: any,
  facilityId: string | null | undefined,
  placementId: string | null | undefined,
  newStatus: string,
  existing?: { facilityId: string | null; status: string } | null,
): Promise<void> {
  if (!facilityId) return;

  await lockFacilityRow(tx, facilityId);
  const facility = await tx.facility.findUnique({
    where: { id: facilityId },
    select: { capacity: true, hasAvailability: true },
  });
  if (!facility) {
    throw new DataAccessError(400, "Assigned facility must belong to this organization");
  }

  const newlyOccupies = isBedOccupyingStatus(newStatus);
  const currentlyOccupies =
    !!existing &&
    existing.facilityId === facilityId &&
    isBedOccupyingStatus(existing.status);

  if (newlyOccupies && !currentlyOccupies && !facility.hasAvailability) {
    throw new DataAccessError(409, "Selected facility has no current availability");
  }

  const otherOccupying = await countBedOccupyingPlacements(tx, facilityId, placementId);
  const projectedOccupancy = otherOccupying + (newlyOccupies ? 1 : 0);
  if (projectedOccupancy > facility.capacity) {
    throw new DataAccessError(409, "Selected facility has no current availability");
  }
}

async function validatePlacementReferences(
  tx: any,
  data: PlacementInput | PlacementUpdateInput,
  organizationId: string,
  role: string,
  existing?: {
    patientId: string;
    facilityId: string | null;
    socialWorkerId: string;
    status: string;
    careLevel: string;
    preferredLocation: unknown;
    selectedFacilityId: string | null;
    matchedFacilities: string[];
    organizationId: string;
  },
  placementId?: string,
) {
  const effectiveOrganizationId = existing?.organizationId ?? organizationId;
  const patientId = data.patientId ?? existing?.patientId;
  const socialWorkerId = data.socialWorkerId ?? existing?.socialWorkerId;
  const status = data.status ?? (existing ? toPlacementStatus(existing.status) : undefined);
  const careLevel = data.careLevel ?? (existing ? toCareLevel(existing.careLevel) : undefined);
  const preferredLocation = data.preferredLocation !== undefined
    ? data.preferredLocation
    : existing?.preferredLocation as Placement["preferredLocation"] | undefined;
  const selectedFacilityId = data.selectedFacilityId !== undefined
    ? data.selectedFacilityId
    : existing?.selectedFacilityId ?? undefined;
  const requestedFacilityId = data.facilityId !== undefined
    ? data.facilityId
    : existing?.facilityId ?? undefined;

  if (!patientId) throw new DataAccessError(400, "Patient is required");
  if (!socialWorkerId) throw new DataAccessError(400, "Social worker is required");
  if (!status) throw new DataAccessError(400, "Placement status is required");
  if (!careLevel) throw new DataAccessError(400, "Care level is required");

  const [patient, socialWorker] = await Promise.all([
    tx.patient.findFirst({
      where: isSuperadmin(role) ? { id: patientId } : { id: patientId, organizationId },
    }),
    tx.user.findFirst({
      where: isSuperadmin(role) ? { id: socialWorkerId } : { id: socialWorkerId, organizationId },
    }),
  ]);

  if (!patient || patient.organizationId !== effectiveOrganizationId) {
    throw new DataAccessError(400, "Patient must belong to this organization");
  }
  if (!socialWorker || socialWorker.organizationId !== effectiveOrganizationId) {
    throw new DataAccessError(400, "Social worker must belong to this organization");
  }

  const selectedFacility = selectedFacilityId
    ? await tx.facility.findFirst({
        where: isSuperadmin(role)
          ? { id: selectedFacilityId }
          : { id: selectedFacilityId, organizationId },
      })
    : null;
  if (selectedFacilityId && (!selectedFacility || selectedFacility.organizationId !== effectiveOrganizationId)) {
    throw new DataAccessError(400, "Selected facility must belong to this organization");
  }

  if (selectedFacility) {
    const careLevelValue = kebabToSnake(careLevel);
    if (!selectedFacility.careLevelsOffered.includes(careLevelValue)) {
      throw new DataAccessError(409, "Selected facility does not support this care level");
    }
    if (!facilityAcceptsPatientInsurance(selectedFacility, patient.insurance)) {
      throw new DataAccessError(409, "Selected facility does not accept the patient's insurance");
    }
  }

  const bedFacilityId = isConfirmedPlacementStatus(status)
    ? selectedFacilityId ?? requestedFacilityId
    : null;
  if (bedFacilityId) {
    await assertFacilityCapacityAvailable(
      tx,
      bedFacilityId,
      placementId,
      kebabToSnake(status),
      existing,
    );
  }

  const confirmedFacilityId = isConfirmedPlacementStatus(status)
    ? selectedFacilityId || requestedFacilityId
    : requestedFacilityId;
  if (isConfirmedPlacementStatus(status) && !confirmedFacilityId) {
    throw new DataAccessError(400, "A selected facility is required before confirming a placement");
  }

  const confirmedFacility = confirmedFacilityId
    ? await tx.facility.findFirst({
        where: isSuperadmin(role)
          ? { id: confirmedFacilityId }
          : { id: confirmedFacilityId, organizationId },
      })
    : null;
  if (confirmedFacilityId && (!confirmedFacility || confirmedFacility.organizationId !== effectiveOrganizationId)) {
    throw new DataAccessError(400, "Assigned facility must belong to this organization");
  }

  const matchedFacilities = data.matchedFacilities !== undefined
    ? data.matchedFacilities
    : await computeMatchedFacilities(tx, effectiveOrganizationId, patient, preferredLocation);

  return {
    patient,
    status,
    careLevel,
    preferredLocation,
    selectedFacilityId: selectedFacilityId || null,
    facilityId: isConfirmedPlacementStatus(status)
      ? (selectedFacilityId || requestedFacilityId || null)
      : (requestedFacilityId || null),
    matchedFacilities: uniqueStrings(matchedFacilities),
    effectiveOrganizationId,
  };
}

// ── Scoped Data Functions ──

/**
 * Return patients scoped to the given organization.
 * Superadmin sees all patients.
 */
export async function getPatients(
  organizationId: string,
  role: string,
): Promise<Patient[]> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const prismaPatients = await prisma.patient.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return prismaPatients.map((p) => ({
    id: p.id,
    mrn: p.mrn,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: toISO(p.dateOfBirth),
    age: p.age,
    gender: p.gender as any,
    address: p.address as any,
    phone: p.phone,
    emergencyContact: p.emergencyContact as any,
    insurance: p.insurance as any,
    primaryDiagnosis: p.primaryDiagnosis,
    secondaryDiagnoses: p.secondaryDiagnoses,
    careLevelRequired: toCareLevel(p.careLevelRequired),
    notes: p.notes,
    socialWorkerId: p.socialWorkerId,
    hospitalId: p.hospitalId,
    organizationId: p.organizationId,
    admissionDate: toISO(p.admissionDate),
    estimatedDischargeDate: p.estimatedDischargeDate ? toISO(p.estimatedDischargeDate) : undefined,
    status: toPatientStatus(p.status),
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
  }));
}

/**
 * Return facilities scoped to the given organization.
 * Superadmin sees all facilities.
 */
export async function getFacilities(
  organizationId: string,
  role: string,
): Promise<Facility[]> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const prismaFacilities = await prisma.facility.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { media: { orderBy: { displayOrder: "asc" } } },
  });
  return prismaFacilities.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description ?? undefined,
      type: toFacilityType(f.type),
      address: f.address as any,
      phone: f.phone,
      email: f.email,
      website: f.website ?? undefined,
      contacts: Array.isArray(f.contacts) ? (f.contacts as unknown as Contact[]) : [],
      licensure: f.licensure,
      accreditations: f.accreditations,
      capacity: f.capacity,
      currentOccupancy: f.currentOccupancy,
      insuranceAccepted: f.insuranceAccepted,
      careLevelsOffered: f.careLevelsOffered.map(toCareLevel),
      specialties: f.specialties,
      rating: f.rating,
      reviewsCount: f.reviewsCount,
      hasAvailability: f.hasAvailability,
      waitlistDays: f.waitlistDays ?? undefined,
      acceptsMedicare: f.acceptsMedicare,
      acceptsMedicaid: f.acceptsMedicaid,
      organizationId: f.organizationId,
      media: f.media?.map((m) => ({
        id: m.id,
        facilityId: m.facilityId,
        type: m.type as any,
        key: m.key,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl ?? undefined,
        fileSize: m.fileSize ?? undefined,
        mimeType: m.mimeType ?? undefined,
        width: m.width ?? undefined,
        height: m.height ?? undefined,
        displayOrder: m.displayOrder,
        createdAt: toISO(m.createdAt),
        updatedAt: toISO(m.updatedAt),
      })),
      createdAt: toISO(f.createdAt),
      updatedAt: toISO(f.updatedAt),
    }));
}

/**
 * Return placements scoped to the given organization.
 * Superadmin sees all placements.
 */
export async function getPlacements(
  organizationId: string,
  role: string,
): Promise<Placement[]> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const prismaPlacements = await prisma.placement.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return prismaPlacements.map((p) => ({
    id: p.id,
    patientId: p.patientId,
    facilityId: p.facilityId ?? undefined,
    socialWorkerId: p.socialWorkerId,
    status: toPlacementStatus(p.status),
    careLevel: toCareLevel(p.careLevel),
    priority: p.priority as any,
    assessmentNotes: p.assessmentNotes ?? undefined,
    preferredLocation: p.preferredLocation as any ?? undefined,
    matchedFacilities: p.matchedFacilities,
    selectedFacilityId: p.selectedFacilityId ?? undefined,
    insurancePreAuthorized: p.insurancePreAuthorized,
    estimatedCost: p.estimatedCost ?? undefined,
    approvedBy: p.approvedBy ?? undefined,
    approvalDate: p.approvalDate ? toISO(p.approvalDate) : undefined,
    startDate: p.startDate ? toISO(p.startDate) : undefined,
    completedDate: p.completedDate ? toISO(p.completedDate) : undefined,
    cancellationReason: p.cancellationReason ?? undefined,
    notes: p.notes,
    organizationId: p.organizationId,
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
  }));
}

/**
 * Return recent activity scoped to the given organization.
 * Superadmin sees all activity.
 */
export async function getRecentActivity(
  organizationId: string,
  role: string,
): Promise<ActivityEvent[]> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const prismaActivity = await prisma.activityEvent.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: 10,
  });
  return prismaActivity.map((a) => ({
    id: a.id,
    type: a.type as any,
    title: a.title,
    description: a.description,
    patientName: a.patientName,
    patientId: a.patientId,
    timestamp: toISO(a.timestamp),
    userId: a.userId,
    organizationId: a.organizationId,
  }));
}

/**
 * Return users scoped to the given organization.
 * Superadmin sees all users.
 */
export async function getUsers(
  organizationId: string,
  role: string,
): Promise<User[]> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const prismaUsers = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return prismaUsers.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: toUserRole(u.role),
    title: u.title,
    department: u.department,
    hospitalId: u.hospitalId,
    organizationId: u.organizationId ?? "",
    avatarUrl: u.avatarUrl ?? undefined,
    phone: u.phone,
    createdAt: toISO(u.createdAt),
    updatedAt: toISO(u.updatedAt),
  }));
}

/**
 * Return a single placement by ID, scoped to the given organization.
 * Superadmin sees any placement.
 */
export async function getPlacement(
  id: string,
  organizationId: string,
  role: string,
): Promise<Placement | null> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const p = await prisma.placement.findFirst({ where });
  if (!p) return null;
  return {
    id: p.id,
    patientId: p.patientId,
    facilityId: p.facilityId ?? undefined,
    socialWorkerId: p.socialWorkerId,
    status: toPlacementStatus(p.status),
    careLevel: toCareLevel(p.careLevel),
    priority: p.priority as any,
    assessmentNotes: p.assessmentNotes ?? undefined,
    preferredLocation: p.preferredLocation as any ?? undefined,
    matchedFacilities: p.matchedFacilities,
    selectedFacilityId: p.selectedFacilityId ?? undefined,
    insurancePreAuthorized: p.insurancePreAuthorized,
    estimatedCost: p.estimatedCost ?? undefined,
    approvedBy: p.approvedBy ?? undefined,
    approvalDate: p.approvalDate ? toISO(p.approvalDate) : undefined,
    startDate: p.startDate ? toISO(p.startDate) : undefined,
    completedDate: p.completedDate ? toISO(p.completedDate) : undefined,
    cancellationReason: p.cancellationReason ?? undefined,
    notes: p.notes,
    organizationId: p.organizationId,
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
  };
}

/**
 * Create a new placement.
 * Permission check is handled by the calling API route.
 */
export async function createPlacement(
  data: PlacementInput,
): Promise<Placement> {
  const p = await prisma.$transaction(async (tx) => {
    const flow = await validatePlacementReferences(tx, data, data.organizationId, "customer");
    const created = await tx.placement.create({
      data: {
        id: crypto.randomUUID(),
        patientId: data.patientId,
        facilityId: flow.facilityId,
        socialWorkerId: data.socialWorkerId,
        status: kebabToSnake(flow.status) as any,
        careLevel: kebabToSnake(flow.careLevel) as any,
        priority: kebabToSnake(data.priority) as any,
        assessmentNotes: data.assessmentNotes ?? null,
        preferredLocation: flow.preferredLocation as any ?? null,
        matchedFacilities: flow.matchedFacilities,
        selectedFacilityId: flow.selectedFacilityId,
        insurancePreAuthorized: data.insurancePreAuthorized,
        estimatedCost: data.estimatedCost ?? null,
        approvedBy: data.approvedBy ?? null,
        approvalDate: data.approvalDate ? new Date(data.approvalDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        completedDate: data.completedDate ? new Date(data.completedDate) : null,
        cancellationReason: data.cancellationReason ?? null,
        notes: data.notes,
        organizationId: flow.effectiveOrganizationId,
      },
    });

    const patientStatus = patientStatusForPlacementStatus(flow.status);
    if (patientStatus) {
      await tx.patient.update({
        where: { id: data.patientId },
        data: { status: kebabToSnake(patientStatus) as any },
      });
    }
    await recalculateFacilityOccupancy(tx, [flow.facilityId]);
    return created;
  });
  return {
    id: p.id,
    patientId: p.patientId,
    facilityId: p.facilityId ?? undefined,
    socialWorkerId: p.socialWorkerId,
    status: toPlacementStatus(p.status),
    careLevel: toCareLevel(p.careLevel),
    priority: p.priority as any,
    assessmentNotes: p.assessmentNotes ?? undefined,
    preferredLocation: p.preferredLocation as any ?? undefined,
    matchedFacilities: p.matchedFacilities,
    selectedFacilityId: p.selectedFacilityId ?? undefined,
    insurancePreAuthorized: p.insurancePreAuthorized,
    estimatedCost: p.estimatedCost ?? undefined,
    approvedBy: p.approvedBy ?? undefined,
    approvalDate: p.approvalDate ? toISO(p.approvalDate) : undefined,
    startDate: p.startDate ? toISO(p.startDate) : undefined,
    completedDate: p.completedDate ? toISO(p.completedDate) : undefined,
    cancellationReason: p.cancellationReason ?? undefined,
    notes: p.notes,
    organizationId: p.organizationId,
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
  };
}

/**
 * Update an existing placement, scoped to organization.
 * Superadmin can update any placement.
 */
export async function updatePlacement(
  id: string,
  data: PlacementUpdateInput,
  organizationId: string,
  role: string,
): Promise<Placement | null> {
  const p = await prisma.$transaction(async (tx) => {
    const where = isSuperadmin(role) ? { id } : { id, organizationId };
    const existing = await tx.placement.findFirst({ where });
    if (!existing) return null;

    const flow = await validatePlacementReferences(tx, data, organizationId, role, existing, id);
    const updateData: Record<string, any> = {
      facilityId: flow.facilityId,
      matchedFacilities: flow.matchedFacilities,
      selectedFacilityId: flow.selectedFacilityId,
    };
    if (data.patientId !== undefined) updateData.patientId = data.patientId;
    if (data.socialWorkerId !== undefined) updateData.socialWorkerId = data.socialWorkerId;
    if (data.status !== undefined) updateData.status = kebabToSnake(flow.status) as any;
    if (data.careLevel !== undefined) updateData.careLevel = kebabToSnake(flow.careLevel) as any;
    if (data.priority !== undefined) updateData.priority = kebabToSnake(data.priority) as any;
    if (data.assessmentNotes !== undefined) updateData.assessmentNotes = data.assessmentNotes ?? null;
    if (data.preferredLocation !== undefined) updateData.preferredLocation = flow.preferredLocation as any ?? null;
    if (data.insurancePreAuthorized !== undefined) updateData.insurancePreAuthorized = data.insurancePreAuthorized;
    if (data.estimatedCost !== undefined) updateData.estimatedCost = data.estimatedCost ?? null;
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy ?? null;
    if (data.approvalDate !== undefined) updateData.approvalDate = data.approvalDate ? new Date(data.approvalDate) : null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.completedDate !== undefined) updateData.completedDate = data.completedDate ? new Date(data.completedDate) : null;
    if (data.cancellationReason !== undefined) updateData.cancellationReason = data.cancellationReason ?? null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await tx.placement.update({
      where: { id },
      data: updateData,
    });

    const patientStatus = patientStatusForPlacementStatus(flow.status);
    if (patientStatus) {
      await tx.patient.update({
        where: { id: updated.patientId },
        data: { status: kebabToSnake(patientStatus) as any },
      });
    }
    await recalculateFacilityOccupancy(tx, [existing.facilityId, flow.facilityId]);
    return updated;
  });

  if (!p) return null;

  return {
    id: p.id,
    patientId: p.patientId,
    facilityId: p.facilityId ?? undefined,
    socialWorkerId: p.socialWorkerId,
    status: toPlacementStatus(p.status),
    careLevel: toCareLevel(p.careLevel),
    priority: p.priority as any,
    assessmentNotes: p.assessmentNotes ?? undefined,
    preferredLocation: p.preferredLocation as any ?? undefined,
    matchedFacilities: p.matchedFacilities,
    selectedFacilityId: p.selectedFacilityId ?? undefined,
    insurancePreAuthorized: p.insurancePreAuthorized,
    estimatedCost: p.estimatedCost ?? undefined,
    approvedBy: p.approvedBy ?? undefined,
    approvalDate: p.approvalDate ? toISO(p.approvalDate) : undefined,
    startDate: p.startDate ? toISO(p.startDate) : undefined,
    completedDate: p.completedDate ? toISO(p.completedDate) : undefined,
    cancellationReason: p.cancellationReason ?? undefined,
    notes: p.notes,
    organizationId: p.organizationId,
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
  };
}

/**
 * Delete a placement, scoped to organization.
 */
export async function deletePlacement(
  id: string,
  organizationId: string,
  role: string,
): Promise<{ success: boolean; error?: string }> {
  return prisma.$transaction(async (tx) => {
    const where = isSuperadmin(role) ? { id } : { id, organizationId };
    const existing = await tx.placement.findFirst({ where });
    if (!existing) return { success: false, error: "Placement not found" };

    await tx.placement.delete({ where: { id } });
    await recalculateFacilityOccupancy(tx, [existing.facilityId]);
    return { success: true };
  });
}

/**
 * Return dashboard stats scoped to the given organization.
 * Computes fresh stats from scoped data so counts stay accurate.
 */
export async function getDashboardStats(
  organizationId: string,
  role: string,
): Promise<DashboardStats> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const monthStart = startOfMonth();

  const [
    activePatientCount,
    activePlacementCount,
    pendingAssessmentCount,
    availableFacilityCount,
    placementsThisMonth,
    completedPlacements,
  ] = await Promise.all([
    prisma.patient.count({
      where: {
        ...where,
        NOT: { status: "discharged" },
      },
    }),
    prisma.placement.count({
      where: {
        ...where,
        NOT: {
          status: { in: ["completed", "cancelled"] },
        },
      },
    }),
    prisma.patient.count({ 
      where: { 
        ...where,
        status: "assessment_in_progress" 
      } 
    }),
    prisma.facility.count({ 
      where: { 
        ...where,
        hasAvailability: true 
      } 
    }),
    prisma.placement.count({
      where: {
        ...where,
        createdAt: { gte: monthStart },
      },
    }),
    prisma.placement.findMany({
      where: {
        ...where,
        status: "completed",
        completedDate: { not: null },
      },
      select: { createdAt: true, completedDate: true },
    }),
  ]);

  return {
    activePatients: activePatientCount,
    activePlacements: activePlacementCount,
    pendingAssessments: pendingAssessmentCount,
    facilitiesAvailable: availableFacilityCount,
    placementsThisMonth,
    averagePlacementTimeDays: averageDays(completedPlacements, "createdAt"),
  };
}

function formatCareLevelLabel(careLevel: string): string {
  return careLevel
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function assignScheduleHour(seed: string, fallbackHour: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 7 + (hash % 10 || fallbackHour % 10);
}

function buildScheduleEvent(params: {
  id: string;
  date: Date;
  subject: string;
  details: string;
  location: string;
  participants: string;
  type: ScheduleEventType;
  duration?: string;
}): ScheduleEvent {
  const hour = params.date.getHours() === 0
    ? assignScheduleHour(params.id, 9)
    : params.date.getHours();
  const eventDate = new Date(params.date);
  if (params.date.getHours() === 0 && params.date.getMinutes() === 0) {
    eventDate.setHours(hour, (params.id.charCodeAt(0) % 4) * 15, 0, 0);
  }

  return {
    id: params.id,
    dateISO: eventDate.toISOString(),
    time: formatClockTime(eventDate),
    subject: params.subject,
    details: params.details,
    location: params.location,
    participants: params.participants,
    duration: params.duration ?? "30m",
    type: params.type,
  };
}

/**
 * Aggregate dashboard widget data (schedule, charts, facility capacity, KPIs).
 */
export async function getDashboardWidgetData(
  organizationId: string,
  role: string,
): Promise<DashboardWidgetData> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const now = new Date();
  const monthStart = startOfMonth(now);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const urgentWeekStart = new Date(todayStart);
  urgentWeekStart.setDate(urgentWeekStart.getDate() - urgentWeekStart.getDay());
  const calendarStart = new Date(weekStart);
  const calendarEnd = new Date(weekStart);
  calendarEnd.setDate(calendarEnd.getDate() + 28);
  const monthStarts = Array.from({ length: 12 }, (_, index) =>
    new Date(now.getFullYear(), index, 1),
  );

  const [
    totalPlacements,
    completedPlacements,
    activePlacements,
    placementsThisMonth,
    placementsCreatedToday,
    referralCount,
    matchCount,
    activePriority,
    urgentThisWeek,
    facilities,
    hospitals,
    careLevelGroups,
    priorityCareLevels,
    weekPlacements,
    createdByMonth,
    completedByMonth,
    completedDurations,
    schedulePlacements,
  ] = await Promise.all([
    prisma.placement.count({ where }),
    prisma.placement.count({ where: { ...where, status: "completed" } }),
    prisma.placement.count({
      where: {
        ...where,
        NOT: { status: { in: ["completed", "cancelled"] } },
      },
    }),
    prisma.placement.count({
      where: { ...where, createdAt: { gte: monthStart } },
    }),
    prisma.placement.count({
      where: {
        ...where,
        createdAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.placement.count({
      where: {
        ...where,
        status: { in: ["matching", "pending_approval", "searching", "assessment"] },
      },
    }),
    prisma.placement.count({
      where: {
        ...where,
        status: { in: ["approved", "in_progress", "completed"] },
        OR: [
          { facilityId: { not: null } },
          { selectedFacilityId: { not: null } },
        ],
      },
    }),
    prisma.placement.count({
      where: {
        ...where,
        priority: { in: ["high", "emergency"] },
        NOT: { status: { in: ["completed", "cancelled"] } },
      },
    }),
    prisma.placement.count({
      where: {
        ...where,
        priority: { in: ["high", "emergency"] },
        createdAt: { gte: urgentWeekStart },
      },
    }),
    prisma.facility.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
        currentOccupancy: true,
      },
      orderBy: { name: "asc" },
      take: 50,
    }),
    prisma.hospital.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 20,
    }),
    prisma.placement.groupBy({
      by: ["careLevel"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.placement.groupBy({
      by: ["careLevel"],
      where: {
        ...where,
        priority: { in: ["high", "emergency"] },
        NOT: { status: { in: ["completed", "cancelled"] } },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 3,
    }),
    prisma.placement.findMany({
      where: {
        ...where,
        createdAt: { gte: weekStart, lt: weekEnd },
      },
      select: { createdAt: true },
    }),
    Promise.all(
      monthStarts.map((start) =>
        prisma.placement.count({
          where: {
            ...where,
            createdAt: {
              gte: start,
              lt: addMonths(start, 1),
            },
          },
        }),
      ),
    ),
    Promise.all(
      monthStarts.map((start) =>
        prisma.placement.count({
          where: {
            ...where,
            status: "completed",
            completedDate: {
              gte: start,
              lt: addMonths(start, 1),
            },
          },
        }),
      ),
    ),
    prisma.placement.findMany({
      where: {
        ...where,
        status: "completed",
        completedDate: { not: null },
      },
      select: { createdAt: true, completedDate: true },
    }),
    prisma.placement.findMany({
      where: {
        ...where,
        OR: [
          { startDate: { gte: calendarStart, lt: calendarEnd } },
          { completedDate: { gte: calendarStart, lt: calendarEnd } },
          {
            createdAt: { gte: calendarStart, lt: calendarEnd },
            status: {
              in: ["assessment", "searching", "matching", "pending_approval", "approved"],
            },
          },
          {
            patient: {
              estimatedDischargeDate: { gte: calendarStart, lt: calendarEnd },
            },
          },
        ],
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            estimatedDischargeDate: true,
            primaryDiagnosis: true,
          },
        },
        facility: { select: { name: true } },
        socialWorker: { select: { firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
    } as any) as unknown as any[],
  ]);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const placementsThisWeek = dayLabels.map((day, index) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = weekPlacements.filter(
      (placement) =>
        placement.createdAt >= dayStart && placement.createdAt < dayEnd,
    ).length;
    return {
      day,
      count,
      isToday: dayStart.toDateString() === todayStart.toDateString(),
    };
  });

  const facilityTypeGroups: Record<
    string,
    { id: string; label: string; types: string[] }
  > = {
    snf: {
      id: "snf",
      label: "Skilled Nursing",
      types: ["skilled_nursing_facility", "long_term_care"],
    },
    rehab: {
      id: "rehab",
      label: "Rehab & Therapy",
      types: ["rehabilitation_center"],
    },
    assisted: {
      id: "assisted",
      label: "Assisted Living",
      types: ["assisted_living"],
    },
    other: {
      id: "other",
      label: "Home Health & Hospice",
      types: ["home_health_agency", "hospice"],
    },
  };

  const facilitiesByCategory: FacilityCategoryData[] = [
    {
      id: "hospitals",
      label: "Hospitals",
      items: hospitals.map((hospital) => ({
        id: hospital.id,
        name: hospital.name,
        total: 0,
        available: 0,
      })),
    },
    ...Object.values(facilityTypeGroups).map((group) => ({
      id: group.id,
      label: group.label,
      items: facilities
        .filter((facility) => group.types.includes(facility.type))
        .map((facility) => ({
          id: facility.id,
          name: facility.name,
          total: facility.capacity,
          available: Math.max(facility.capacity - facility.currentOccupancy, 0),
        })),
    })),
  ].filter((category) => category.items.length > 0);

  const careLevelBreakdown = careLevelGroups.slice(0, 4).map((group) => ({
    label: formatCareLevelLabel(toCareLevel(group.careLevel)),
    value: group._count.id,
  }));

  const scheduleEvents: ScheduleEvent[] = [];
  for (const placement of schedulePlacements) {
    const patientName = `${placement.patient.firstName} ${placement.patient.lastName}`;
    const facilityName = placement.facility?.name ?? "Unassigned facility";
    const workerName = placement.socialWorker
      ? `${placement.socialWorker.firstName} ${placement.socialWorker.lastName}`
      : "Care team";
    const careLabel = formatCareLevelLabel(toCareLevel(placement.careLevel));
    const priorityType: ScheduleEventType =
      placement.priority === "emergency" || placement.priority === "high"
        ? "urgent"
        : "meeting";

    if (
      placement.startDate &&
      placement.startDate >= calendarStart &&
      placement.startDate < calendarEnd
    ) {
      scheduleEvents.push(
        buildScheduleEvent({
          id: `${placement.id}-start`,
          date: placement.startDate,
          subject: `Placement start: ${patientName}`,
          details: `${careLabel} placement begins at ${facilityName}.`,
          location: facilityName,
          participants: workerName,
          type: priorityType,
          duration: "45m",
        }),
      );
    }

    if (
      placement.completedDate &&
      placement.completedDate >= calendarStart &&
      placement.completedDate < calendarEnd
    ) {
      scheduleEvents.push(
        buildScheduleEvent({
          id: `${placement.id}-complete`,
          date: placement.completedDate,
          subject: `Placement completed: ${patientName}`,
          details: `Completed ${careLabel} placement at ${facilityName}.`,
          location: facilityName,
          participants: workerName,
          type: "check-in",
          duration: "30m",
        }),
      );
    }

    const dischargeDate = placement.patient.estimatedDischargeDate;
    if (
      dischargeDate &&
      dischargeDate >= calendarStart &&
      dischargeDate < calendarEnd
    ) {
      scheduleEvents.push(
        buildScheduleEvent({
          id: `${placement.id}-discharge`,
          date: dischargeDate,
          subject: `Est. discharge: ${patientName}`,
          details: `Estimated discharge for ${placement.patient.primaryDiagnosis}. Care level: ${careLabel}.`,
          location: facilityName,
          participants: workerName,
          type: "review",
          duration: "30m",
        }),
      );
    }

    if (
      placement.createdAt >= calendarStart &&
      placement.createdAt < calendarEnd &&
      ["assessment", "searching", "matching", "pending_approval", "approved"].includes(
        placement.status,
      )
    ) {
      scheduleEvents.push(
        buildScheduleEvent({
          id: `${placement.id}-intake`,
          date: placement.createdAt,
          subject:
            placement.status === "pending_approval"
              ? `Approval needed: ${patientName}`
              : `Referral intake: ${patientName}`,
          details: `${careLabel} · ${placement.patient.primaryDiagnosis}`,
          location: facilityName,
          participants: workerName,
          type:
            placement.status === "pending_approval" || placement.priority === "emergency"
              ? "urgent"
              : "meeting",
          duration: "45m",
        }),
      );
    }
  }

  scheduleEvents.sort(
    (a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime(),
  );

  const successRate =
    totalPlacements > 0
      ? Math.round((completedPlacements / totalPlacements) * 100)
      : 0;

  return {
    header: {
      totalPlacements,
      completedPlacements,
      activePlacements,
      placementsThisMonth,
      placementsCreatedToday,
    },
    scheduleEvents: scheduleEvents.slice(0, 60),
    activity: {
      referrals: referralCount,
      matches: matchCount,
    },
    priorityPlacements: {
      activePriority,
      urgentThisWeek,
      topCareLevels: priorityCareLevels.map((group) =>
        formatCareLevelLabel(toCareLevel(group.careLevel)),
      ),
    },
    facilitiesByCategory,
    careLevelBreakdown,
    placementsThisWeek,
    placementsByMonth: monthStarts.map((start, index) => ({
      month: start.toLocaleString("en-US", { month: "short" }),
      created: createdByMonth[index] ?? 0,
      completed: completedByMonth[index] ?? 0,
    })),
    performance: {
      averagePlacementTimeDays: averageDays(completedDurations, "createdAt"),
      successRate,
      partnerFacilities: facilities.length,
    },
  };
}

/**
 * Return facility dashboard stats scoped to organization.
 */
export async function getFacilityDashboardStats(
  organizationId: string,
  role: string,
  facilityId?: string,
): Promise<FacilityDashboardStats> {
  const where = isSuperadmin(role)
    ? facilityId ? { id: facilityId } : {}
    : facilityId ? { id: facilityId, organizationId } : { organizationId };
  
  const facility = await prisma.facility.findFirst({ where });
  const occupancyRate = facility && facility.capacity > 0
    ? Math.round((facility.currentOccupancy / facility.capacity) * 100)
    : 0;

  if (!facility) {
    return {
      currentOccupancy: 0,
      totalCapacity: 0,
      availableBeds: 0,
      pendingReferrals: 0,
      pendingAdmissions: 0,
      upcomingDischarges: 0,
      placementsThisMonth: 0,
      averageStayDays: 0,
      occupancyRate: 0,
    };
  }

  const placementWhere = {
    ...(isSuperadmin(role) ? {} : { organizationId }),
    OR: [
      { facilityId: facility.id },
      { selectedFacilityId: facility.id },
      { matchedFacilities: { has: facility.id } },
    ],
  };
  const monthStart = startOfMonth();
  const [
    pendingReferrals,
    pendingAdmissions,
    upcomingDischarges,
    placementsThisMonth,
    completedStays,
  ] = await Promise.all([
    prisma.placement.count({
      where: {
        ...placementWhere,
        status: { in: ["matching", "pending_approval"] },
      },
    }),
    prisma.placement.count({
      where: {
        ...placementWhere,
        status: { in: ["approved", "in_progress"] },
      },
    }),
    prisma.placement.count({
      where: {
        ...placementWhere,
        status: "completed",
        completedDate: { gte: monthStart },
      },
    }),
    prisma.placement.count({
      where: {
        ...placementWhere,
        createdAt: { gte: monthStart },
      },
    }),
    prisma.placement.findMany({
      where: {
        ...placementWhere,
        status: "completed",
        startDate: { not: null },
        completedDate: { not: null },
      },
      select: { startDate: true, completedDate: true },
    }),
  ]);
  
  return {
    currentOccupancy: facility.currentOccupancy,
    totalCapacity: facility.capacity,
    availableBeds: Math.max(facility.capacity - facility.currentOccupancy, 0),
    pendingReferrals,
    pendingAdmissions,
    upcomingDischarges,
    placementsThisMonth,
    averageStayDays: averageDays(completedStays, "startDate"),
    occupancyRate,
  };
}

export async function getReferrals(
  organizationId: string,
  role: string,
): Promise<Referral[]> {
  const where = {
    ...(isSuperadmin(role) ? {} : { organizationId }),
    status: { in: ["matching", "pending_approval", "approved", "cancelled"] },
  };
  const placements = await prisma.placement.findMany({
    where,
    include: {
      patient: true,
      socialWorker: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  } as any) as any[];
  const hospitalIds = uniqueStrings(placements.map((placement) => placement.patient.hospitalId));
  const hospitals = await prisma.hospital.findMany({
    where: { id: { in: hospitalIds } },
  });
  const hospitalsById = new Map(hospitals.map((hospital) => [hospital.id, hospital]));

  return placements.map((placement) => {
    const hospital = hospitalsById.get(placement.patient.hospitalId);
    const insuranceTerms = getPatientInsuranceTerms(placement.patient.insurance);
    const status: Referral["status"] = placement.status === "approved"
      ? "accepted"
      : placement.status === "cancelled"
        ? "declined"
        : placement.status === "pending_approval"
          ? "reviewing"
          : "new";

    return {
      id: placement.id,
      patientName: `${placement.patient.firstName} ${placement.patient.lastName}`,
      patientAge: placement.patient.age,
      careLevel: toCareLevel(placement.careLevel),
      referringHospital: hospital?.name ?? "Unknown hospital",
      referringHospitalId: placement.patient.hospitalId,
      referredBy: `${placement.socialWorker.firstName} ${placement.socialWorker.lastName}`,
      referredAt: toISO(placement.createdAt),
      status,
      notes: placement.assessmentNotes ?? placement.notes,
      diagnosis: placement.patient.primaryDiagnosis,
      insuranceInfo: insuranceTerms.length > 0 ? insuranceTerms.join(", ") : "Not specified",
    };
  });
}

/**
 * Return facility users scoped to the given organization.
 */
export async function getFacilityUsers(
  organizationId: string,
  role: string,
): Promise<User[]> {
  const where = isSuperadmin(role) 
    ? { role: "facility_coordinator" as any } 
    : { organizationId, role: "facility_coordinator" as any };
  
  const prismaUsers = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  
  return prismaUsers.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: toUserRole(u.role),
    title: u.title,
    department: u.department,
    hospitalId: u.hospitalId,
    organizationId: u.organizationId ?? "",
    avatarUrl: u.avatarUrl ?? undefined,
    phone: u.phone,
    createdAt: toISO(u.createdAt),
    updatedAt: toISO(u.updatedAt),
  }));
}

/**
 * Get super admin dashboard stats
 */
export async function getSuperAdminDashboardStats() {
  const currentMonth = startOfMonth();
  const monthStarts = Array.from({ length: 6 }, (_, index) =>
    addMonths(currentMonth, index - 5),
  );
  const [
    totalUsers,
    totalHospitals,
    totalFacilities,
    totalPlacements,
    activePlacements,
    completedPlacements,
    pendingApprovals,
    facilitiesForUtilization,
    completedPlacementDurations,
    placementsByMonth,
    placementsByStatus,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.hospital.count(),
    prisma.facility.count(),
    prisma.placement.count(),
    prisma.placement.count({
      where: {
        NOT: {
          status: { in: ["completed", "cancelled"] },
        },
      },
    }),
    prisma.placement.count({
      where: { status: "completed" },
    }),
    prisma.placement.count({
      where: { status: "pending_approval" },
    }),
    prisma.facility.findMany({
      select: { capacity: true, currentOccupancy: true },
    }),
    prisma.placement.findMany({
      where: {
        status: "completed",
        completedDate: { not: null },
      },
      select: { createdAt: true, completedDate: true },
    }),
    Promise.all(
      monthStarts.map((monthStart) =>
        prisma.placement.count({
          where: {
            createdAt: {
              gte: monthStart,
              lt: addMonths(monthStart, 1),
            },
          },
        }),
      ),
    ),
    prisma.placement.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true },
  });

  const usersByRoleRecord: Record<string, number> = {};
  usersByRole.forEach((group) => {
    usersByRoleRecord[toUserRole(group.role)] = group._count.id;
  });

  const totalCapacity = facilitiesForUtilization.reduce((sum, facility) => sum + facility.capacity, 0);
  const currentOccupancy = facilitiesForUtilization.reduce((sum, facility) => sum + facility.currentOccupancy, 0);
  const facilityUtilizationRate = totalCapacity > 0
    ? Math.round((currentOccupancy / totalCapacity) * 100)
    : 0;

  const statusCounts: Record<string, number> = {};
  placementsByStatus.forEach((group) => {
    statusCounts[toPlacementStatus(group.status)] = group._count.id;
  });

  return {
    totalUsers,
    totalHospitals,
    totalFacilities,
    totalPlacements,
    activePlacements,
    completedPlacements,
    usersByRole: usersByRoleRecord,
    placementsByMonth: monthStarts.map((monthStart, index) => ({
      month: monthStart.toLocaleString("en-US", { month: "short" }),
      count: placementsByMonth[index] ?? 0,
    })),
    averagePlacementTimeDays: averageDays(completedPlacementDurations, "createdAt"),
    facilityUtilizationRate,
    pendingApprovals,
    placementsByStatus: statusCounts,
  };
}

/**
 * Return a single facility by ID, scoped to the given organization.
 * Superadmin sees any facility.
 */
export async function getFacility(
  id: string,
  organizationId: string,
  role: string,
): Promise<Facility | null> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const f = await prisma.facility.findFirst({
    where,
    include: { media: { orderBy: { displayOrder: "asc" } } },
  });
  if (!f) return null;
  return {
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    type: toFacilityType(f.type),
    address: f.address as any,
    phone: f.phone,
    email: f.email,
    website: f.website ?? undefined,
    contacts: f.contacts as any,
    licensure: f.licensure,
    accreditations: f.accreditations,
    capacity: f.capacity,
    currentOccupancy: f.currentOccupancy,
    insuranceAccepted: f.insuranceAccepted,
    careLevelsOffered: f.careLevelsOffered.map(toCareLevel),
    specialties: f.specialties,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    hasAvailability: f.hasAvailability,
    waitlistDays: f.waitlistDays ?? undefined,
    acceptsMedicare: f.acceptsMedicare,
    acceptsMedicaid: f.acceptsMedicaid,
    organizationId: f.organizationId,
    media: f.media?.map((m) => ({
      id: m.id,
      facilityId: m.facilityId,
      type: m.type as any,
      key: m.key,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl ?? undefined,
      fileSize: m.fileSize ?? undefined,
      mimeType: m.mimeType ?? undefined,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      displayOrder: m.displayOrder,
      createdAt: toISO(m.createdAt),
      updatedAt: toISO(m.updatedAt),
    })),
    createdAt: toISO(f.createdAt),
    updatedAt: toISO(f.updatedAt),
  };
}

/**
 * Search facilities across all organizations (for facility network browsing).
 * Hospital-side users search for facilities from any organization.
 */
export async function searchFacilities(params: {
  location?: string;
  insuranceAccepted?: string[];
  careLevelsOffered?: CareLevel[];
  hasAvailability?: boolean;
  facilityTypes?: FacilityType[];
  specialties?: string[];
}): Promise<Facility[]> {
  const where: Record<string, unknown> = {};

  if (params.location) {
    const loc = params.location.toLowerCase();
    where.OR = [
      { address: { path: ["city"], string_contains: loc } },
      { address: { path: ["state"], string_contains: loc } },
      { address: { path: ["zipCode"], string_contains: loc } },
      { address: { path: ["county"], string_contains: loc } },
    ];
  }

  if (params.insuranceAccepted?.length) {
    where.insuranceAccepted = { hasSome: params.insuranceAccepted };
  }

  if (params.careLevelsOffered?.length) {
    where.careLevelsOffered = {
      hasSome: params.careLevelsOffered.map(kebabToSnake),
    };
  }

  if (params.hasAvailability !== undefined) {
    where.hasAvailability = params.hasAvailability;
  }

  if (params.facilityTypes?.length) {
    where.type = { in: params.facilityTypes.map(kebabToSnake) };
  }

  if (params.specialties?.length) {
    where.specialties = { hasSome: params.specialties };
  }

  const facilities = await prisma.facility.findMany({
    where,
    orderBy: [{ rating: "desc" }, { name: "asc" }],
    include: { media: { orderBy: { displayOrder: "asc" } } },
    take: 50,
  });

  return facilities.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    type: toFacilityType(f.type),
    address: f.address as any,
    phone: f.phone,
    email: f.email,
    website: f.website ?? undefined,
    contacts: f.contacts as any,
    licensure: f.licensure,
    accreditations: f.accreditations,
    capacity: f.capacity,
    currentOccupancy: f.currentOccupancy,
    insuranceAccepted: f.insuranceAccepted,
    careLevelsOffered: f.careLevelsOffered.map(toCareLevel),
    specialties: f.specialties,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    hasAvailability: f.hasAvailability,
    waitlistDays: f.waitlistDays ?? undefined,
    acceptsMedicare: f.acceptsMedicare,
    acceptsMedicaid: f.acceptsMedicaid,
    organizationId: f.organizationId,
    media: f.media?.map((m) => ({
      id: m.id,
      facilityId: m.facilityId,
      type: m.type as any,
      key: m.key,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl ?? undefined,
      fileSize: m.fileSize ?? undefined,
      mimeType: m.mimeType ?? undefined,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      displayOrder: m.displayOrder,
      createdAt: toISO(m.createdAt),
      updatedAt: toISO(m.updatedAt),
    })),
    createdAt: toISO(f.createdAt),
    updatedAt: toISO(f.updatedAt),
  }));
}

/**
 * Get a single facility by ID without org scoping.
 * Used by the facility network detail page where hospital users browse cross-org facilities.
 */
export async function getFacilityById(id: string): Promise<Facility | null> {
  const f = await prisma.facility.findFirst({
    where: { id },
    include: { media: { orderBy: { displayOrder: "asc" } } },
  });

  if (!f) return null;

  return {
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    type: toFacilityType(f.type),
    address: f.address as any,
    phone: f.phone,
    email: f.email,
    website: f.website ?? undefined,
    contacts: f.contacts as any,
    licensure: f.licensure,
    accreditations: f.accreditations,
    capacity: f.capacity,
    currentOccupancy: f.currentOccupancy,
    insuranceAccepted: f.insuranceAccepted,
    careLevelsOffered: f.careLevelsOffered.map(toCareLevel),
    specialties: f.specialties,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    hasAvailability: f.hasAvailability,
    waitlistDays: f.waitlistDays ?? undefined,
    acceptsMedicare: f.acceptsMedicare,
    acceptsMedicaid: f.acceptsMedicaid,
    organizationId: f.organizationId,
    media: f.media?.map((m) => ({
      id: m.id,
      facilityId: m.facilityId,
      type: m.type as any,
      key: m.key,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl ?? undefined,
      fileSize: m.fileSize ?? undefined,
      mimeType: m.mimeType ?? undefined,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      displayOrder: m.displayOrder,
      createdAt: toISO(m.createdAt),
      updatedAt: toISO(m.updatedAt),
    })),
    createdAt: toISO(f.createdAt),
    updatedAt: toISO(f.updatedAt),
  };
}

/**
 * Create a new facility.
 * Permission check is handled by the calling API route.
 */
export async function createFacility(
  data: Omit<Facility, "id" | "createdAt" | "updatedAt">,
): Promise<Facility> {
  if (data.capacity < 0) throw new DataAccessError(400, "Capacity must be a non-negative number");
  if (data.currentOccupancy < 0) throw new DataAccessError(400, "Current occupancy must be a non-negative number");
  if (data.currentOccupancy > data.capacity) {
    throw new DataAccessError(400, "Current occupancy cannot exceed capacity");
  }
  const f = await prisma.facility.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description ?? null,
      type: kebabToSnake(data.type) as any,
      address: data.address as any,
      phone: data.phone,
      email: data.email,
      website: data.website ?? null,
      contacts: data.contacts as any,
      licensure: data.licensure,
      accreditations: data.accreditations,
      capacity: data.capacity,
      currentOccupancy: data.currentOccupancy,
      insuranceAccepted: data.insuranceAccepted,
      careLevelsOffered: toPrismaCareLevels(data.careLevelsOffered) as any,
      specialties: data.specialties,
      rating: data.rating,
      reviewsCount: data.reviewsCount,
      hasAvailability: data.hasAvailability,
      waitlistDays: data.waitlistDays ?? null,
      acceptsMedicare: data.acceptsMedicare,
      acceptsMedicaid: data.acceptsMedicaid,
      organizationId: data.organizationId,
    },
  });
  return {
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    type: toFacilityType(f.type),
    address: f.address as any,
    phone: f.phone,
    email: f.email,
    website: f.website ?? undefined,
    contacts: f.contacts as any,
    licensure: f.licensure,
    accreditations: f.accreditations,
    capacity: f.capacity,
    currentOccupancy: f.currentOccupancy,
    insuranceAccepted: f.insuranceAccepted,
    careLevelsOffered: f.careLevelsOffered.map(toCareLevel),
    specialties: f.specialties,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    hasAvailability: f.hasAvailability,
    waitlistDays: f.waitlistDays ?? undefined,
    acceptsMedicare: f.acceptsMedicare,
    acceptsMedicaid: f.acceptsMedicaid,
    organizationId: f.organizationId,
    media: [],
    createdAt: toISO(f.createdAt),
    updatedAt: toISO(f.updatedAt),
  };
}

/**
 * Update an existing facility, scoped to organization.
 * Superadmin can update any facility.
 */
export async function updateFacility(
  id: string,
  data: Partial<Omit<Facility, "id" | "createdAt" | "updatedAt">>,
  organizationId: string,
  role: string,
): Promise<Facility | null> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const existing = await prisma.facility.findFirst({ where });
  if (!existing) return null;

  if (data.capacity !== undefined && data.capacity < 0) {
    throw new DataAccessError(400, "Capacity must be a non-negative number");
  }
  if (data.currentOccupancy !== undefined && data.currentOccupancy < 0) {
    throw new DataAccessError(400, "Current occupancy must be a non-negative number");
  }
  if (data.currentOccupancy !== undefined && data.capacity !== undefined && data.currentOccupancy > data.capacity) {
    throw new DataAccessError(400, "Current occupancy cannot exceed capacity");
  }

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description ?? null;
  if (data.type !== undefined) updateData.type = kebabToSnake(data.type) as any;
  if (data.address !== undefined) updateData.address = data.address as any;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.website !== undefined) updateData.website = data.website ?? null;
  if (data.contacts !== undefined) updateData.contacts = data.contacts as any;
  if (data.licensure !== undefined) updateData.licensure = data.licensure;
  if (data.accreditations !== undefined) updateData.accreditations = data.accreditations;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.currentOccupancy !== undefined) updateData.currentOccupancy = data.currentOccupancy;
  if (data.insuranceAccepted !== undefined) updateData.insuranceAccepted = data.insuranceAccepted;
  if (data.careLevelsOffered !== undefined) updateData.careLevelsOffered = toPrismaCareLevels(data.careLevelsOffered) as any;
  if (data.specialties !== undefined) updateData.specialties = data.specialties;
  if (data.rating !== undefined) updateData.rating = data.rating;
  if (data.reviewsCount !== undefined) updateData.reviewsCount = data.reviewsCount;
  if (data.hasAvailability !== undefined) updateData.hasAvailability = data.hasAvailability;
  if (data.waitlistDays !== undefined) updateData.waitlistDays = data.waitlistDays ?? null;
  if (data.acceptsMedicare !== undefined) updateData.acceptsMedicare = data.acceptsMedicare;
  if (data.acceptsMedicaid !== undefined) updateData.acceptsMedicaid = data.acceptsMedicaid;

  const f = await prisma.facility.update({
    where: { id },
    data: updateData,
  });

  return {
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    type: toFacilityType(f.type),
    address: f.address as any,
    phone: f.phone,
    email: f.email,
    website: f.website ?? undefined,
    contacts: f.contacts as any,
    licensure: f.licensure,
    accreditations: f.accreditations,
    capacity: f.capacity,
    currentOccupancy: f.currentOccupancy,
    insuranceAccepted: f.insuranceAccepted,
    careLevelsOffered: f.careLevelsOffered.map(toCareLevel),
    specialties: f.specialties,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    hasAvailability: f.hasAvailability,
    waitlistDays: f.waitlistDays ?? undefined,
    acceptsMedicare: f.acceptsMedicare,
    acceptsMedicaid: f.acceptsMedicaid,
    organizationId: f.organizationId,
    media: [],
    createdAt: toISO(f.createdAt),
    updatedAt: toISO(f.updatedAt),
  };
}

/**
 * Delete a facility, scoped to organization.
 * Returns false if facility not found or has active placements.
 */
export async function deleteFacility(
  id: string,
  organizationId: string,
  role: string,
): Promise<{ success: boolean; error?: string }> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const existing = await prisma.facility.findFirst({ where });
  if (!existing) return { success: false, error: "Facility not found" };

  // Check for active placements
  const activePlacements = await prisma.placement.count({
    where: {
      ...(isSuperadmin(role) ? {} : { organizationId }),
      OR: [
        { facilityId: id },
        { selectedFacilityId: id },
        { matchedFacilities: { has: id } },
      ],
      NOT: { status: { in: ["completed", "cancelled"] } },
    },
  });
  if (activePlacements > 0) {
    return {
      success: false,
      error: `Cannot delete facility with ${activePlacements} active placement(s)`,
    };
  }

  await prisma.facility.delete({ where: { id } });
  return { success: true };
}

/**
 * Return a single patient by ID, scoped to the given organization.
 * Superadmin sees any patient.
 */
export async function getPatient(
  id: string,
  organizationId: string,
  role: string,
): Promise<Patient | null> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const p = await prisma.patient.findFirst({
    where,
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });
  if (!p) return null;
  return {
    id: p.id,
    mrn: p.mrn,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: toISO(p.dateOfBirth),
    age: p.age,
    gender: p.gender as any,
    address: p.address as any,
    phone: p.phone,
    emergencyContact: p.emergencyContact as any,
    insurance: p.insurance as any,
    primaryDiagnosis: p.primaryDiagnosis,
    secondaryDiagnoses: p.secondaryDiagnoses,
    careLevelRequired: toCareLevel(p.careLevelRequired),
    notes: p.notes,
    socialWorkerId: p.socialWorkerId,
    hospitalId: p.hospitalId,
    organizationId: p.organizationId,
    admissionDate: toISO(p.admissionDate),
    estimatedDischargeDate: p.estimatedDischargeDate ? toISO(p.estimatedDischargeDate) : undefined,
    status: toPatientStatus(p.status),
    documents: p.documents?.map((d) => ({
      id: d.id,
      patientId: d.patientId,
      name: d.name,
      key: d.key,
      url: d.url,
      fileSize: d.fileSize ?? undefined,
      mimeType: d.mimeType ?? undefined,
      category: d.category,
      uploadedById: d.uploadedById,
      createdAt: toISO(d.createdAt),
      updatedAt: toISO(d.updatedAt),
    })),
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
  };
}

/**
 * Create a new patient. Permission check handled by calling API route.
 */
export async function createPatient(
  data: Omit<Patient, "id" | "createdAt" | "updatedAt">,
): Promise<Patient> {
  const p = await prisma.patient.create({
    data: {
      id: crypto.randomUUID(),
      mrn: data.mrn,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      age: data.age,
      gender: data.gender,
      address: data.address as any,
      phone: data.phone,
      emergencyContact: data.emergencyContact as any,
      insurance: data.insurance as any,
      primaryDiagnosis: data.primaryDiagnosis,
      secondaryDiagnoses: data.secondaryDiagnoses,
      careLevelRequired: kebabToSnake(data.careLevelRequired) as any,
      notes: data.notes,
      socialWorkerId: data.socialWorkerId,
      hospitalId: data.hospitalId,
      organizationId: data.organizationId,
      admissionDate: new Date(data.admissionDate),
      estimatedDischargeDate: data.estimatedDischargeDate ? new Date(data.estimatedDischargeDate) : null,
      status: kebabToSnake(data.status) as any,
    },
  });
  return {
    id: p.id,
    mrn: p.mrn,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: toISO(p.dateOfBirth),
    age: p.age,
    gender: p.gender as any,
    address: p.address as any,
    phone: p.phone,
    emergencyContact: p.emergencyContact as any,
    insurance: p.insurance as any,
    primaryDiagnosis: p.primaryDiagnosis,
    secondaryDiagnoses: p.secondaryDiagnoses,
    careLevelRequired: toCareLevel(p.careLevelRequired),
    notes: p.notes,
    socialWorkerId: p.socialWorkerId,
    hospitalId: p.hospitalId,
    organizationId: p.organizationId,
    admissionDate: toISO(p.admissionDate),
    estimatedDischargeDate: p.estimatedDischargeDate ? toISO(p.estimatedDischargeDate) : undefined,
    status: toPatientStatus(p.status),
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
  };
}

/**
 * Update an existing patient, scoped to organization.
 */
export async function updatePatient(
  id: string,
  data: Partial<Omit<Patient, "id" | "createdAt" | "updatedAt">>,
  organizationId: string,
  role: string,
): Promise<Patient | null> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const existing = await prisma.patient.findFirst({ where });
  if (!existing) return null;

  const updateData: Record<string, any> = {};
  if (data.mrn !== undefined) updateData.mrn = data.mrn;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth);
  if (data.age !== undefined) updateData.age = data.age;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.address !== undefined) updateData.address = data.address as any;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact as any;
  if (data.insurance !== undefined) updateData.insurance = data.insurance as any;
  if (data.primaryDiagnosis !== undefined) updateData.primaryDiagnosis = data.primaryDiagnosis;
  if (data.secondaryDiagnoses !== undefined) updateData.secondaryDiagnoses = data.secondaryDiagnoses;
  if (data.careLevelRequired !== undefined) updateData.careLevelRequired = kebabToSnake(data.careLevelRequired) as any;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.socialWorkerId !== undefined) updateData.socialWorkerId = data.socialWorkerId;
  if (data.hospitalId !== undefined) updateData.hospitalId = data.hospitalId;
  if (data.admissionDate !== undefined) updateData.admissionDate = new Date(data.admissionDate);
  if (data.estimatedDischargeDate !== undefined) updateData.estimatedDischargeDate = data.estimatedDischargeDate ? new Date(data.estimatedDischargeDate) : null;
  if (data.status !== undefined) updateData.status = kebabToSnake(data.status) as any;

  const p = await prisma.patient.update({
    where: { id },
    data: updateData,
  });

  return {
    id: p.id,
    mrn: p.mrn,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: toISO(p.dateOfBirth),
    age: p.age,
    gender: p.gender as any,
    address: p.address as any,
    phone: p.phone,
    emergencyContact: p.emergencyContact as any,
    insurance: p.insurance as any,
    primaryDiagnosis: p.primaryDiagnosis,
    secondaryDiagnoses: p.secondaryDiagnoses,
    careLevelRequired: toCareLevel(p.careLevelRequired),
    notes: p.notes,
    socialWorkerId: p.socialWorkerId,
    hospitalId: p.hospitalId,
    organizationId: p.organizationId,
    admissionDate: toISO(p.admissionDate),
    estimatedDischargeDate: p.estimatedDischargeDate ? toISO(p.estimatedDischargeDate) : undefined,
    status: toPatientStatus(p.status),
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
  };
}

/**
 * Delete a patient, scoped to organization.
 * Returns false if patient not found or has active placements.
 */
export async function deletePatient(
  id: string,
  organizationId: string,
  role: string,
): Promise<{ success: boolean; error?: string }> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const existing = await prisma.patient.findFirst({ where });
  if (!existing) return { success: false, error: "Patient not found" };

  const activePlacements = await prisma.placement.count({
    where: {
      patientId: id,
      NOT: { status: { in: ["completed", "cancelled"] } },
    },
  });
  if (activePlacements > 0) {
    return {
      success: false,
      error: `Cannot delete patient with ${activePlacements} active placement(s)`,
    };
  }

  await prisma.patient.delete({ where: { id } });
  return { success: true };
}

// ── Organization Functions ──

// ── Patient Document Functions ──

export async function getPatientDocuments(
  patientId: string,
  organizationId: string,
  role: string,
): Promise<PatientDocument[]> {
  const patient = await prisma.patient.findFirst({
    where: isSuperadmin(role) ? { id: patientId } : { id: patientId, organizationId },
    select: { id: true },
  });
  if (!patient) {
    throw new DataAccessError(404, "Patient not found");
  }

  const docs = await prisma.patientDocument.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });
  return docs.map((d) => ({
    id: d.id,
    patientId: d.patientId,
    name: d.name,
    key: d.key,
    url: d.url,
    fileSize: d.fileSize ?? undefined,
    mimeType: d.mimeType ?? undefined,
    category: d.category,
    uploadedById: d.uploadedById,
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  }));
}

export async function createPatientDocument(
  data: Omit<PatientDocument, "id" | "createdAt" | "updatedAt">,
  organizationId: string,
  role: string,
): Promise<PatientDocument> {
  const [patient, uploader] = await Promise.all([
    prisma.patient.findFirst({
      where: isSuperadmin(role) ? { id: data.patientId } : { id: data.patientId, organizationId },
      select: { id: true, organizationId: true },
    }),
    prisma.user.findFirst({
      where: isSuperadmin(role) ? { id: data.uploadedById } : { id: data.uploadedById, organizationId },
      select: { id: true, organizationId: true },
    }),
  ]);
  if (!patient) throw new DataAccessError(404, "Patient not found");
  if (!uploader || uploader.organizationId !== patient.organizationId) {
    throw new DataAccessError(403, "Uploader is not authorized for this patient");
  }

  const d = await prisma.patientDocument.create({
    data: {
      id: crypto.randomUUID(),
      patientId: data.patientId,
      name: data.name,
      key: data.key,
      url: data.url,
      fileSize: data.fileSize ?? null,
      mimeType: data.mimeType ?? null,
      category: data.category,
      uploadedById: data.uploadedById,
    },
  });
  return {
    id: d.id,
    patientId: d.patientId,
    name: d.name,
    key: d.key,
    url: d.url,
    fileSize: d.fileSize ?? undefined,
    mimeType: d.mimeType ?? undefined,
    category: d.category,
    uploadedById: d.uploadedById,
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  };
}

export async function deletePatientDocument(
  id: string,
  patientId: string,
  organizationId: string,
  role: string,
): Promise<{ success: boolean }> {
  const doc = await prisma.patientDocument.findFirst({
    where: {
      id,
      patientId,
      patient: isSuperadmin(role) ? undefined : { organizationId },
    },
  });
  if (!doc) {
    throw new DataAccessError(404, "Document not found");
  }

  await prisma.patientDocument.delete({ where: { id } });
  return { success: true };
}

// ── HIPAA Documentation Vault Functions ──

function toDocumentCategory(value: string): import("@/types").DocumentCategory {
  return snakeToKebab(value) as import("@/types").DocumentCategory;
}

function toPrismaCategory(value: string): string {
  return kebabToSnake(value);
}

function toDocumentAccessAction(value: string): import("@/types").DocumentAccessAction {
  return value as import("@/types").DocumentAccessAction;
}

export async function getDocuments(
  organizationId: string,
  role: string,
  params: import("@/types").DocumentSearchParams = {},
) {
  const where: Record<string, unknown> = isSuperadmin(role)
    ? { deletedAt: null }
    : { organizationId, deletedAt: null };

  if (params.query) {
    where.OR = [
      { title: { contains: params.query, mode: "insensitive" } },
      { description: { contains: params.query, mode: "insensitive" } },
      { tags: { has: params.query } },
      { fileName: { contains: params.query, mode: "insensitive" } },
    ];
  }

  if (params.category) {
    where.category = toPrismaCategory(params.category);
  }

  if (params.tags && params.tags.length > 0) {
    where.tags = { hasSome: params.tags };
  }

  if (params.uploadedById) {
    where.uploadedById = params.uploadedById;
  }

  if (params.isArchived !== undefined) {
    where.isArchived = params.isArchived;
  }

  if (params.dateFrom || params.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (params.dateFrom) createdAt.gte = new Date(params.dateFrom);
    if (params.dateTo) createdAt.lte = new Date(params.dateTo);
    where.createdAt = createdAt;
  }

  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 20, 100);
  const skip = (page - 1) * pageSize;

  const sortField = params.sortBy ?? "createdAt";
  const sortOrder = params.sortOrder ?? "desc";

  const [docs, total] = await Promise.all([
    (prisma as any).document.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: pageSize,
      include: {
        uploadedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    (prisma as any).document.count({ where }),
  ]);

  return {
    data: docs.map((d: Record<string, unknown>) => mapDocument(d)),
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

function mapDocument(d: any): import("@/types").Document {
  return {
    id: d.id,
    organizationId: d.organizationId,
    uploadedById: d.uploadedById,
    title: d.title,
    description: d.description ?? undefined,
    category: toDocumentCategory(d.category),
    tags: d.tags ?? [],
    fileName: d.fileName,
    fileType: d.fileType,
    fileSize: d.fileSize,
    storageKey: d.storageKey,
    storageBucket: d.storageBucket,
    storageEndpoint: d.storageEndpoint,
    checksum: d.checksum ?? undefined,
    mimeType: d.mimeType,
    version: d.version,
    isArchived: d.isArchived,
    isOnLegalHold: d.isOnLegalHold,
    retentionDate: d.retentionDate ? toISO(d.retentionDate) : undefined,
    notes: d.notes ?? undefined,
    expiresAt: d.expiresAt ? toISO(d.expiresAt) : undefined,
    deletedAt: d.deletedAt ? toISO(d.deletedAt) : undefined,
    uploadedBy: d.uploadedBy ? { firstName: d.uploadedBy.firstName, lastName: d.uploadedBy.lastName, email: d.uploadedBy.email } : undefined,
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  };
}

export async function getDocument(
  id: string,
  organizationId: string,
  role: string,
): Promise<import("@/types").Document | null> {
  const where = isSuperadmin(role) ? { id, deletedAt: null } : { id, organizationId, deletedAt: null };
  const d = await (prisma as any).document.findFirst({
    where,
    include: {
      uploadedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  if (!d) return null;
  return mapDocument(d);
}

export type DocumentWithKeyMaterial = import("@/types").Document & {
  encryptionKey?: string;
  encryptionIv?: string;
};

/**
 * Server-only lookup that additionally returns the wrapped per-document key
 * material. Used exclusively by the download route to decrypt stored files;
 * the material is never included in API responses.
 */
export async function getDocumentWithKeyMaterial(
  id: string,
  organizationId: string,
  role: string,
): Promise<DocumentWithKeyMaterial | null> {
  const where = isSuperadmin(role) ? { id, deletedAt: null } : { id, organizationId, deletedAt: null };
  const d = await (prisma as any).document.findFirst({ where });
  if (!d) return null;
  return {
    ...mapDocument(d),
    encryptionKey: d.encryptionKey ?? undefined,
    encryptionIv: d.encryptionIv ?? undefined,
  };
}

export async function createDocument(
  data: {
    organizationId: string;
    uploadedById: string;
    title: string;
    description?: string;
    category: string;
    tags: string[];
    fileName: string;
    fileType: string;
    fileSize: number;
    storageKey: string;
    storageBucket: string;
    storageEndpoint: string;
    encryptionKey?: string;
    encryptionIv?: string;
    checksum?: string;
    mimeType: string;
    retentionDate?: string;
    notes?: string;
    expiresAt?: string;
  },
): Promise<import("@/types").Document> {
  const d = await (prisma as any).document.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: data.organizationId,
      uploadedById: data.uploadedById,
      title: data.title,
      description: data.description ?? null,
      category: toPrismaCategory(data.category),
      tags: data.tags,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      storageKey: data.storageKey,
      storageBucket: data.storageBucket,
      storageEndpoint: data.storageEndpoint,
      encryptionKey: data.encryptionKey ?? null,
      encryptionIv: data.encryptionIv ?? null,
      checksum: data.checksum ?? null,
      mimeType: data.mimeType,
      version: 1,
      retentionDate: data.retentionDate ? new Date(data.retentionDate) : null,
      notes: data.notes ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  return mapDocument(d);
}

export interface DocumentUploadTokenData {
  id: string;
  organizationId: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  encryptionKey: string;
  encryptionIv: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export const UPLOAD_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function createDocumentUploadToken(data: {
  organizationId: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  encryptionKey: string;
  encryptionIv: string;
}): Promise<DocumentUploadTokenData> {
  const t = await (prisma as any).documentUploadToken.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: data.organizationId,
      key: data.key,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      checksum: data.checksum,
      encryptionKey: data.encryptionKey,
      encryptionIv: data.encryptionIv,
      expiresAt: new Date(Date.now() + UPLOAD_TOKEN_TTL_MS),
    },
  });
  return mapUploadToken(t);
}

function mapUploadToken(t: Record<string, unknown>): DocumentUploadTokenData {
  return {
    id: t.id as string,
    organizationId: t.organizationId as string,
    key: t.key as string,
    fileName: t.fileName as string,
    fileSize: t.fileSize as number,
    mimeType: t.mimeType as string,
    checksum: t.checksum as string,
    encryptionKey: t.encryptionKey as string,
    encryptionIv: t.encryptionIv as string,
    expiresAt: toISO(t.expiresAt as Date),
    usedAt: t.usedAt ? toISO(t.usedAt as Date) : null,
    createdAt: toISO(t.createdAt as Date),
  };
}

/**
 * Fetch a token by id, scoped to the organization. Returns null when the
 * token does not exist, belongs to another org, is expired, or already used.
 */
export async function getValidDocumentUploadToken(
  id: string,
  organizationId: string,
): Promise<DocumentUploadTokenData | null> {
  const t = await (prisma as any).documentUploadToken.findFirst({
    where: { id, organizationId },
  });
  if (!t) return null;
  const token = mapUploadToken(t);
  if (token.usedAt) return null;
  if (new Date(token.expiresAt).getTime() < Date.now()) return null;
  return token;
}

/**
 * Atomically consume a token (marks it used). Returns true if this caller won
 * the race; false if the token was already used.
 */
export async function consumeDocumentUploadToken(
  id: string,
  organizationId: string,
): Promise<boolean> {
  const result = await (prisma as any).documentUploadToken.updateMany({
    where: { id, organizationId, usedAt: null },
    data: { usedAt: new Date() },
  });
  return result.count > 0;
}

export async function updateDocument(
  id: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    notes?: string;
    retentionDate?: string;
    expiresAt?: string;
    isArchived?: boolean;
    isOnLegalHold?: boolean;
  },
  organizationId: string,
  role: string,
): Promise<import("@/types").Document | null> {
  const where = isSuperadmin(role) ? { id, deletedAt: null } : { id, organizationId, deletedAt: null };
  const existing = await (prisma as any).document.findFirst({ where });
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description ?? null;
  if (data.category !== undefined) updateData.category = toPrismaCategory(data.category);
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.notes !== undefined) updateData.notes = data.notes ?? null;
  if (data.retentionDate !== undefined) updateData.retentionDate = data.retentionDate ? new Date(data.retentionDate) : null;
  if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
  if (data.isOnLegalHold !== undefined) updateData.isOnLegalHold = data.isOnLegalHold;

  const d = await (prisma as any).document.update({
    where: { id },
    data: updateData,
    include: {
      uploadedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  return mapDocument(d);
}

export async function deleteDocument(
  id: string,
  organizationId: string,
  role: string,
): Promise<{ success: boolean }> {
  const where = isSuperadmin(role) ? { id, deletedAt: null } : { id, organizationId, deletedAt: null };
  const existing = await (prisma as any).document.findFirst({ where });
  if (!existing) throw new DataAccessError(404, "Document not found");

  if (existing.isOnLegalHold) {
    throw new DataAccessError(409, "Document is on legal hold and cannot be deleted");
  }

  // Soft delete
  await (prisma as any).document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  // Log the deletion
  await logDocumentAccess({
    documentId: id,
    userId: existing.uploadedById,
    action: "DELETE",
    success: true,
    details: "Document soft-deleted",
  });

  return { success: true };
}

export async function getDocumentVersions(
  documentId: string,
  organizationId: string,
  role: string,
): Promise<import("@/types").DocumentVersion[]> {
  const where = isSuperadmin(role)
    ? { documentId, document: { deletedAt: null } }
    : { documentId, document: { organizationId, deletedAt: null } };

  const versions = await (prisma as any).documentVersion.findMany({
    where,
    orderBy: { version: "desc" },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return versions.map((v: any) => ({
    id: v.id,
    documentId: v.documentId,
    version: v.version,
    fileName: v.fileName,
    fileType: v.fileType,
    fileSize: v.fileSize,
    storageKey: v.storageKey,
    storageBucket: v.storageBucket,
    checksum: v.checksum ?? undefined,
    uploadedById: v.uploadedById,
    changeNotes: v.changeNotes ?? undefined,
    uploadedBy: v.uploadedBy ? { firstName: v.uploadedBy.firstName, lastName: v.uploadedBy.lastName, email: v.uploadedBy.email } : undefined,
    createdAt: toISO(v.createdAt),
  }));
}

export async function getDocumentAccessLogs(
  documentId: string,
  organizationId: string,
  role: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<{
  data: import("@/types").DocumentAccessLog[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}> {
  const where = isSuperadmin(role)
    ? { documentId, document: { deletedAt: null } }
    : { documentId, document: { organizationId, deletedAt: null } };

  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 20, 100);
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    (prisma as any).documentAccessLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    (prisma as any).documentAccessLog.count({ where }),
  ]);

  return {
    data: logs.map((l: any) => ({
      id: l.id,
      documentId: l.documentId,
      userId: l.userId,
      action: toDocumentAccessAction(l.action),
      timestamp: toISO(l.timestamp),
      ipAddress: l.ipAddress ?? undefined,
      userAgent: l.userAgent ?? undefined,
      success: l.success,
      details: l.details ?? undefined,
      user: l.user ? { firstName: l.user.firstName, lastName: l.user.lastName, email: l.user.email } : undefined,
    })),
    pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function logDocumentAccess(data: {
  documentId: string;
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  details?: string;
}): Promise<void> {
  await (prisma as any).documentAccessLog.create({
    data: {
      id: crypto.randomUUID(),
      documentId: data.documentId,
      userId: data.userId,
      action: data.action,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      success: data.success ?? true,
      details: data.details ?? null,
    },
  });
}

export async function getDocumentStats(
  organizationId: string,
  role: string,
): Promise<import("@/types").DocumentStats> {
  const where = isSuperadmin(role) ? { deletedAt: null } : { organizationId, deletedAt: null };

  const [totalDocuments, totalSizeAgg, byCategory, recentUploads, expiringSoon, archivedCount] = await Promise.all([
    (prisma as any).document.count({ where }),
    (prisma as any).document.aggregate({ where, _sum: { fileSize: true } }),
    (prisma as any).document.groupBy({
      by: ["category"],
      where,
      _count: { id: true },
    }),
    (prisma as any).document.count({
      where: { ...where, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    (prisma as any).document.count({
      where: { ...where, expiresAt: { not: null, lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
    }),
    (prisma as any).document.count({
      where: { ...where, isArchived: true },
    }),
  ]);

  const byCategoryRecord: Record<string, number> = {};
  byCategory.forEach((g: any) => {
    byCategoryRecord[toDocumentCategory(g.category)] = g._count.id;
  });

  return {
    totalDocuments,
    totalSize: (totalSizeAgg as any)._sum?.fileSize ?? 0,
    byCategory: byCategoryRecord,
    recentUploads,
    expiringSoon,
    archivedCount,
  };
}

// ── Hospital Functions ──

/**
 * Return hospitals scoped to the given organization.
 * Superadmin sees all hospitals.
 */
export async function getHospitals(
  organizationId: string,
  role: string,
): Promise<Hospital[]> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const prismaHospitals = await prisma.hospital.findMany({
    where,
    orderBy: { name: "asc" },
  });
  return prismaHospitals.map((h) => ({
    id: h.id,
    name: h.name,
    address: h.address as any,
    phone: h.phone,
    npi: h.npi,
    imageUrl: h.imageUrl ?? undefined,
    logoUrl: h.logoUrl ?? undefined,
    organizationId: h.organizationId,
  }));
}

/**
 * Return a single hospital by ID, scoped to the given organization.
 */
export async function getHospital(
  id: string,
  organizationId: string,
  role: string,
): Promise<Hospital | null> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const h = await prisma.hospital.findFirst({ where });
  if (!h) return null;
  return {
    id: h.id,
    name: h.name,
    address: h.address as any,
    phone: h.phone,
    npi: h.npi,
    imageUrl: h.imageUrl ?? undefined,
    logoUrl: h.logoUrl ?? undefined,
    organizationId: h.organizationId,
  };
}

/**
 * Create a new hospital record.
 * Permission check is handled by the calling server action.
 */
export async function createHospital(
  data: Omit<Hospital, "id">,
): Promise<Hospital> {
  const h = await prisma.hospital.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name,
      address: data.address as any,
      phone: data.phone,
      npi: data.npi,
      imageUrl: data.imageUrl ?? null,
      logoUrl: data.logoUrl ?? null,
      organizationId: data.organizationId,
    },
  });
  return {
    id: h.id,
    name: h.name,
    address: h.address as any,
    phone: h.phone,
    npi: h.npi,
    imageUrl: h.imageUrl ?? undefined,
    logoUrl: h.logoUrl ?? undefined,
    organizationId: h.organizationId,
  };
}

/**
 * Update an existing hospital, scoped to organization.
 */
export async function updateHospital(
  id: string,
  data: Partial<Omit<Hospital, "id" | "organizationId">>,
  organizationId: string,
  role: string,
): Promise<Hospital | null> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const existing = await prisma.hospital.findFirst({ where });
  if (!existing) return null;

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.address !== undefined) updateData.address = data.address as any;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.npi !== undefined) updateData.npi = data.npi;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ?? null;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl ?? null;

  const h = await prisma.hospital.update({
    where: { id },
    data: updateData,
  });

  return {
    id: h.id,
    name: h.name,
    address: h.address as any,
    phone: h.phone,
    npi: h.npi,
    imageUrl: h.imageUrl ?? undefined,
    logoUrl: h.logoUrl ?? undefined,
    organizationId: h.organizationId,
  };
}

/**
 * Delete a hospital, scoped to organization.
 * Warns but does not block if users are still assigned to this hospital.
 */
export async function deleteHospital(
  id: string,
  organizationId: string,
  role: string,
): Promise<{ success: boolean; error?: string; warning?: string }> {
  const where = isSuperadmin(role) ? { id } : { id, organizationId };
  const existing = await prisma.hospital.findFirst({ where });
  if (!existing) return { success: false, error: "Hospital not found" };

  const assignedUsers = await prisma.user.count({
    where: { hospitalId: id },
  });

  if (assignedUsers > 0) {
    await prisma.hospital.delete({ where: { id } });
    return {
      success: true,
      warning: `Deleted hospital with ${assignedUsers} user(s) still assigned.`,
    };
  }

  await prisma.hospital.delete({ where: { id } });
  return { success: true };
}

export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) return null;
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: snakeToKebab(org.type) as OrganizationType,
  };
}

export async function createOrganization(
  name: string,
  slug: string,
  type: OrganizationType,
): Promise<Organization> {
  const prismaOrg = await prisma.organization.create({
    data: {
      id: crypto.randomUUID(),
      name,
      slug,
      type: kebabToSnake(type) as any,
    },
  });
  return {
    id: prismaOrg.id,
    name: prismaOrg.name,
    slug: prismaOrg.slug,
    type: snakeToKebab(prismaOrg.type) as OrganizationType,
  };
}

// ── Invite Code Functions ──

export async function getInviteCodes(
  organizationId: string,
  role: string,
): Promise<InviteCode[]> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const prismaInviteCodes = await prisma.inviteCode.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return prismaInviteCodes.map((ic) => ({
    id: ic.id,
    code: ic.code,
    organizationId: ic.organizationId,
    role: ic.role ? (snakeToKebab(ic.role) as any) : undefined,
    createdById: ic.createdById,
    expiresAt: ic.expiresAt ? toISO(ic.expiresAt) : undefined,
    maxUses: ic.maxUses ?? undefined,
    usedCount: ic.usedCount,
    isActive: ic.isActive,
    createdAt: toISO(ic.createdAt),
    updatedAt: toISO(ic.updatedAt),
  }));
}

export async function createInviteCode(
  organizationId: string,
  createdById: string,
  role?: string,
  expiresAt?: Date,
  maxUses?: number,
): Promise<InviteCode> {
  const prismaInviteCode = await prisma.inviteCode.create({
    data: {
      id: crypto.randomUUID(),
      code: generateInviteCode(),
      organizationId,
      createdById,
      role: role ? (kebabToSnake(role) as any) : null,
      expiresAt,
      maxUses,
    },
  });
  return {
    id: prismaInviteCode.id,
    code: prismaInviteCode.code,
    organizationId: prismaInviteCode.organizationId,
    role: prismaInviteCode.role ? (snakeToKebab(prismaInviteCode.role) as any) : undefined,
    createdById: prismaInviteCode.createdById,
    expiresAt: prismaInviteCode.expiresAt ? toISO(prismaInviteCode.expiresAt) : undefined,
    maxUses: prismaInviteCode.maxUses ?? undefined,
    usedCount: prismaInviteCode.usedCount,
    isActive: prismaInviteCode.isActive,
    createdAt: toISO(prismaInviteCode.createdAt),
    updatedAt: toISO(prismaInviteCode.updatedAt),
  };
}

export async function validateInviteCode(code: string) {
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code },
    include: { organization: true },
  });

  if (!inviteCode) return { valid: false, reason: "Invalid invite code" };
  if (!inviteCode.isActive) return { valid: false, reason: "Invite code is inactive" };
  if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
    return { valid: false, reason: "Invite code has expired" };
  }
  if (inviteCode.maxUses && inviteCode.usedCount >= inviteCode.maxUses) {
    return { valid: false, reason: "Invite code has reached max uses" };
  }

  return {
    valid: true,
    inviteCode,
    organization: {
      id: inviteCode.organization.id,
      name: inviteCode.organization.name,
      slug: inviteCode.organization.slug,
      type: snakeToKebab(inviteCode.organization.type) as OrganizationType,
    },
  };
}

// ── Join Request Functions ──

export async function getJoinRequests(
  organizationId: string,
  role: string,
): Promise<JoinRequest[]> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  const prismaJoinRequests = await prisma.joinRequest.findMany({
    where,
    include: { user: true, inviteCode: true, reviewedBy: true },
    orderBy: { createdAt: "desc" },
  });
  return prismaJoinRequests.map((jr) => ({
    id: jr.id,
    userId: jr.userId,
    organizationId: jr.organizationId,
    inviteCodeId: jr.inviteCodeId ?? undefined,
    status: snakeToKebab(jr.status) as JoinRequestStatus,
    requestedRole: jr.requestedRole ? (snakeToKebab(jr.requestedRole) as any) : undefined,
    reviewedById: jr.reviewedById ?? undefined,
    reviewedAt: jr.reviewedAt ? toISO(jr.reviewedAt) : undefined,
    notes: jr.notes ?? undefined,
    createdAt: toISO(jr.createdAt),
    updatedAt: toISO(jr.updatedAt),
  }));
}

export async function createJoinRequest(
  userId: string,
  organizationId: string,
  inviteCodeId?: string,
  requestedRole?: string,
  notes?: string,
): Promise<JoinRequest> {
  const prismaJoinRequest = await prisma.joinRequest.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      organizationId,
      inviteCodeId,
      requestedRole: requestedRole ? (kebabToSnake(requestedRole) as any) : null,
      notes,
    },
  });
  return {
    id: prismaJoinRequest.id,
    userId: prismaJoinRequest.userId,
    organizationId: prismaJoinRequest.organizationId,
    inviteCodeId: prismaJoinRequest.inviteCodeId ?? undefined,
    status: snakeToKebab(prismaJoinRequest.status) as JoinRequestStatus,
    requestedRole: prismaJoinRequest.requestedRole ? (snakeToKebab(prismaJoinRequest.requestedRole) as any) : undefined,
    reviewedById: prismaJoinRequest.reviewedById ?? undefined,
    reviewedAt: prismaJoinRequest.reviewedAt ? toISO(prismaJoinRequest.reviewedAt) : undefined,
    notes: prismaJoinRequest.notes ?? undefined,
    createdAt: toISO(prismaJoinRequest.createdAt),
    updatedAt: toISO(prismaJoinRequest.updatedAt),
  };
}

export async function approveJoinRequest(
  joinRequestId: string,
  reviewedById: string,
  notes?: string,
) {
  await prisma.$transaction(
    async (tx) => {
      const joinRequest = await tx.joinRequest.findUniqueOrThrow({
        where: { id: joinRequestId },
        include: { inviteCode: true },
      });

      if (joinRequest.status !== "pending") {
        throw new Error("Join request already processed");
      }

      // Count a use only on successful approval, gated by maxUses
      if (joinRequest.inviteCodeId) {
        const consumed = await consumeInviteCodeUse(tx, joinRequest.inviteCodeId);
        if (!consumed) {
          throw new Error("Invite code is invalid or expired");
        }
      }

      const newRole = joinRequest.inviteCode?.role || "customer";

      await tx.user.update({
        where: { id: joinRequest.userId },
        data: {
          organizationId: joinRequest.organizationId,
          role: newRole as any,
        },
      });

      await tx.joinRequest.update({
        where: { id: joinRequestId },
        data: {
          status: "approved",
          reviewedById,
          reviewedAt: new Date(),
          notes: notes ?? null,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return { success: true };
}

// ── Facility Media Functions ──

export async function getFacilityMedia(
  facilityId: string,
): Promise<FacilityMedia[]> {
  const prismaMedia = await prisma.facilityMedia.findMany({
    where: { facilityId },
    orderBy: { displayOrder: "asc" },
  });
  return prismaMedia.map((m) => ({
    id: m.id,
    facilityId: m.facilityId,
    type: m.type as any,
    key: m.key,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl ?? undefined,
    fileSize: m.fileSize ?? undefined,
    mimeType: m.mimeType ?? undefined,
    width: m.width ?? undefined,
    height: m.height ?? undefined,
    displayOrder: m.displayOrder,
    createdAt: toISO(m.createdAt),
    updatedAt: toISO(m.updatedAt),
  }));
}

export async function createFacilityMedia(
  data: Omit<FacilityMedia, "id" | "createdAt" | "updatedAt">,
): Promise<FacilityMedia> {
  const m = await prisma.facilityMedia.create({
    data: {
      id: crypto.randomUUID(),
      facilityId: data.facilityId,
      type: kebabToSnake(data.type) as any,
      key: data.key,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl ?? null,
      fileSize: data.fileSize ?? null,
      mimeType: data.mimeType ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      displayOrder: data.displayOrder,
    },
  });
  return {
    id: m.id,
    facilityId: m.facilityId,
    type: m.type as any,
    key: m.key,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl ?? undefined,
    fileSize: m.fileSize ?? undefined,
    mimeType: m.mimeType ?? undefined,
    width: m.width ?? undefined,
    height: m.height ?? undefined,
    displayOrder: m.displayOrder,
    createdAt: toISO(m.createdAt),
    updatedAt: toISO(m.updatedAt),
  };
}

export async function deleteFacilityMedia(
  id: string,
): Promise<{ success: boolean }> {
  await prisma.facilityMedia.delete({ where: { id } });
  return { success: true };
}

export async function updateFacilityMediaOrder(
  id: string,
  displayOrder: number,
): Promise<void> {
  await prisma.facilityMedia.update({
    where: { id },
    data: { displayOrder },
  });
}

export async function denyJoinRequest(
  joinRequestId: string,
  reviewedById: string,
  notes?: string,
) {
  await prisma.joinRequest.update({
    where: { id: joinRequestId },
    data: {
      status: "denied",
      reviewedById,
      reviewedAt: new Date(),
      notes,
    },
  });
  return { success: true };
}
