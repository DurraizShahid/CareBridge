# CareBridge Data Model

This document describes the database schema, entity relationships, and enum types used throughout the application. The schema is defined in `prisma/schema.prisma` and managed by Prisma ORM v7.

## Entity Relationship Overview

```
Organization (1) ──── (*) User
     │                      │
     │                      │ socialWorkerId
     │                      ▼
     ├──── (*) Patient ◄──── Placement ────► Facility (*)
     │         │                                  │
     │         │                                  │
     │    PatientDocument                    FacilityMedia
     │
     ├──── (*) Hospital
     ├──── (*) ActivityEvent
     ├──── (*) InviteCode
     └──── (*) JoinRequest ──► User (applicant)
```

All entities (except the public invite code validation) are scoped to an organization via `organizationId`. Superadmins bypass org scoping on read operations.

---

## Models

### Organization

The root multi-tenant entity. Every hospital system or care facility group is an organization.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `name` | String | Organization display name |
| `slug` | String (unique) | URL-friendly identifier |
| `type` | OrganizationType | `HOSPITAL` or `FACILITY` |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated |

**Relations:** Has many Users, Patients, Facilities, Hospitals, Placements, ActivityEvents, InviteCodes, JoinRequests.

---

### User

Platform users synced from Clerk via webhooks. The `id` field matches the Clerk user ID.

| Field | Type | Description |
|---|---|---|
| `id` | String | Clerk user ID (primary key) |
| `email` | String (unique) | User email |
| `firstName` | String? | From Clerk profile |
| `lastName` | String? | From Clerk profile |
| `imageUrl` | String? | Clerk profile image |
| `role` | UserRole | One of the 6 system roles |
| `organizationId` | String? | Nullable until onboarding completes |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

**Relations:** Belongs to Organization. Has many Patients (as social worker), Placements (as social worker), ActivityEvents, InviteCodes (as creator), JoinRequests (as applicant and reviewer), PatientDocuments (as uploader).

---

### Patient

Patient records containing demographic, medical, and insurance information.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `mrn` | String | Medical Record Number |
| `firstName` | String | Patient first name |
| `lastName` | String | Patient last name |
| `dateOfBirth` | DateTime | Date of birth |
| `gender` | String? | Gender |
| `primaryDiagnosis` | String? | Primary diagnosis |
| `secondaryDiagnoses` | String[] | Array of secondary diagnoses |
| `allergies` | String[] | Known allergies |
| `medications` | String[] | Current medications |
| `mobility` | String? | Mobility level |
| `cognitiveStatus` | String? | Cognitive status |
| `careLevelRequired` | CareLevel? | Required care level |
| `insurance` | Json? | Insurance information (flexible JSON) |
| `insuranceType` | InsuranceType? | Primary insurance category |
| `insuranceStatus` | InsuranceStatus? | Coverage verification status |
| `status` | PatientStatus | Current patient status |
| `admissionDate` | DateTime? | Hospital admission date |
| `targetDischargeDate` | DateTime? | Planned discharge date |
| `socialWorkerId` | String? | Assigned social worker |
| `organizationId` | String | Owning organization |
| `roomNumber` | String? | Hospital room |
| `floorUnit` | String? | Hospital floor/unit |
| `phone` | String? | Contact phone |
| `email` | String? | Contact email |
| `emergencyContactName` | String? | Emergency contact |
| `emergencyContactPhone` | String? | Emergency contact phone |
| `emergencyContactRelation` | String? | Relation to patient |
| `address` | String? | Home address |
| `city` | String? | City |
| `state` | String? | State |
| `zipCode` | String? | ZIP code |
| `notes` | String? | General notes |

**Relations:** Belongs to Organization and User (social worker). Has many Placements, ActivityEvents, PatientDocuments.

---

### Facility

Care facilities (skilled nursing, rehab, assisted living, etc.) with capacity tracking.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `name` | String | Facility name |
| `type` | FacilityType | Type of care facility |
| `address` | String? | Street address |
| `city` | String? | City |
| `state` | String? | State |
| `zipCode` | String? | ZIP code |
| `phone` | String? | Contact phone |
| `email` | String? | Contact email |
| `website` | String? | Website URL |
| `description` | String? | Facility description |
| `capacity` | Int | Total bed capacity |
| `currentOccupancy` | Int | Current occupied beds |
| `careLevelsOffered` | CareLevel[] | Array of care levels supported |
| `amenities` | String[] | Facility amenities |
| `rating` | Float? | Facility rating (0-5) |
| `acceptsMedicare` | Boolean | Accepts Medicare |
| `acceptsMedicaid` | Boolean | Accepts Medicaid |
| `insuranceAccepted` | String[] | Other accepted insurance providers |
| `contactPerson` | String? | Primary contact name |
| `contactTitle` | String? | Contact person's title |
| `licenseNumber` | String? | License/certification number |
| `imageUrl` | String? | Primary facility image |
| `organizationId` | String | Owning organization |

**Relations:** Belongs to Organization. Has many Placements (as selected facility), FacilityMedia.

**Computed:** Availability = `capacity - currentOccupancy`. Occupancy is automatically recalculated when placements change.

---

### Placement

The core workflow entity tracking patient-to-facility placement from referral to completion.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `patientId` | String | Patient being placed |
| `socialWorkerId` | String? | Assigned social worker |
| `careLevel` | CareLevel | Required care level |
| `status` | PlacementStatus | Current workflow status |
| `priority` | Priority | Urgency level |
| `matchedFacilities` | String[] | Auto-scored facility IDs (top 5) |
| `selectedFacilityId` | String? | Chosen facility |
| `notes` | String? | Placement notes |
| `referralDate` | DateTime | When referral was made |
| `targetDate` | DateTime? | Target placement date |
| `completedDate` | DateTime? | Actual completion date |
| `preferredLocation` | String? | Preferred geographic area |
| `organizationId` | String | Owning organization |

**Relations:** Belongs to Organization, Patient, User (social worker), Facility (selected). 

**Side effects on status change:**
- Patient status is auto-synced (e.g., placement completed → patient marked as `DISCHARGED`)
- Facility occupancy is recalculated when a placement is completed or cancelled

---

### Hospital

Hospital details and branding for hospital-type organizations.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `name` | String | Hospital name |
| `address` | String? | Street address |
| `city` | String? | City |
| `state` | String? | State |
| `zipCode` | String? | ZIP code |
| `phone` | String? | Contact phone |
| `email` | String? | Contact email |
| `website` | String? | Website URL |
| `npi` | String? | National Provider Identifier |
| `imageUrl` | String? | Hospital photo (S3) |
| `logoUrl` | String? | Hospital logo (S3) |
| `organizationId` | String | Owning organization |

**Relations:** Belongs to Organization.

---

### FacilityMedia

Media attachments (images, videos, 3D scans) for facilities, stored in S3.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `facilityId` | String | Parent facility |
| `type` | MediaType | `IMAGE`, `GAUSSIAN_SPLAT`, or `VIDEO` |
| `key` | String | S3 object key |
| `url` | String | Public access URL |
| `thumbnailUrl` | String? | Thumbnail URL (images) |
| `fileSize` | Int? | File size in bytes |
| `mimeType` | String? | MIME type |
| `width` | Int? | Image/video width |
| `height` | Int? | Image/video height |
| `displayOrder` | Int | Sort order (default 0) |

**Relations:** Belongs to Facility.

---

### PatientDocument

Document attachments for patients (medical records, insurance forms, etc.), stored in S3.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `patientId` | String | Parent patient |
| `name` | String | Document display name |
| `key` | String | S3 object key |
| `url` | String | Public access URL |
| `fileSize` | Int? | File size in bytes |
| `mimeType` | String? | MIME type |
| `category` | String? | Document category |
| `uploadedById` | String? | User who uploaded |

**Relations:** Belongs to Patient and User (uploader).

---

### ActivityEvent

Audit trail of significant actions in the system.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `type` | ActivityType | Event type |
| `title` | String | Short description |
| `description` | String? | Detailed description |
| `patientId` | String? | Related patient |
| `userId` | String? | User who triggered the event |
| `organizationId` | String | Organization scope |
| `timestamp` | DateTime | When the event occurred |

**Relations:** Belongs to Organization, Patient, User.

---

### InviteCode

Reusable codes for joining an organization.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `code` | String (unique) | The invite code string |
| `organizationId` | String | Target organization |
| `createdById` | String | User who created the code |
| `role` | UserRole? | Role assigned on join (optional) |
| `maxUses` | Int? | Usage limit (null = unlimited) |
| `usedCount` | Int | Current usage count |
| `expiresAt` | DateTime? | Expiration date (null = never) |
| `isActive` | Boolean | Can be disabled by admin |

**Relations:** Belongs to Organization and User (creator). Has many JoinRequests.

---

### JoinRequest

User requests to join an organization via an invite code.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `userId` | String | Requesting user |
| `organizationId` | String | Target organization |
| `inviteCodeId` | String? | Invite code used |
| `status` | JoinRequestStatus | `PENDING`, `APPROVED`, or `DENIED` |
| `requestedRole` | UserRole? | Requested role (from invite code) |
| `notes` | String? | Applicant notes |
| `reviewedById` | String? | Admin who reviewed |
| `reviewedAt` | DateTime? | Review timestamp |

**Relations:** Belongs to User (applicant), Organization, InviteCode, User (reviewer).

---

## Enums

### UserRole

| Value | Description |
|---|---|
| `SUPERADMIN` | Full platform access across all organizations |
| `ADMINISTRATOR` | Organization admin (hospital or facility) |
| `SOCIAL_WORKER` | Hospital social worker managing patients/placements |
| `DISCHARGE_PLANNER` | Coordinates patient discharge workflow |
| `FACILITY_COORDINATOR` | Manages facility-side placement operations |
| `CUSTOMER` | Limited external stakeholder access |

**Note:** The UI uses kebab-case (`social-worker`), while Prisma uses SCREAMING_SNAKE_CASE (`SOCIAL_WORKER`). Conversion functions exist in `src/lib/data-access.ts`.

### PatientStatus

| Value | Description |
|---|---|
| `PENDING` | Awaiting assessment or action |
| `ACTIVE` | Actively being managed |
| `PLACED` | Successfully placed in a facility |
| `DISCHARGED` | Discharged from the system |
| `INACTIVE` | No longer active (cancelled, etc.) |

### PlacementStatus

| Value | Description |
|---|---|
| `PENDING` | Placement request submitted |
| `MATCHED` | Facilities matched via algorithm |
| `REFERRAL_SENT` | Referral sent to selected facility |
| `UNDER_REVIEW` | Facility reviewing the referral |
| `ACCEPTED` | Facility accepted the patient |
| `REJECTED` | Facility rejected the referral |
| `COMPLETED` | Patient successfully placed |
| `CANCELLED` | Placement cancelled |

### CareLevel

| Value | Description |
|---|---|
| `SKILLED_NURSING` | 24-hour skilled nursing care |
| `ASSISTED_LIVING` | Assistance with daily activities |
| `MEMORY_CARE` | Specialized dementia/Alzheimer's care |
| `REHABILITATION` | Short-term rehabilitation services |
| `LONG_TERM_CARE` | Extended-stay nursing care |
| `HOME_HEALTH` | In-home healthcare services |
| `HOSPICE` | End-of-life comfort care |
| `INDEPENDENT_LIVING` | Minimal assistance senior living |

### FacilityType

| Value | Description |
|---|---|
| `SKILLED_NURSING_FACILITY` | Skilled nursing facility (SNF) |
| `ASSISTED_LIVING` | Assisted living community |
| `REHABILITATION_CENTER` | Inpatient rehabilitation |
| `MEMORY_CARE` | Memory care community |
| `LONG_TERM_CARE` | Long-term care facility |
| `HOME_HEALTH_AGENCY` | Home health service provider |

### OrganizationType

| Value | Description |
|---|---|
| `HOSPITAL` | Hospital or health system |
| `FACILITY` | Care facility or facility group |

### Priority

| Value | Description |
|---|---|
| `LOW` | Standard timeline |
| `MEDIUM` | Moderate urgency |
| `HIGH` | High priority |
| `URGENT` | Immediate attention required |

### ActivityType

| Value | Description |
|---|---|
| `PATIENT_CREATED` | New patient record created |
| `PATIENT_UPDATED` | Patient record modified |
| `PLACEMENT_CREATED` | New placement initiated |
| `PLACEMENT_UPDATED` | Placement status changed |
| `FACILITY_ADDED` | New facility added |
| `NOTE_ADDED` | Note added to a record |

### MediaType

| Value | Description |
|---|---|
| `IMAGE` | Standard image (JPEG, PNG, WebP, AVIF) |
| `GAUSSIAN_SPLAT` | 3D gaussian splat scan |
| `VIDEO` | Video file (MP4, WebM, QuickTime) |

### InsuranceType

| Value | Description |
|---|---|
| `MEDICARE` | Federal Medicare coverage |
| `MEDICAID` | State Medicaid coverage |
| `PRIVATE` | Private insurance |
| `SELF_PAY` | Self-pay / out of pocket |
| `OTHER` | Other insurance type |

### InsuranceStatus

| Value | Description |
|---|---|
| `VERIFIED` | Insurance verified and active |
| `PENDING` | Verification in progress |
| `DENIED` | Coverage denied |
| `EXPIRED` | Coverage expired |

---

## Multi-Tenancy

All data is isolated by organization:

1. Every query includes a `WHERE organizationId = ?` clause
2. The `getServerOrganization()` helper resolves the current user's org from their Clerk session
3. Superadmins bypass org filtering on read queries
4. Write operations always associate data with the user's organization
5. Cross-org reads are only permitted for the facility network search (`searchFacilities()`)

See [ADR-002](decisions/002-database-and-orm.md) for the full multi-tenancy design rationale.
