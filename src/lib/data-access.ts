// ─── Org-Scoped Data Access Layer ───
// Provides data filtered by the current user's organization.
// Superadmin users bypass organization scoping.

import type {
  Patient,
  Facility,
  Placement,
  DashboardStats,
  FacilityDashboardStats,
  Referral,
  ActivityEvent,
  User,
  Organization,
  OrganizationType,
  InviteCode,
  JoinRequest,
  JoinRequestStatus,
} from "@/types";
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
function snakeToKebab(str: string): string {
  return str.replace(/_/g, "-");
}

// Convert UI kebab-case enums to Prisma snake_case
function kebabToSnake(str: string): string {
  return str.replace(/-/g, "_");
}

// Generate random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
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
    careLevelRequired: p.careLevelRequired as any,
    notes: p.notes,
    socialWorkerId: p.socialWorkerId,
    hospitalId: p.hospitalId,
    organizationId: p.organizationId,
    admissionDate: toISO(p.admissionDate),
    estimatedDischargeDate: p.estimatedDischargeDate ? toISO(p.estimatedDischargeDate) : undefined,
    status: p.status as any,
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
  });
  return prismaFacilities.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.type as any,
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
    careLevelsOffered: f.careLevelsOffered as any,
    specialties: f.specialties,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    hasAvailability: f.hasAvailability,
    waitlistDays: f.waitlistDays ?? undefined,
    acceptsMedicare: f.acceptsMedicare,
    acceptsMedicaid: f.acceptsMedicaid,
    organizationId: f.organizationId,
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
    status: p.status as any,
    careLevel: p.careLevel as any,
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
    role: u.role as any,
    title: u.title,
    department: u.department,
    hospitalId: u.hospitalId,
    organizationId: u.organizationId,
    avatarUrl: u.avatarUrl ?? undefined,
    phone: u.phone,
    createdAt: toISO(u.createdAt),
    updatedAt: toISO(u.updatedAt),
  }));
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

  const [patientCount, placementCount, pendingAssessmentCount, availableFacilityCount] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.placement.count({ where }),
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
  ]);

  return {
    activePatients: patientCount,
    activePlacements: placementCount,
    pendingAssessments: pendingAssessmentCount,
    facilitiesAvailable: availableFacilityCount,
    placementsThisMonth: 12, // simplified; would be date-filtered in production
    averagePlacementTimeDays: 3.5,
  };
}

/**
 * Return facility dashboard stats scoped to organization.
 */
export async function getFacilityDashboardStats(
  organizationId: string,
  role: string,
): Promise<FacilityDashboardStats> {
  const where = isSuperadmin(role) ? {} : { organizationId };
  
  // Get first facility as default for now
  const facility = await prisma.facility.findFirst({ where });
  
  return {
    currentOccupancy: facility?.currentOccupancy ?? 0,
    totalCapacity: facility?.capacity ?? 100,
    availableBeds: facility ? facility.capacity - facility.currentOccupancy : 0,
    pendingReferrals: 2,
    pendingAdmissions: 3,
    upcomingDischarges: 5,
    placementsThisMonth: 18,
    averageStayDays: 34,
    occupancyRate: facility ? Math.round((facility.currentOccupancy / facility.capacity) * 100) : 0,
  };
}

/**
 * Return referrals (mock for now since referrals aren't in Prisma schema yet)
 */
export async function getReferrals(
  organizationId: string,
  role: string,
): Promise<Referral[]> {
  // Mock referrals for now
  return [];
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
    role: u.role as any,
    title: u.title,
    department: u.department,
    hospitalId: u.hospitalId,
    organizationId: u.organizationId,
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
  const [
    totalUsers,
    totalFacilities,
    totalPlacements,
    activePlacements,
    completedPlacements,
  ] = await Promise.all([
    prisma.user.count(),
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
  ]);

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true },
  });

  const usersByRoleRecord: Record<string, number> = {};
  usersByRole.forEach((group) => {
    usersByRoleRecord[group.role] = group._count.id;
  });

  return {
    totalUsers,
    totalHospitals: 4, // Mock value for now
    totalFacilities,
    totalPlacements,
    activePlacements,
    completedPlacements,
    usersByRole: usersByRoleRecord,
    placementsByMonth: [
      { month: "Feb", count: 5 },
      { month: "Mar", count: 8 },
      { month: "Apr", count: 6 },
      { month: "May", count: 10 },
      { month: "Jun", count: 12 },
      { month: "Jul", count: 6 },
    ],
    averagePlacementTimeDays: 3.5,
    facilityUtilizationRate: 82,
    pendingApprovals: 3,
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
  const f = await prisma.facility.findFirst({ where });
  if (!f) return null;
  return {
    id: f.id,
    name: f.name,
    type: f.type as any,
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
    careLevelsOffered: f.careLevelsOffered as any,
    specialties: f.specialties,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    hasAvailability: f.hasAvailability,
    waitlistDays: f.waitlistDays ?? undefined,
    acceptsMedicare: f.acceptsMedicare,
    acceptsMedicaid: f.acceptsMedicaid,
    organizationId: f.organizationId,
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
  const f = await prisma.facility.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name,
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
      careLevelsOffered: data.careLevelsOffered as any,
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
    type: f.type as any,
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
    careLevelsOffered: f.careLevelsOffered as any,
    specialties: f.specialties,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    hasAvailability: f.hasAvailability,
    waitlistDays: f.waitlistDays ?? undefined,
    acceptsMedicare: f.acceptsMedicare,
    acceptsMedicaid: f.acceptsMedicaid,
    organizationId: f.organizationId,
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

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
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
  if (data.careLevelsOffered !== undefined) updateData.careLevelsOffered = data.careLevelsOffered as any;
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
    type: f.type as any,
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
    careLevelsOffered: f.careLevelsOffered as any,
    specialties: f.specialties,
    rating: f.rating,
    reviewsCount: f.reviewsCount,
    hasAvailability: f.hasAvailability,
    waitlistDays: f.waitlistDays ?? undefined,
    acceptsMedicare: f.acceptsMedicare,
    acceptsMedicaid: f.acceptsMedicaid,
    organizationId: f.organizationId,
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
      facilityId: id,
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

// ── Organization Functions ──

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
) {
  const joinRequest = await prisma.joinRequest.findUniqueOrThrow({
    where: { id: joinRequestId },
    include: { inviteCode: true },
  });

  const newRole = joinRequest.inviteCode?.role || "customer";

  // Update the user's organization and role
  await prisma.user.update({
    where: { id: joinRequest.userId },
    data: {
      organizationId: joinRequest.organizationId,
      role: newRole as any,
    },
  });

  // Update join request
  const updatedJoinRequest = await prisma.joinRequest.update({
    where: { id: joinRequestId },
    data: {
      status: "approved",
      reviewedById,
      reviewedAt: new Date(),
    },
  });

  // Increment invite code used count if applicable
  if (joinRequest.inviteCodeId) {
    await prisma.inviteCode.update({
      where: { id: joinRequest.inviteCodeId },
      data: { usedCount: { increment: 1 } },
    });
  }

  return { success: true };
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
