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
export type OrganizationType = "hospital" | "facility";
export type JoinRequestStatus = "pending" | "approved" | "denied";

// ── Entities ──

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
}

export interface InviteCode {
  id: string;
  code: string;
  organizationId: string;
  role?: UserRole;
  createdById: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  organizationId: string;
  inviteCodeId?: string;
  status: JoinRequestStatus;
  requestedRole?: UserRole;
  reviewedById?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  imageUrl?: string;
  logoUrl?: string;
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
  documents?: PatientDocument[];
  createdAt: string;
  updatedAt: string;
}

export type PatientStatus = "admitted" | "assessment-in-progress" | "ready-for-discharge" | "placed" | "discharged";

export interface PatientDocument {
  id: string;
  patientId: string;
  name: string;
  key: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
  category: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: string;
  name: string;
  description?: string;
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
  media?: FacilityMedia[];
  createdAt: string;
  updatedAt: string;
}

export type MediaType = "image" | "gaussian_splat" | "video";

export interface FacilityMedia {
  id: string;
  facilityId: string;
  type: MediaType;
  key: string;
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  displayOrder: number;
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

export type ScheduleEventType = "meeting" | "check-in" | "review" | "urgent";

export interface ScheduleEvent {
  id: string;
  dateISO: string;
  time: string;
  subject: string;
  details: string;
  location: string;
  participants: string;
  duration: string;
  type: ScheduleEventType;
}

export interface FacilityCapacityItem {
  id: string;
  name: string;
  total: number;
  available: number;
}

export interface FacilityCategoryData {
  id: string;
  label: string;
  items: FacilityCapacityItem[];
}

export interface DashboardWidgetData {
  header: {
    totalPlacements: number;
    completedPlacements: number;
    activePlacements: number;
    placementsThisMonth: number;
    placementsCreatedToday: number;
  };
  scheduleEvents: ScheduleEvent[];
  activity: {
    referrals: number;
    matches: number;
  };
  priorityPlacements: {
    activePriority: number;
    urgentThisWeek: number;
    topCareLevels: string[];
  };
  facilitiesByCategory: FacilityCategoryData[];
  careLevelBreakdown: { label: string; value: number }[];
  placementsThisWeek: { day: string; count: number; isToday: boolean }[];
  placementsByMonth: { month: string; created: number; completed: number }[];
  performance: {
    averagePlacementTimeDays: number;
    successRate: number;
    partnerFacilities: number;
  };
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

// ── HIPAA Documentation Vault Types ──

export type DocumentCategory =
  | "patient-records"
  | "medical-documentation"
  | "consent-forms"
  | "insurance-documents"
  | "compliance-documents"
  | "policies"
  | "procedures"
  | "audit-documents"
  | "employee-training-records"
  | "business-associate-agreements"
  | "security-documentation"
  | "privacy-documentation"
  | "other";

export type DocumentAccessAction =
  | "VIEW"
  | "DOWNLOAD"
  | "UPLOAD"
  | "UPDATE"
  | "DELETE"
  | "SHARE"
  | "EXPORT"
  | "ARCHIVE"
  | "RESTORE";

export interface Document {
  id: string;
  organizationId: string;
  uploadedById: string;
  title: string;
  description?: string;
  category: DocumentCategory;
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
  version: number;
  isArchived: boolean;
  isOnLegalHold: boolean;
  retentionDate?: string;
  notes?: string;
  expiresAt?: string;
  deletedAt?: string;
  uploadedBy?: { firstName: string; lastName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAccessLog {
  id: string;
  documentId: string;
  userId: string;
  action: DocumentAccessAction;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: string;
  user?: { firstName: string; lastName: string; email: string };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  storageBucket: string;
  checksum?: string;
  uploadedById: string;
  changeNotes?: string;
  uploadedBy?: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export interface DocumentSearchParams {
  query?: string;
  category?: DocumentCategory;
  tags?: string[];
  uploadedById?: string;
  isArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type DocumentStats = {
  totalDocuments: number;
  totalSize: number;
  byCategory: Record<string, number>;
  recentUploads: number;
  expiringSoon: number;
  archivedCount: number;
};

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

export interface FacilityMatchBreakdown {
  careLevelMatch: boolean;
  insuranceAccepted: boolean;
  hasAvailability: boolean;
  baseScore: number;
  capacityScore: number;
  ratingScore: number;
  waitlistPenalty: number;
  locationBonus: number;
  totalScore: number;
}

export interface FacilityMatchResult {
  facility: Facility;
  score: number;
  breakdown: FacilityMatchBreakdown;
  explanation: string;
}

export interface PatientMatchResult {
  patient: Patient;
  score: number;
  breakdown: FacilityMatchBreakdown;
  explanation: string;
}
