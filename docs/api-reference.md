# CareBridge API Reference

All API routes are under `/api/`. Unless noted otherwise, routes require Clerk authentication and organization context.

## Authentication Patterns

The API uses three auth patterns:

| Pattern | Usage | Description |
|---|---|---|
| **Clerk + Org Context** | Most CRUD routes | `auth()` for userId, `getServerOrganization()` for org, then `roleHasPermission()` for writes |
| **`requireOrgPermission()`** | Invite codes, join requests, hospitals | Combined auth + org + permission check in one call |
| **Public** | Invite code validation only | No authentication required |

All write operations check RBAC permissions via `src/lib/permissions.ts`. Superadmins bypass org-scoping on read queries.

---

## User & Profile

### `GET /api/me`

Returns the current authenticated user's profile by merging Clerk session data with the local database record.

- **Auth:** Clerk (any authenticated user)
- **Permission:** None
- **Response:** `{ id, role, organizationId, firstName, lastName, email, imageUrl }` or `null` if user not found in DB

---

## Patients

### `GET /api/patients`

Returns all patients scoped to the user's organization.

- **Auth:** Clerk + org context
- **Permission:** None (read access for all org members)
- **Response:** `Patient[]`

### `POST /api/patients`

Creates a new patient record.

- **Auth:** Clerk + org context
- **Permission:** `patients:create`
- **Request Body:** Patient fields (firstName, lastName, dateOfBirth, mrn, etc.)
- **Response:** `201` with created `Patient`

### `GET /api/patients/[id]`

Returns a single patient with their documents.

- **Auth:** Clerk + org context
- **Permission:** None
- **Response:** `Patient` (includes `documents[]`) or `404`

### `PATCH /api/patients/[id]`

Updates an existing patient.

- **Auth:** Clerk + org context
- **Permission:** `patients:update`
- **Request Body:** Partial patient fields
- **Response:** Updated `Patient` or `404`

### `DELETE /api/patients/[id]`

Deletes a patient. Blocked if the patient has active placements.

- **Auth:** Clerk + org context
- **Permission:** `patients:delete`
- **Response:** `{ success: true }` or `409` if active placements exist

---

## Patient Documents

### `GET /api/patients/[id]/documents`

Returns all documents for a patient.

- **Auth:** Clerk + org context
- **Permission:** `patients:read`
- **Response:** `PatientDocument[]`

### `POST /api/patients/[id]/documents`

Creates a document metadata record (after file is uploaded to S3).

- **Auth:** Clerk + org context
- **Permission:** `patients:update`
- **Request Body:** `{ name, key, url, fileSize?, mimeType?, category? }`
- **Response:** `201` with created `PatientDocument`

### `POST /api/patients/[id]/documents/upload`

Generates an S3 presigned POST URL for uploading a patient document.

- **Auth:** Clerk + org context
- **Permission:** `patients:update`
- **Request Body:** `{ fileName, contentType }`
- **Allowed types:** PDF, JPEG, PNG, WebP, DOC, DOCX, TXT, CSV (max 50MB)
- **Response:** `{ url, fields, key }` (presigned S3 POST data)
- **S3 key format:** `patients/{patientId}/documents/{uuid}-{fileName}`

### `DELETE /api/patients/[id]/documents/[documentId]`

Deletes a patient document from both S3 storage and the database.

- **Auth:** Clerk + org context
- **Permission:** `patients:update`
- **Response:** `{ success: true }` or `404` if document not found

---

## Facilities

### `GET /api/facilities`

Returns all facilities scoped to the user's organization.

- **Auth:** Clerk + org context
- **Permission:** None
- **Response:** `Facility[]`

### `POST /api/facilities`

Creates a new facility.

- **Auth:** Clerk + org context
- **Permission:** `facilities:create`
- **Request Body:** Facility fields (name, type, address, capacity, careLevelsOffered, etc.)
- **Response:** `201` with created `Facility`

### `GET /api/facilities/[id]`

Returns a single facility by ID.

- **Auth:** Clerk + org context
- **Permission:** None
- **Response:** `Facility` or `404`

### `PATCH /api/facilities/[id]`

Updates an existing facility.

- **Auth:** Clerk + org context
- **Permission:** `facilities:update`
- **Request Body:** Partial facility fields
- **Response:** Updated `Facility` or `404`

### `DELETE /api/facilities/[id]`

Deletes a facility. Blocked if the facility has active placements.

- **Auth:** Clerk + org context
- **Permission:** `facilities:delete`
- **Response:** `{ success: true }` or `409` if active placements exist

---

## Facility Media

### `GET /api/facilities/[id]/media`

Returns all media (images, videos, gaussian splats) for a facility.

- **Auth:** Clerk (any authenticated user)
- **Permission:** None
- **Response:** `FacilityMedia[]`

### `POST /api/facilities/[id]/media`

Creates a media metadata record (after file is uploaded to S3).

- **Auth:** Clerk + org context (verifies facility belongs to user's org)
- **Permission:** None (org ownership is the guard)
- **Request Body:** `{ type, key, url, thumbnailUrl?, fileSize?, mimeType?, width?, height?, displayOrder? }`
- **Response:** `201` with created `FacilityMedia`

### `POST /api/facilities/[id]/media/upload`

Generates an S3 presigned POST URL for uploading facility media.

- **Auth:** Clerk + org context (verifies facility ownership)
- **Permission:** None (org ownership is the guard)
- **Request Body:** `{ fileName, contentType, mediaType }`
- **Media types and limits:**

| Media Type | Allowed MIME Types | Max Size |
|---|---|---|
| `image` | JPEG, PNG, WebP, AVIF | 10 MB |
| `gaussian_splat` | octet-stream, PLY, SPZ | 500 MB |
| `video` | MP4, WebM, QuickTime | 500 MB |

- **Response:** `{ url, fields, key }` (presigned S3 POST data)
- **S3 key format:** `facilities/{facilityId}/{mediaType}/{uuid}-{fileName}`

### `DELETE /api/facilities/[id]/media/[mediaId]`

Deletes a facility media item from both S3 storage and the database.

- **Auth:** Clerk + org context (verifies facility ownership)
- **Permission:** None (org ownership is the guard)
- **Response:** `{ success: true }` or `404` if media not found

---

## Placements

### `GET /api/placements`

Returns all placements scoped to the user's organization, including related patient, facility, and social worker data.

- **Auth:** Clerk + org context
- **Permission:** None
- **Response:** `Placement[]` (with `patient`, `facility`, `socialWorker` relations)

### `POST /api/placements`

Creates a new placement. Automatically runs the facility matching algorithm to populate `matchedFacilities`.

- **Auth:** Clerk + org context
- **Permission:** `placements:create`
- **Request Body:** Placement fields (patientId, careLevel, priority, notes, preferredLocation, etc.)
- **Response:** `201` with created `Placement`
- **Errors:** `400` for validation errors, `409` for conflicts (e.g., patient already has active placement)

### `GET /api/placements/[id]`

Returns a single placement with all related data.

- **Auth:** Clerk + org context
- **Permission:** None
- **Response:** `Placement` or `404`

### `PATCH /api/placements/[id]`

Updates a placement. Status changes trigger side effects (patient status sync, occupancy recalculation).

- **Auth:** Clerk + org context
- **Permission:** `placements:update`
- **Request Body:** Partial placement fields
- **Response:** Updated `Placement` or `404`
- **Errors:** `400`/`409` for validation errors

### `DELETE /api/placements/[id]`

Deletes a placement.

- **Auth:** Clerk + org context
- **Permission:** `placements:delete`
- **Response:** `{ success: true }` or error

---

## Hospitals

### `POST /api/hospitals/upload`

Generates an S3 presigned POST URL for uploading hospital images or logos.

- **Auth:** `requireOrgPermission('hospitals:manage')`
- **Permission:** `hospitals:manage`
- **Request Body:** `{ fileName, contentType, hospitalId, field }`
- **`field`:** `"image"` (main photo) or `"logo"` (hospital logo)
- **Allowed types:** JPEG, PNG, WebP, AVIF (max 10 MB)
- **Response:** `{ url, fields, key }`
- **S3 key format:** `hospitals/{hospitalId}/{field}/{uuid}-{fileName}`

---

## Invite Codes

### `GET /api/invite-codes`

Returns all invite codes for the user's organization.

- **Auth:** `requireOrgPermission(['users:read-org', 'users:manage-roles'], 'any')`
- **Permission:** Either `users:read-org` or `users:manage-roles`
- **Response:** `InviteCode[]` (includes `createdBy` relation)

### `POST /api/invite-codes`

Creates a new invite code for the user's organization.

- **Auth:** `requireOrgPermission('users:create')`
- **Permission:** `users:create`
- **Request Body:** `{ role?, maxUses?, expiresAt? }`
- **Response:** Created `InviteCode`
- **Notes:** Role is validated against allowed roles for the organization type. Code is a 10-character UUID-derived string.

### `GET /api/invite-codes/validate?code=XXXX`

Validates an invite code (public endpoint, no auth required).

- **Auth:** None (public)
- **Query Params:** `code` (string)
- **Response (valid):** `{ valid: true, inviteCode: { id, code }, organization: { id, name, slug, type } }`
- **Response (invalid):** `{ valid: false, reason: "..." }`

---

## Join Requests

### `GET /api/join-requests`

Returns all join requests for the user's organization.

- **Auth:** `requireOrgPermission(['users:read-org', 'users:manage-roles'], 'any')`
- **Permission:** Either `users:read-org` or `users:manage-roles`
- **Response:** `JoinRequest[]` (includes `user`, `inviteCode`, `reviewedBy` relations)

### `POST /api/join-requests`

Submits a request to join an organization (via invite code).

- **Auth:** Clerk (any authenticated user, no org required)
- **Permission:** None
- **Request Body:** `{ organizationId, inviteCodeId }`
- **Response:** Created `JoinRequest`
- **Validations:** Invite code must be valid/active, user must not have an existing pending request

### `PATCH /api/join-requests/[id]`

Approves or denies a join request.

- **Auth:** `requireOrgPermission('users:create')`
- **Permission:** `users:create`
- **Request Body:** `{ action: "approve" | "deny", notes? }`
- **Response:** `{ success: true }`
- **Side effects on approve:** Updates user's org + role in DB, updates Clerk `publicMetadata`, increments invite code `usedCount`

---

## Organization Onboarding

### `POST /api/onboarding/create-org`

Creates a new organization and assigns the current user as the highest-privileged role.

- **Auth:** Clerk (any authenticated user)
- **Permission:** None
- **Request Body:** `{ name, slug, type }`
- **`type`:** `"hospital"` or `"facility"`
- **Response:** `{ success: true, organization }`
- **Side effects:** Creates org in DB, upserts user with highest role for org type, updates Clerk `publicMetadata` (organizationId, organizationType, role)
- **Validations:** Slug must be unique

---

## Webhooks

### `POST /api/webhooks`

Handles Clerk webhook events to sync user and organization data to the local database.

- **Auth:** Clerk webhook signature verification
- **Events handled:**

| Event | Action |
|---|---|
| `user.created` | Upserts user in DB with role from `public_metadata` |
| `user.updated` | Upserts user in DB (syncs email, name, role, org) |
| `user.deleted` | Deletes user from DB |
| `organization.created` | Upserts organization in DB |
| `organization.updated` | Upserts organization in DB |
| `organization.deleted` | Deletes organization from DB |

- **Response:** `200 "OK"` (always, to prevent Clerk retries)
