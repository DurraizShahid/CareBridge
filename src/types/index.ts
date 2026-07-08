// ─── Core Domain Types for CareBridge Health ───

// ── Value Objects ──

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
}

export interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  type: InsuranceType;
  status: InsuranceStatus;
}

export type InsuranceType = "medicare" | "medicaid" | "private" | "va" | "self-pay";
export type InsuranceStatus = "active" | "pending" | "expired" | "verified";

export type CareLevel =
  | "independent-living"
  | "assisted-living"
  | "skilled-nursing"
  | "long-term-care"
  | "rehabilitation"
  | "home-health"
  | "hospice"
  | "memory-care";

export type PlacementStatus =
  | "assessment"
  | "searching"
  | "matching"
  | "pending-approval"
  | "approved"
  | "in-progress"
  | "completed"
  | "cancelled";

export type UserRole = "social-worker" | "discharge-planner" | "administrator" | "facility-coordinator" | "superadmin" | "customer";

// ── Entities ──

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  title: string;
  department: string;
  hospitalId: string;
  organizationId: string;
  avatarUrl?: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: Address;
  phone: string;
  npi: string;
  organizationId: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: "male" | "female" | "other";
  address: Address;
  phone: string;
  emergencyContact: Contact;
  insurance: Insurance[];
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  careLevelRequired: CareLevel;
  notes: string;
  socialWorkerId: string;
  hospitalId: string;
  organizationId: string;
  admissionDate: string;
  estimatedDischargeDate?: string;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
}

export type PatientStatus = "admitted" | "assessment-in-progress" | "ready-for-discharge" | "placed" | "discharged";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: Address;
  phone: string;
  email: string;
  website?: string;
  contacts: Contact[];
  licensure: string[];
  accreditations: string[];
  capacity: number;
  currentOccupancy: number;
  insuranceAccepted: string[];
  careLevelsOffered: CareLevel[];
  specialties: string[];
  rating: number; // 1-5
  reviewsCount: number;
  hasAvailability: boolean;
  waitlistDays?: number;
  acceptsMedicare: boolean;
  acceptsMedicaid: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export type FacilityType =
  | "skilled-nursing-facility"
  | "rehabilitation-center"
  | "assisted-living"
  | "long-term-care"
  | "home-health-agency"
  | "hospice";

export interface Placement {
  id: string;
  patientId: string;
  facilityId?: string;
  socialWorkerId: string;
  status: PlacementStatus;
  careLevel: CareLevel;
  priority: "low" | "medium" | "high" | "emergency";
  assessmentNotes?: string;
  preferredLocation?: {
    city: string;
    state: string;
    maxDistanceMiles: number;
  };
  matchedFacilities: string[]; // Facility IDs
  selectedFacilityId?: string;
  insurancePreAuthorized: boolean;
  estimatedCost?: number;
  approvedBy?: string;
  approvalDate?: string;
  startDate?: string;
  completedDate?: string;
  cancellationReason?: string;
  notes: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Dashboard Types ──

export interface DashboardStats {
  activePatients: number;
  activePlacements: number;
  pendingAssessments: number;
  facilitiesAvailable: number;
  placementsThisMonth: number;
  averagePlacementTimeDays: number;
}

export interface FacilityDashboardStats {
  currentOccupancy: number;
  totalCapacity: number;
  availableBeds: number;
  pendingReferrals: number;
  pendingAdmissions: number;
  upcomingDischarges: number;
  placementsThisMonth: number;
  averageStayDays: number;
  occupancyRate: number;
}

export interface SuperAdminDashboardStats {
  totalUsers: number;
  totalHospitals: number;
  totalFacilities: number;
  totalPlacements: number;
  activePlacements: number;
  completedPlacements: number;
  usersByRole: Record<string, number>;
  placementsByMonth: { month: string; count: number }[];
  averagePlacementTimeDays: number;
  facilityUtilizationRate: number;
  pendingApprovals: number;
}

export interface Referral {
  id: string;
  patientName: string;
  patientAge: number;
  careLevel: CareLevel;
  referringHospital: string;
  referringHospitalId: string;
  referredBy: string;
  referredAt: string;
  status: "new" | "reviewing" | "accepted" | "declined";
  notes: string;
  diagnosis: string;
  insuranceInfo: string;
}

export interface ActivityEvent {
  id: string;
  type: "placement" | "assessment" | "admission" | "discharge" | "note" | "milestone";
  title: string;
  description: string;
  patientName: string;
  patientId: string;
  timestamp: string;
  userId: string;
  organizationId: string;
}
