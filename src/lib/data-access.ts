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
