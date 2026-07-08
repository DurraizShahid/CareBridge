# CareBridge — Full System Audit

> Generated: 2026-07-09
> Scope: All source files under `src/`, Prisma schema, configuration, middleware, API routes, data layer, components, forms, auth, RBAC, media uploads, onboarding.

---

## Table of Contents

1. [Use Cases](#1-use-cases)
2. [Business Rules](#2-business-rules)
3. [Business Scenarios](#3-business-scenarios)
4. [Edge Cases](#4-edge-cases)
5. [Corner Cases](#5-corner-cases)
6. [Race Conditions](#6-race-conditions)
7. [Failure Scenarios](#7-failure-scenarios)
8. [Exception Scenarios](#8-exception-scenarios)
9. [Abuse Cases](#9-abuse-cases)
10. [Misuse Cases](#10-misuse-cases)

---

## 1. Use Cases

### 1.1 User Onboarding
| UC# | Description | Actors | Flow |
|-----|-------------|--------|------|
| UC-01 | New user signs up via Clerk | Unauthenticated user | Clerk sign-up → `/onboarding` page → select org type (hospital/facility) → create org or join via invite code |
| UC-02 | User joins org via invite code | Unauthenticated user with code | Enter invite code → validated via `/api/invite-codes/validate` → POST `/api/join-requests` → pending approval → admin approves via PATCH → user now linked to org |
| UC-03 | User creates new organization | Authenticated user (first-time) | Fill name/slug → POST `/api/onboarding/create-org` → org created in DB + Clerk metadata updated → user becomes admin/facility-coordinator |
| UC-04 | Admin creates invite codes | Admin/superadmin | POST `/api/invite-codes` → generates 10-char uppercase code → optionally sets role, max uses, expiration → share code with prospective members |

### 1.2 Patient Management
| UC# | Description | Actors | Flow |
|-----|-------------|--------|------|
| UC-05 | View patient list | Social worker, discharge planner, admin, superadmin | GET `/api/patients` → org-scoped list → displayed in dashboard |
| UC-06 | View single patient details | Any authorized role | GET `/api/patients/:id` → full patient profile including documents |
| UC-07 | Create patient record | Social worker, discharge planner, admin | POST `/api/patients` with demographics, medical info, insurance → patient created under org |
| UC-08 | Update patient record | Social worker, discharge planner, admin | PATCH `/api/patients/:id` → partial update |
| UC-09 | Delete patient record | Admin, superadmin, facility-coordinator | DELETE `/api/patients/:id` → blocks if active placements exist |
| UC-10 | Upload patient document | Social worker, discharge planner, admin | POST `/api/patients/:id/documents/upload` → presigned S3 URL → POST to S3 → POST `/api/patients/:id/documents` to save DB record |
| UC-11 | Delete patient document | Social worker, discharge planner, admin | DELETE `/api/patients/:id/documents/:docId` → deletes S3 object + DB record |

### 1.3 Facility Management
| UC# | Description | Actors | Flow |
|-----|-------------|--------|------|
| UC-12 | Browse facility network (cross-org) | Social worker, discharge planner | GET `/api/facilities` with search params → `searchFacilities()` searches across ALL orgs |
| UC-13 | View facility detail | Any authorized role | GET `/api/facilities/:id` → org-scoped, includes media |
| UC-14 | Create facility | Admin, superadmin, facility-coordinator | POST `/api/facilities` → facility created under org |
| UC-15 | Update facility | Admin, superadmin, facility-coordinator | PATCH `/api/facilities/:id` |
| UC-16 | Delete facility | Admin, superadmin (NOT facility-coordinator has no `facilities:delete`) | DELETE `/api/facilities/:id` → blocks if active placements reference it |
| UC-17 | Upload facility media (images, 3D tours, videos) | Facility-coordinator, admin | POST `/api/facilities/:id/media/upload` → presigned URL → POST to S3 → POST `/api/facilities/:id/media` to save |
| UC-18 | Delete facility media | Facility-coordinator, admin | DELETE `/api/facilities/:id/media/:mediaId` → deletes S3 object + DB record |

### 1.4 Placement Lifecycle
| UC# | Description | Actors | Flow |
|-----|-------------|--------|------|
| UC-19 | Create placement | Social worker, discharge planner | POST `/api/placements` → selects patient, social worker, optional facility → auto-computes matched facilities (scoring algorithm) → updates patient status |
| UC-20 | View placement list | Any authorized role | GET `/api/placements` → org-scoped |
| UC-21 | View placement detail | Any authorized role | GET `/api/placements/:id` |
| UC-22 | Update placement status | Social worker, discharge planner, admin | PATCH `/api/placements/:id` → status transitions → triggers patient status sync + facility occupancy recalculation |
| UC-23 | Approve placement | Admin, discharge planner, superadmin | PATCH with status=approved → requires `placements:approve` permission |
| UC-24 | Cancel placement | Social worker, discharge planner, admin | PATCH with status=cancelled + cancellation reason |
| UC-25 | Delete placement | Admin, superadmin | DELETE `/api/placements/:id` → placement removed |

### 1.5 Dashboard & Reporting
| UC# | Description | Actors | Flow |
|-----|-------------|--------|------|
| UC-26 | View main dashboard | All authorized users | GET dashboard stats → active patients, placements, pending assessments, available facilities |
| UC-27 | View facility dashboard | Facility-coordinator | Facility-specific KPIs: occupancy rate, pending referrals, average stay |
| UC-28 | View superadmin dashboard | Superadmin | Cross-org stats: total users, hospitals, facilities, placements, role distribution, monthly trends |
| UC-29 | View user list | Admin, superadmin | GET `/api/users` → org-scoped user management |
| UC-30 | View activity feed | All authorized roles | Recent activity events scoped to org |

### 1.6 User & Role Management
| UC# | Description | Actors | Flow |
|-----|-------------|--------|------|
| UC-31 | List users | Admin, superadmin | GET `/api/users` with role scoping |
| UC-32 | Manage roles (promote/demote) | Admin, superadmin | Requires `users:manage-roles` permission |
| UC-33 | Review join requests | Admin, superadmin | GET `/api/join-requests` → PATCH with approve/deny |
| UC-34 | Webhook: user created | Clerk → System | `user.created` → upsert user in DB → role from metadata or defaults to `customer` |
| UC-35 | Webhook: user updated | Clerk → System | `user.updated` → sync email, name, avatar, role to DB |
| UC-36 | Webhook: user deleted | Clerk → System | `user.deleted` → remove user from DB |
| UC-37 | Webhook: org created | Clerk → System | `organization.created` → create org in DB with type from metadata |
| UC-38 | Webhook: org updated | Clerk → System | `organization.updated` → sync name/slug |
| UC-39 | Webhook: org deleted | Clerk → System | `organization.deleted` → remove org from DB |

### 1.7 Authentication & Authorization
| UC# | Description | Actors | Flow |
|-----|-------------|--------|------|
| UC-40 | Sign in | Unauthenticated user | Clerk prebuilt sign-in page → session created |
| UC-41 | Sign up | New user | Clerk prebuilt sign-up page → user created in Clerk → webhook syncs to DB |
| UC-42 | Route protection | All authenticated users | Middleware checks `canRoleAccessRoute()` → redirects to fallback route if denied |
| UC-43 | Permission-based UI rendering | All authenticated users | `RequirePermission` / `RequireRole` components conditionally render UI elements |

---

## 2. Business Rules

### BR-1: Organization Scoping
- All data (patients, facilities, placements, users, hospitals) is scoped to an organization.
- Superadmin bypasses org scoping on all read/write operations.
- A user can belong to exactly one organization.
- `organizationId` is nullable on User but required on Patient, Facility, Placement.

### BR-2: Facility Matching Algorithm
- Facilities are scored on: availability + rating + waitlist time + location preference + insurance compatibility.
- Only facilities within the same organization are matched (hospital-side users see only their org's facilities for matching).
- Facility network browsing (`searchFacilities`) is cross-org — any facility in the DB can be discovered.
- A facility scoring -1 is excluded (doesn't match care level, has no availability, or doesn't accept patient's insurance).
- Top 5 matched facilities are stored.

### BR-3: Placement → Patient Status Sync
```
Placement Status          → Patient Status
──────────────────────────────────────────────────
completed / in-progress   → "placed"
approved / pending-approval → "ready-for-discharge"
assessment / searching / matching → "assessment-in-progress"
cancelled                 → null (no status change)
```

### BR-4: Placement Status Constraints
- A confirmed placement status (`approved`, `in-progress`, `completed`) requires a selected facility.
- Cancelling without a reason is allowed (field is optional in form display logic but stored in DB).
- Facility capacity is validated before confirming a placement (unless it's an existing active assignment to the same facility).

### BR-5: Occupancy Recalculation
- After any placement create/update, facility occupancy is recalculated.
- Active count = number of placements with `status = in_progress` for that facility.
- `hasAvailability` = `currentOccupancy < capacity`.

### BR-6: Delete Guards
- Cannot delete a patient with active (non-completed, non-cancelled) placements.
- Cannot delete a facility with active placements referencing it.
- Hospital deletion warns but does NOT block if users are still assigned.

### BR-7: Role Hierarchy & Permissions
| Role | Max Permissions Granted |
|------|------------------------|
| superadmin | Everything (26 permissions across all resources) |
| administrator | Patients CRUD, placements CRUD+approve, hospitals manage, users R+create+update, settings, dashboard |
| social-worker | Patients R+create+update, placements R+create+update, read-org users, dashboard |
| discharge-planner | Patients R+create+update, placements R+create+update+approve, read-org users, dashboard |
| facility-coordinator | Patients R+create+update+delete, placements full, facilities R+create+update, users R+create+update, dashboard+facility dashboard, settings |
| customer | Patients read, placements read, dashboard overview |

### BR-8: Organization Type Constraints
- Hospital-type orgs get roles: `social-worker`, `discharge-planner`, `administrator`.
- Facility-type orgs get role: `facility-coordinator`.
- Platform roles available across all types: `superadmin`, `customer`.
- Org type is derived from role unless overridden in Clerk metadata.

### BR-9: Invite Code Rules
- Codes are 10-char uppercase alphanumeric (generated from UUID).
- Codes can have optional expiration date (must be in the future).
- Codes can have optional max uses (1-10000).
- Codes are marked inactive (`isActive = false`) but never physically deleted.
- Used count is incremented when join request is approved.
- A user can have at most one join request (unique constraint on `userId` in `JoinRequest`).

### BR-10: Insurance Compatibility
- Insurance matching uses substring comparison on normalized terms.
- If patient insurance mentions "medicare", facility must `acceptsMedicare`.
- If patient insurance mentions "medicaid", facility must `acceptsMedicaid`.
- If no insurance terms are extractable, all facilities are considered accepting.
- Otherwise, checks `insuranceAccepted` array for substring overlap.

### BR-11: S3 Upload Rules
- Patient documents: max 50 MB, allowed MIME types limited to PDF, DOC, DOCX, TXT, CSV, JPEG, PNG, WebP.
- Facility images: max 10 MB, types JPEG/PNG/WebP/AVIF.
- Facility 3D tours (gaussian_splat): max 500 MB, types octet-stream/PLY/SPZ.
- Facility videos: max 500 MB, types MP4/WebM/MOV.
- Presigned URLs expire in 1 hour.

### BR-12: Route Protection Logic
- Public routes: `/`, `/sign-in/*`, `/sign-up/*`, `/onboarding/*`, `/api/webhooks/*`.
- All other routes require authentication.
- Permission-based route access defined in `ROUTE_ACCESS` map.
- Dashboard sub-routes checked via client-side `DashboardGuard`.

---

## 3. Business Scenarios

### BS-01: Happy Path — Full Placement Cycle
1. Patient admitted to hospital → created in system by social worker
2. Social worker initiates placement → sets care level, preferred location
3. System auto-computes matched facilities (top 5 by score)
4. Discharge planner reviews matches → approves placement
5. Placement confirmed at selected facility → patient status → "placed"
6. Facility occupancy updated → start date set → patient admitted
7. Stay completed → placement marked completed → patient discharged

### BS-02: Emergency Placement
1. Patient requires urgent placement → priority set to "emergency"
2. System bypasses normal scoring emphasis → availability and speed weighted higher
3. Approval workflow may be fast-tracked by superadmin or admin

### BS-03: Multi-tenant Isolation Failure
1. User from Hospital A searches facilities → only sees Hospital A's facilities
2. If something bypasses org scoping, Hospital A user sees Hospital B's internal data
3. `searchFacilities()` is intentionally cross-org for network browsing — risks data leakage

### BS-04: Org Onboarding with Invite + Approval
1. Org admin creates invite code with role=social-worker, maxUses=5, expires=30 days
2. New user signs up → enters invite code → code validated → join request created (pending)
3. Admin reviews join request → approves → user is linked to org with social-worker role
4. Invite code `usedCount` incremented
5. If code expires or hits max uses before approval, approval is rejected at PATCH time

### BS-05: Facility Capacity Oversubscription
1. Facility has 10 beds, 8 occupied, 2 available
2. Two placements simultaneously approved for the same facility in separate transactions
3. Both succeed → facility shows 10/10 occupancy → no oversubscription because `recalculateFacilityOccupancy` recalculates after each

### BS-06: Cross-Organization Facility Network Browsing
1. Hospital A social worker searches for "memory care in Portland"
2. `searchFacilities()` returns facilities from ALL organizations
3. Social worker views facility detail via `getFacilityById()` (no org scoping)
4. But cannot create a placement linking to a cross-org facility because `validatePlacementReferences` enforces org scoping

### BS-07: Failed Insurance Pre-Authorization
1. Placement created with `insurancePreAuthorized = false`
2. Facility matching algorithm still considers insurance compatibility
3. At approval time, pre-authorization status is NOT enforced (it's a data field, not a gate)
4. Placement can be approved without insurance pre-authorization

### BS-08: Multi-role User Attempt
1. A user has `organizationId = OrgA` and attempts to access OrgB's data
2. All queries include `organizationId` filter (unless superadmin)
3. Access is denied — user only sees OrgA data

---

## 4. Edge Cases

### EC-01: Empty Field Values
- **Empty `organizationId` on User**: `organizationId` is nullable. Queries where `organizationId = ""` may match zero records or behave unpredictably (empty string != null). In `getUsers()`, `organizationId` defaults to `""` when null.
- **Empty `facilityId` on Placement**: Various code paths check `facilityId ?? undefined`. A placement can exist without a facility.
- **Empty `phone` / `email`**: Not validated for format; users could enter garbage.
- **Empty `description` on Facility**: Explicitly handled with `?? undefined` in all mappings.
- **Empty `notes` on Patient/Placement**: Defaults to empty string in Prisma schema.

### EC-02: Date-Related Edge Cases
- **31 Dec / 1 Jan boundary**: `startOfMonth()` creates dates that may cross year boundaries. Month-by-month stats use `addMonths()` which handles this correctly.
- **Leap year (Feb 29)**: `addMonths()` with months=1 from Jan 31 gives Feb 28 (or Feb 29 in leap year) — JavaScript `Date` handles this automatically but could produce unexpected aggregates.
- **Future discharge dates**: `estimatedDischargeDate` can be in the past at creation time with no validation.
- **Past admission dates**: No guard against admitting a patient before they were born or before the system existed.
- **Date of birth in the future**: Patient age is computed from DOB using `Date.now()` in the form — but only at form entry time. Server does not re-validate age.

### EC-03: Numeric Edge Cases
- **Zero capacity facility**: `occupancyRate = Math.round(x / 0 * 100)` → returns `NaN` if capacity is 0. Protected by `capacity > 0` check in `getFacilityDashboardStats()` but not elsewhere.
- **Negative ratings**: Form allows min=0, but no server-side validation of rating range (0-5).
- **Zero waitlist days**: Value 0 is stored and displayed correctly. But `waitlistDays ?? 0` means null → 0, which may conflate "no waitlist" with "0-day waitlist".
- **Integer overflow**: There's no protection against excessively large integers for `capacity`, `currentOccupancy`, `maxUses > 10000` (though frontend enforces max 10000 for invite codes).

### EC-04: String Edge Cases
- **MRN uniqueness**: MRN has `@unique` constraint in Prisma. Attempting to create a patient with a duplicate MRN will throw a Prisma unique constraint error, which is currently unhandled (returns generic 500).
- **Email uniqueness**: `User.email` has `@unique` constraint. Two users from different orgs cannot share an email in the DB, but Clerk at the auth layer already enforces email uniqueness.
- **Slug uniqueness**: `Organization.slug` has `@unique` constraint. Slug validation happens at creation but not at update (webhook `organization.updated` uses upsert which would fail on unique slug changes).
- **Very long strings**: `safeFileName` slices to 120 chars. No length constraints elsewhere on name fields.

### EC-05: Media Upload Edge Cases
- **Upload to S3 succeeds but DB record creation fails**: The file sits in S3 as an orphan. No cleanup mechanism exists.
- **DB record created but upload fails**: The presigned URL creation succeeds but the actual file upload fails. The DB record is never created (DB record creation happens after upload in the client flow), but the presigned URL is consumed (one-time use).
- **File with no extension**: `fileName` may not have an extension; MIME type detection relies on the client-provided `contentType`.
- **0-byte file**: Allowed by S3 presigned conditions (`content-length-range: 1, MAX_SIZE` — minimum 1 byte).
- **Exact MAX_SIZE file**: S3 condition is `[content-length-range, 1, MAX_SIZE]` which is inclusive on both ends.

### EC-06: Invite Code Edge Cases
- **Invite code expiration race**: Code is validated at join request creation time AND at approval time. If code expires between create and approval, the approval handler catches it.
- **maxUses reached between create and approve**: Same as above — two-phase validation protects against this.
- **Duplicate invite code generation**: `generateUniqueInviteCode()` retries up to 5 times. On 5th failure, throws error. With UUID-based 10-char codes and 5 retries, collision is astronomically unlikely but not impossible.
- **Self-invite**: A user could theoretically invite themselves by entering their own invite code.

### EC-07: Webhook Edge Cases
- **Webhook arrives before DB is seeded**: `user.created` handler gracefully handles missing organization references by reading from metadata.
- **Duplicate webhook delivery**: Clerk may deliver webhooks more than once. `upsert` is used for idempotency on user and org creates/updates, but `user.deleted` uses `delete` which would throw on a second delivery (caught and logged).
- **Webhook out of order**: `organization.deleted` may arrive before all related entities are cleaned up. The DB cascade is NOT defined for Organization deletion — this would fail with foreign key violations.
- **Unknown event type**: Logged and ignored with a 200 response.

### EC-08: Clerk Metadata Edge Cases
- **Missing public_metadata**: `resolveRole()` returns null, then `resolveRole()` with no candidates falls back to dev mode `superadmin` or production `customer`.
- **Corrupted metadata type**: Metadata may contain non-string values for `role`. The code checks `typeof metadata.role === "string"`.
- **Metadata not yet synced**: After org creation, the Clerk metadata update is a separate call. If it fails, the user's metadata won't reflect the new org until the next webhook sync.

### EC-09: Organization Deletion Cascade
- There is **NO `onDelete: Cascade`** on Organization in the Prisma schema for any of its related models (User, Patient, Facility, Placement, etc.).
- Deleting an Organization from Clerk via webhook will fail at the Prisma level if any related records exist.
- No soft-delete mechanism exists — deletions are hard deletes.

### EC-10: User Deletion
- `User` model has `@relation` fields pointing to it from Patient, Placement, ActivityEvent, InviteCode, JoinRequest.
- Deleting a user with existing records referring to `socialWorkerId` will fail due to foreign key constraints.
- Clerk webhook `user.deleted` wraps in try/catch but there's no cascade or reassignment strategy.

### EC-11: JSON Fields Edge Cases
- `Patient.address`, `Patient.emergencyContact`, `Patient.insurance`, `Facility.address`, `Facility.contacts`, `Placement.preferredLocation`, `Hospital.address` are all `Json` type in Prisma.
- There is **no schema validation** on JSON fields — any arbitrary JSON can be stored.
- `insurance: Json` vs typed `Insurance[]` — the form sends `Insurance[]` objects but stored as raw JSON. Code in `getPatientInsuranceTerms()` casts to array of objects without validation.

---

## 5. Corner Cases

### CC-01: User is Org Creator AND Member of Another Org
- A user's `organizationId` is set during onboarding (create org or join org).
- A user cannot be in two orgs (no many-to-many relation).
- When a user creates an org and later tries to join another, the join request is created but the `OrganizationProvider` still points to the original org.

### CC-02: Facility Coordinator Managing Patients Across Multiple Hospitals
- Facility coordinators can read/create/update/delete patients within their org.
- Patients are linked to a specific `hospitalId`, but facility coordinators operate at the org level.
- A facility coordinator may see patients from all hospitals within their org.

### CC-03: Placement Re-Assignment to Different Facility
- Updating a placement to a different facility triggers:
  1. Old facility occupancy recalculation
  2. New facility capacity/availability validation
  3. New facility occupancy recalculation
- These happen in a transaction, so partial failure is prevented.

### CC-04: Completed Placement with Past Dates
- A placement can be created with `completedDate` before `startDate` — no cross-date validation.
- `averageDays()` would compute a negative duration, which is filtered out by `value >= 0` check in the filter. So negative duration placements are silently excluded from averages.

### CC-05: Insurance List Containing Both "medicare" and "medicaid"
- `facilityAcceptsPatientInsurance()` checks for "medicare" first. If found, returns `facility.acceptsMedicare`.
- For a patient with both Medicare and Medicaid, the facility must accept BOTH but the code only checks Medicare.

### CC-06: Default Role Assignment on Org Creation
- For hospital org: assigned `administrator` role.
- For facility org: assigned `facility-coordinator` role.
- The creator is automatically the highest role for that org type.
- No way to create an org with a different role assignment on creation.

### CC-07: `searchFacilities()` Without Any Filters
- Returns up to 50 facilities ordered by rating descending, then name ascending.
- No org scoping — returns facilities from ALL organizations.
- This is intentional for network browsing but means a hospital user sees all facilities system-wide.

### CC-08: Multiple Active Placements for Same Patient
- The schema allows a patient to have multiple placements.
- Patient status sync from placement status could overwrite to conflicting states.
- No guard prevents creating a second active placement for an already-placed patient.

### CC-09: Auth Session Expiry Mid-Form
- Forms use `fetch()` directly to API routes.
- If the Clerk session expires while filling out a long form, the API call will return 401.
- Forms show a generic error message, not a session-expired-specific message.
- No automatic redirect to sign-in or token refresh logic.

### CC-10: Development Mode Mock Fallback
- In `NODE_ENV=development`, `getServerOrganization()` falls back to `org-001` if no org context is found.
- In `getFallbackRole()`, dev mode returns `superadmin`.
- This means in development, ANY authenticated user gets superadmin access to seed data, masking auth/permission bugs.

---

## 6. Race Conditions

### RC-01: Concurrent Placement Approvals for Same Facility
- Two approve operations for the same facility run in separate transactions.
- Both validate capacity → both pass → both commit → occupancy overshoots capacity.
- `recalculateFacilityOccupancy()` runs after each transaction but the serial isolation level of PostgreSQL (default Read Committed) allows both to read old `currentOccupancy` simultaneously.

### RC-02: Concurrent Patient Deletion and Placement Creation
- A patient deletion checks for active placements before deleting.
- If a placement is created between the check and the delete, the deletion proceeds and the orphaned placement fails on FK constraint.

### RC-03: Invite Code Used Count Increment
- Two users submit join requests with the same invite code simultaneously.
- Both pass the `usedCount < maxUses` check → both create join requests → but only one approval increments the counter.
- At approval time, the second approval is still allowed (no re-validation of total used count).

### RC-04: Webhook Delivery Race with User Interaction
- Clerk sends `user.created` webhook → DB user record created.
- Simultaneously, user fills onboarding form → tries to create org.
- `prisma.user.upsert()` handles the race safely in `create-org` route.
- But the webhandler may overwrite user metadata that the org creation handler just set.

### RC-05: Clerk Metadata Update vs. Webhook Sync
- Org creation handler updates Clerk metadata with `organizationId`, `organizationType`, `role`.
- Webhook `user.updated` may fire moments later with stale metadata.
- The webhook's `resolveRole()` and `resolveOrganizationId()` read metadata from the event payload, which may not yet include the just-set values.

### RC-06: S3 Presigned URL Consumption
- Two uploads with the same key (impossible due to UUID in key, but theoretically possible if client reuses a response).
- S3 guarantees that if the presigned POST conditions are met, the upload succeeds.
- The `key` includes `crypto.randomUUID()` so collision is negligible.

---

## 7. Failure Scenarios

### FS-01: Database Connection Failure
- **Impact**: All API routes return 500 with "Internal server error".
- **Clerk auth still works**, so users can sign in but see no data.
- Prisma connection pool exhaustion would cause cascading failures across all operations.

### FS-02: S3 Outage
- **Upload failure**: Document and media uploads fail. Error caught and reported to user.
- **Download failure**: Previously uploaded documents/media still reference S3 URLs. If S3 is down, images and documents fail to load client-side.
- **Presigned URL generation**: If S3 endpoint is unreachable, the upload pre-signed URL generation fails.

### FS-03: Clerk Outage
- **Authentication**: New users cannot sign in or sign up.
- **Middleware**: `auth.protect()` may fail, blocking all routes.
- **Webhooks**: No user/org lifecycle events are delivered → DB falls out of sync.
- **Existing sessions**: If Clerk session tokens are cached, existing users may continue working until tokens expire.

### FS-04: Prisma Migrations Not Applied
- The project uses `prisma db push` (no migration files found).
- Schema changes may not be reflected in the database.
- Queries fail with column-not-found or table-not-found errors.

### FS-05: Environment Variables Missing
- `DATABASE_URL` missing → Prisma client initialization fails → entire app crashes on first DB access.
- `S3_*` variables missing → S3 upload routes fail with explicit error. But non-upload routes still work.
- `CLERK_*` variables missing → Clerk middleware/API fail → auth is broken.

### FS-06: Large Payload Rejection
- No explicit request body size limit in API routes.
- Next.js default body size limit (4 MB) applies — larger JSON bodies are rejected.
- S3 uploads bypass this via presigned POST (direct to S3).

### FS-07: Invite Code Generation Exhaustion
- `generateUniqueInviteCode()` retries 5 times max.
- If all 5 attempts produce colliding codes (extremely unlikely), throws "Could not generate a unique invite code."
- User receives generic 500 error.

### FS-08: Hospital Deletion with Orphaned References
- Deleting a hospital sets users' `hospitalId` to a non-existent hospital ID.
- No cascade, no reassign, no nullification.
- `hospitalId` on User becomes a dangling reference.

### FS-09: Placement Creation with Non-existent References
- `validatePlacementReferences()` validates patient, social worker, and facility exist.
- If one of these is deleted between the API route's auth check and the transaction, `findFirst` returns null and a `DataAccessError` (400) is thrown.

### FS-10: Database Constraint Violations
- Unique constraint on `User.email` — if Clerk somehow creates a user with an email that already exists in the DB, the upsert fails.
- Unique constraint on `Patient.mrn` — if MRN is duplicated, `createPatient` throws an unhandled Prisma error → 500.

---

## 8. Exception Scenarios

### ES-01: Unhandled Prisma Errors
- `createPatient`, `updatePatient`, `createFacility`, etc. do NOT catch Prisma-specific errors (unique constraint violations, FK violations, connection errors).
- These propagate as generic 500 responses with no useful error information.
- The only exception is `getServerOrganization()` which has a bare `catch {}` block.

### ES-02: `crypto.randomUUID()` Unavailable
- `crypto.randomUUID()` is used extensively for ID generation.
- In older Node.js versions or non-secure contexts, this could throw.
- No fallback ID generation strategy exists.

### ES-03: `localStorage` Unavailable
- Facility form uses `localStorage` for draft persistence.
- In incognito mode with 3rd-party cookies blocked, `localStorage` may throw.
- Caught with empty catch blocks.

### ES-04: JSON Parse Failure on Request Body
- `req.json()` in API routes can throw `SyntaxError` if the body is malformed.
- Thrown error is caught by the generic catch block → 500 response.
- No specific 400 Bad Request for malformed JSON.

### ES-05: TypeScript `as any` Casts
- Throughout `data-access.ts`, extensive use of `as any` for enum conversions (e.g., `kebabToSnake(data.type) as any`).
- If an unexpected value is passed, Prisma may reject it or store a garbage value.
- The type system provides no safety guarantees at runtime.

### ES-06: Number → String Coercion
- `estimatedCost` is stored as `Float?` in Prisma but sent as a string from the form (`form.estimatedCost`).
- Converted via `Number(form.estimatedCost)` — if the string is non-numeric, `Number()` returns `NaN`, which Prisma may reject.
- Similar issue: `preferredLocationMaxDistance` uses `Number(e.target.value)`.

### ES-07: Facility Creation Race in Form
- `createdFacilityId` state is set after the facility is created but before the user navigates.
- If the user refreshes before navigating, they lose the new facility ID and see the form again.
- The facility was created (stored in DB) but the user must navigate back to find it.

### ES-08: Placement Form with No Facilities
- If an org has no facilities, the facility dropdown in the placement form is empty.
- The "None (TBD)" option is still available, so placement can proceed.
- But matched facilities computation would return an empty list.

---

## 9. Abuse Cases

### AC-01: Rate Limit Abuse — API Endpoints
- No rate limiting exists on any API endpoint.
- An attacker could:
  - Flood `POST /api/patients` to exhaust DB storage
  - Flood S3 upload endpoints to incur cloud storage costs
  - Flood `POST /api/invite-codes` to generate thousands of codes
  - Flood invite code validation to enumerate valid codes

### AC-02: Invite Code Enumeration
- `GET /api/invite-codes/validate?code=XXXXX` tells whether a code is valid.
- An attacker could brute-force 10-char codes (though 10-char alphanumeric uppercase is 36^10 ≈ 3.6 quadrillion combinations — computationally infeasible).
- More importantly, the endpoint leaks organization name/slug/type for valid codes.

### AC-03: S3 Direct Upload Abuse
- Presigned POST URLs allow uploads up to 500 MB without re-authentication.
- If a presigned URL is intercepted (e.g., logged in browser dev tools), an attacker can:
  - Upload malicious files (malware, executables) to the S3 bucket
  - Overwrite existing files (though key contains UUID, making targeted overwrite difficult)
  - Upload files larger than allowed (S3 conditions enforce content-length-range, so this is prevented)

### AC-04: Cross-Organization Data Access via Facility Network
- `searchFacilities()` returns facilities from ALL organizations.
- `getFacilityById()` has no org scoping at all.
- Malicious users can enumerate all facilities in the system by searching without filters.
- Facility details (address, phone, email, capacity, occupancy, insurance contracts) are exposed.

### AC-05: Role Escalation via Direct API Calls
- API routes check permissions via `roleHasPermission()` but the user's role is derived from:
  1. DB `User.role` (queried by `getServerOrganization()`)
  2. Clerk metadata (fallback)
  3. Dev mode fallback (superadmin)
- If a user can manipulate their Clerk metadata (e.g., via browser dev tools modifying session claims — unlikely with Clerk's signed JWTs), they could escalate.
- The proxy middleware also resolves role from session claims, providing defense-in-depth.

### AC-06: Privilege Escalation via User ID Manipulation
- All API routes use the authenticated user's ID from Clerk for all operations.
- There is no endpoint where a user can supply a `userId` to impersonate another user.
- `createPatientDocument()` validates uploader belongs to the same org as the patient, preventing cross-org document uploads.

### AC-07: Mass Data Extraction
- `GET` endpoints for lists (patients, facilities, placements, users, hospitals) have no pagination.
- An authorized user could extract all records from their org in one request.
- This could lead to data exfiltration if a user's account is compromised.

### AC-08: Stale Session After Role Change
- When a user's role is changed (via admin action or join request approval), their Clerk metadata is updated.
- Existing session tokens may still contain old role claims until the token expires or is refreshed.
- The user could retain elevated privileges until their next sign-in.

### AC-09: Unauthorized Document Deletion
- `DELETE /api/patients/:id/documents/:documentId` checks `patients:update` permission.
- A social worker with `patients:update` can delete any document attached to any patient in their org, regardless of who uploaded it.

### AC-10: Self-Service Role Promotion
- There is no endpoint that allows a user to directly promote themselves.
- However, a user could:
  - Create an org (becoming admin/facility-coordinator) even if they already belong to another org — the system doesn't check for existing org membership at org creation time.
  - The `onboarding` page checks `/api/me` for `organizationId` and redirects to `/dashboard` if found — but this is client-side only and can be bypassed by calling the API directly.

### AC-11: Webhook Spoofing
- Clerk webhooks are verified via `verifyWebhook()` using Clerk's signing secret.
- Without the signing secret, an attacker cannot spoof webhooks.
- If the signing secret is exposed, an attacker could create/delete/modify users and orgs at will.

---

## 10. Misuse Cases

### MC-01: Social Worker Assigning Themselves as Social Worker
- A social worker creates a placement and sets `socialWorkerId` to their own ID.
- No guard prevents self-assignment. This is arguably correct behavior (they manage their own patients).

### MC-02: Creating Placement Without Insurance Pre-Authorization
- The `insurancePreAuthorized` field defaults to `false`.
- There's no enforcement that insurance must be pre-authorized before a placement is approved/confirmed.
- A placement could proceed to "in-progress" without confirmed insurance coverage.

### MC-03: Facility Coordinator Deleting Patient Records
- Facility coordinators have `patients:delete` permission (per the RBAC definition).
- They could delete patient records that belong to hospitals, potentially losing audit trail.
- This may be intentional but carries risk.

### MC-04: Overriding Computed Matched Facilities
- The placement form allows setting `selectedFacilityId` directly.
- The auto-computed `matchedFacilities` list can be overridden by providing a `matchedFacilities` array in the API call.
- A user could cherry-pick facilities that don't match the patient's needs.

### MC-05: Creating a Facility with Inflated Ratings
- Rating and reviewsCount are user-submitted fields with no server-side validation.
- A facility coordinator could inflate their facility's rating to 5.0 with 9999 reviews.

### MC-06: Using the Same Invite Code for Multiple Accounts
- The `JoinRequest` model has a **unique constraint on `userId`** — not on `inviteCodeId`.
- A single invite code can be used by multiple different users (up to `maxUses`).
- This is intentional design but can be misused if an invite code is shared publicly.

### MC-07: Bypassing Org Selection on Onboarding
- The onboarding page allows selecting org type (hospital/facility) before creating.
- If a user creates a hospital but intended a facility, there's no way to change the org type later.
- The org type is stored in Clerk metadata and the database — no PATCH endpoint exists for it.

### MC-08: Medical Record Number (MRN) Collision Across Orgs
- MRN is globally unique (`@unique` on `Patient.mrn`), not org-scoped.
- Two different hospitals in the same system cannot admit a patient with the same MRN.
- This may be incorrect — MRNs are typically unique within a hospital, not globally.

### MC-09: Deleting S3 Objects Without DB Cleanup
- The document/media delete endpoints delete S3 objects first, then DB records.
- If the S3 delete succeeds but the DB delete fails (e.g., FK constraint), the file is deleted but the DB record remains as a dangling reference.
- Similarly, if the media list API returns records whose S3 files have been manually deleted, the frontend shows broken images.

### MC-10: Fetch API Without Error Handling for Network Failures
- All forms use `fetch()` with try/catch that sets a generic error message.
- Network failures (offline, DNS failure, connection refused) all produce the same "Something went wrong" message.
- No retry logic, no offline detection, no request queuing.

### MC-11: Mixed kebab-case / snake_case Enum Usage
- The codebase frequently converts between kebab-case (TypeScript types) and snake_case (Prisma enums).
- The `toCareLevel()`, `toPatientStatus()`, `toPlacementStatus()` etc. functions simply cast via `str.replace(/_/g, "-")` — they perform NO validation that the string is a valid enum value.
- An invalid value like `invalid-value` would be silently passed through as a valid CareLevel.

### MC-12: Missing Input Validation on API Routes
- Most POST/PATCH endpoints accept raw JSON and pass it directly to the data layer.
- There's no Zod, Yup, or any schema validation library in use.
- Malformed or missing fields produce Prisma errors (500) or `DataAccessError` (400).
- No field-level validation errors are returned to the client.

### MC-13: No Pagination on List Endpoints
- All list endpoints (`GET /api/patients`, `/api/placements`, `/api/facilities`, `/api/users`, `/api/hospitals`) return ALL records unfiltered.
- Without LIMIT/OFFSET or cursor-based pagination, an org with thousands of patients will experience severe performance degradation.
- `searchFacilities()` has `take: 50` but other endpoints have no limit.

### MC-14: Activity Events Never Created
- The `ActivityEvent` model exists in the schema with no code that creates activity events.
- The mock data includes activity events for development, but no production code writes to the `ActivityEvent` table.
- The activity feed will always be empty in production.

### MC-15: Dashboard Stats Computation Performance
- `getSuperAdminDashboardStats()` runs 10+ separate COUNT queries and a `groupBy` across all tables.
- On large datasets this will be extremely slow.
- No caching or materialized views are used.

### MC-16: No Soft Delete
- All deletions are hard deletes (physical row removal).
- Accidentally deleted patients, placements, facilities, or hospitals cannot be recovered.
- No audit log captures who deleted what or when.

### MC-17: Hospital NPI Field Not Validated
- Hospital NPI (National Provider Identifier) is a free-text field with no format validation.
- NPIs are 10-digit numbers — invalid values could be stored.

### MC-18: Browser Autocomplete and Form State
- Browser autocomplete on address/name fields may not trigger React's `onChange` in all browsers.
- `localStorage` draft restoration runs once on mount. If autocomplete fires later, the restored draft is stale.

---

## Summary of Critical Findings

| Severity | Count | Examples |
|----------|-------|---------|
| **Critical** | 8 | No input validation, no rate limiting, no pagination, race conditions on capacity, MRN global uniqueness, no activity event creation, no cascade on org delete, dev mode superadmin fallback |
| **High** | 12 | S3 orphan files, cross-org data exposure via facility search, hard deletes with no recovery, JSON fields without schema, stale session claims, no date validation, unhandled Prisma errors |
| **Medium** | 15 | Missing loading/empty states, client-side-only check bypassable, no offline support, localStorage not always available, NaN from string-to-number conversions, negative rating, no field-level API errors |
| **Low** | 20 | Generic error messages, missing retry logic, browser autocomplete issues, no email/phone format validation, no MRN + org composite key, no org type PATCH endpoint |
