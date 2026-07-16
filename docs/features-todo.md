# CareBridge Health — Feature Roadmap & Todo

**Generated:** 2026-07-16
**Current version:** v0.1.0

---

## Priority Legend

- **P0** — Core gap for clinical workflow
- **P1** — High production value / enterprise requirement
- **P2** — Significant quality-of-life improvement
- **P3** — Nice-to-have / future

---

## P0 — Core Workflow Gaps

### 1.0 Real-time Notifications (in-app + email)

**Schema & Data Layer**

- [ ] **Notification Prisma model created**
  - KPI: Model exists in `prisma/schema.prisma` with fields: `id` (String, cuid), `userId` (String, indexed, FK→User), `type` (NotificationType enum), `title` (String), `body` (Text), `resourceType` (String: "placement"|"patient"|"facility"|"invite"|"task"), `resourceId` (String?), `readAt` (DateTime?), `createdAt` (DateTime, @default(now()))
  - KPI: `NotificationType` enum includes `placement_status_change`, `new_match`, `invite_accepted`, `patient_assigned`, `bed_available`, `task_assigned`, `task_due_soon`, `approval_needed`, `contract_expiring`
  - KPI: Migration generates cleanly with `npx prisma migrate dev`
  - KPI: `src/lib/data-access.ts` exports `getNotifications(userId, limit?, offset?)` returning unread-first, newest-first
  - KPI: `src/lib/data-access.ts` exports `markNotificationRead(notificationId, userId)` returning the updated notification
  - KPI: `src/lib/data-access.ts` exports `markAllNotificationsRead(userId)` returning count of affected rows
  - KPI: `src/lib/data-access.ts` exports `getUnreadNotificationCount(userId)` returning integer
  - KPI: `src/lib/data-access.ts` exports `createNotification(data)` inserting a single notification row
  - KPI: `src/lib/data-access.ts` exports `createNotificationsBulk(data[])` inserting multiple notifications in a single query

**Realtime Delivery**

- [ ] **SSE endpoint at `/api/notifications/stream`**
  - KPI: Endpoint sets `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
  - KPI: Endpoint authenticates via Clerk `auth()` and returns 401 if unauthenticated
  - KPI: Client receives new notifications within 3 seconds of server-side `createNotification` call
  - KPI: Connection re-establishes automatically on disconnect with exponential backoff (1s, 2s, 4s, max 30s)
  - KPI: Endpoint sends a heartbeat comment every 30 seconds to keep the connection alive
  - KPI: No memory leak — abandoned connections cleaned up within 60 seconds

**Email Integration**

- [ ] **Email notification service configured**
  - KPI: Provider (Resend/SendGrid/Postmark) SDK installed and configured in `src/lib/email.ts`
  - KPI: `src/lib/email.ts` exports `sendEmail(to: string, subject: string, body: string, options?)`
  - KPI: Transactional email templates exist for each `NotificationType` (plain-text fallback + HTML version for each)
  - KPI: Email sending is non-blocking — runs in background after DB write
  - KPI: Email send failures are logged with `console.error` but never throw to the caller
  - KPI: Rate-limited to max 10 emails per second per org (backpressure via in-memory queue)

**Notification Triggers**

- [ ] **Placement status change triggers notification**
  - KPI: `updatePlacement()` in data-access.ts calls `createNotification` for the placement's `socialWorkerId` when status changes
  - KPI: Notification title includes patient name and new status (e.g., "Jane Doe — Placement Approved")
  - KPI: If `facilityCoordinatorId` exists on the placement, they also receive notification

- [ ] **New facility match triggers notification**
  - KPI: `getPatientFacilityMatches()` or the matching algorithm publishes a notification when a new match score exceeds 80%
  - KPI: Notification body includes count of new matches and top facility name
  - KPI: Deduplicated — only one notification per patient per 24-hour window for new matches

- [ ] **Invite accepted triggers notification**
  - KPI: Join request approval/denial in data-access.ts triggers notification to `reviewedById` and org admins
  - KPI: Notification title: "{Name} has joined {Organization}"

- [ ] **Patient assignment triggers notification**
  - KPI: When `patient.socialWorkerId` changes, the newly assigned social worker receives a notification
  - KPI: Notification body includes patient name and MRN

- [ ] **Bed availability triggers notification**
  - KPI: When `facility.currentOccupancy` drops below `facility.capacity`, a notification fires for social workers with active placements matching this facility
  - KPI: Deduplicated — one notification per patient-facility pair per 12 hours

**In-App Notification UI**

- [ ] **Bell icon in sidebar header**
  - KPI: Bell icon component (`@/components/notifications/bell.tsx`) renders in header, accessible from all app routes
  - KPI: Shows unread count badge (red dot with number, max "99+")
  - KPI: Badge updates within 5 seconds of a new notification arriving via SSE
  - KPI: Clicking bell opens a dropdown panel (shadcn Popover or Sheet)

- [ ] **Notification dropdown panel**
  - KPI: Panel shows last 20 notifications, newest first
  - KPI: Each notification shows: icon by type, title, relative timestamp ("2m ago"), read/unread indicator (bold/faint)
  - KPI: Unread notifications have a blue dot or bold text
  - KPI: Clicking a notification marks it as read and navigates to the resource (`/patients/{id}`, `/placements/{id}`, etc.)
  - KPI: "Mark all as read" link at bottom of panel
  - KPI: "View all" link navigates to `/notifications` full page
  - KPI: Empty state: "No notifications yet" with bell icon

- [ ] **Notification list page at `/notifications`**
  - KPI: TanStack table with columns: Type (icon), Title, Resource, Timestamp, Read status
  - KPI: Server-side pagination (50 per page)
  - KPI: Filters: all / unread only, date range, notification type
  - KPI: "Mark all read" button in header
  - KPI: Bulk select + mark read action

**Notification Preferences**

- [ ] **Notification preferences page at `/settings/notifications`**
  - KPI: Table of notification types with toggle per channel (in-app, email)
  - KPI: Default: all types enabled for in-app, only placement/approval types for email
  - KPI: Settings persisted to `user.notificationPreferences` JSON field or a `NotificationPreference` model
  - KPI: Prompt-level toggle: "Quiet hours" (start/end time, only send critical types during quiet hours)

---

### 2.0 Bed Board / Capacity Heatmap

**Data Layer**

- [ ] **Bed board query in data-access layer**
  - KPI: `src/lib/data-access.ts` exports `getBedBoard(organizationId, filters?)` returning `{ facilityId, name, type, totalCapacity, currentOccupancy, availableBeds, careLevelsOffered, insuranceAccepted, address, distance? }[]`
  - KPI: Filters support: `careLevel` (enum), `insuranceType` (string[]), `maxDistance` (miles, requires lat/lng), `minAvailableBeds` (int), `facilityType` (enum)
  - KPI: `getBedBoardOccupancyHistory(facilityId, days)` returns daily occupancy snapshots for trend display
  - KPI: All queries complete in under 500ms for orgs with up to 200 facilities

**Grid View**

- [ ] **Bed board grid page at `/dashboard/bed-board`**
  - KPI: Card per facility showing: name, type badge, occupancy bar (color-coded: green <70%, yellow 70-85%, orange 85-95%, red >95%), available beds count, care levels
  - KPI: Occupancy bar shows exact fraction: "22 / 30 beds filled" with visual progress bar
  - KPI: Sorted by default: available beds descending, then distance ascending
  - KPI: Filter panel (collapsible sidebar or top bar) with care level multi-select, insurance multi-select, distance slider, bed count slider
  - KPI: Search by facility name
  - KPI: Grid is responsive: 1 col mobile, 2 tablet, 3 desktop, 4 wide
  - KPI: Clicking a card navigates to facility detail page
  - KPI: Loading skeleton exists in `dashboard-skeletons.tsx` matching the grid layout
  - KPI: Page re-renders within 10 seconds of any placement create/approve/complete via SSE push

**Map Overlay**

- [ ] **Leaflet bed board map**
  - KPI: Map markers for each facility, color-coded by occupancy tier (same green/yellow/orange/red scheme)
  - KPI: Clicking a marker shows a popup with: facility name, available beds, care levels, "View Details" link
  - KPI: Map updates filter results in sync with grid view
  - KPI: Cluster markers when zoom level shows >50 facilities
  - KPI: User location (if granted) shown with a blue dot, facilities sorted by distance

---

### 3.0 Patient Timeline / History View

**Data Layer**

- [ ] **Timeline event query**
  - KPI: `getPatientTimeline(patientId, organizationId)` returns `{ id, type, title, description, timestamp, userId, userName, metadata? }[]`
  - KPI: Sources: `ActivityEvent` records, placement status transitions, patient status changes, document uploads, notes
  - KPI: Ordered by timestamp ascending
  - KPI: Completes in under 200ms for patients with up to 500 events

**UI Component**

- [ ] **Timeline component**
  - KPI: Vertical timeline with left-aligned date labels, right-aligned event cards
  - KPI: Each event shows: icon (by type), title, description, relative timestamp, responsible user name
  - KPI: Icons for each type: admission (🏥), assessment (📋), placement attempt (🔄), status change (⬆), document (📄), note (💬), discharge (✅) — using Remixicon equivalents
  - KPI: Color-coded left border/line per event type
  - KPI: Clicking an event card opens a detail modal (for placement events, links to placement page)
  - KPI: "Loading..." state with 5 skeleton timeline entries
  - KPI: Empty state: "No events recorded for this patient"
  - KPI: Scrollable within a max-height container on the patient detail page

**Integration**

- [ ] **Timeline embedded on patient detail page**
  - KPI: Timeline is a tab ("Timeline") alongside existing sections on `/patients/[id]`
  - KPI: Tab is visible to all roles with `patients:read`
  - KPI: Server component fetches timeline data, client component renders it

- [ ] **Timeline auto-population**
  - KPI: `createPatient()` creates an initial `ActivityEvent` of type `admission`
  - KPI: `updatePlacement()` creates an `ActivityEvent` on every status transition
  - KPI: `updatePatient()` creates an `ActivityEvent` when `status` field changes
  - KPI: Patient document upload creates an ActivityEvent of type `note` or relevant type
  - KPI: All timeline event creation happens inside the same data-access function as the source operation (no async gaps)

---

### 4.0 Analytics & Reporting

**Data Layer**

- [ ] **Analytics queries in data-access layer**
  - KPI: `getPlacementAnalytics(organizationId, days)` returns `{ total, byStatus: Record<PlacementStatus, int>, avgDaysPerStatus: Record<PlacementStatus, float>, dailyTrend: { date, count }[] }`
  - KPI: `getDischargeVelocity(organizationId, days)` returns `{ avgDaysFromAdmissionToPlacement, avgDaysFromPlacementToDischarge, totalDischarges, trend: { date, count, avgDays }[] }`
  - KPI: `getFacilityFillRates(organizationId, days)` returns `{ facilityId, facilityName, avgOccupancy, currentOccupancy, dailyTrend: { date, occupancy }[] }[]`
  - KPI: `getReadmissionRate(organizationId, days)` returns `{ totalDischarged, readmittedWithin30Days, readmissionRate, readmittedPatients: { id, name, dischargeDate, readmissionDate }[] }`
  - KPI: `getPendingApprovalsAging(organizationId)` returns `{ pendingCount, maxAgeDays, avgAgeDays, items: { id, patientName, status, daysWaiting, priority }[] }`
  - KPI: All queries complete in under 2 seconds for orgs with up to 10,000 placements
  - KPI: All queries accept optional `startDate` and `endDate` params defaulting to last 30 days

**Dashboard Cards**

- [ ] **Admin dashboard analytics cards**
  - KPI: Cards on `/dashboard/admin` showing: Active Placements count, Pending Approvals count + avg wait time, Avg Placement Time (days), Readmission Rate (%), Facilities Near Capacity (count >85%)
  - KPI: Each card shows trend arrow (up/down/flat) vs previous period with percentage
  - KPI: Cards auto-refresh on navigation (no stale data)
  - KPI: Loading skeleton for each card in `dashboard-skeletons.tsx`

**Full Report Pages**

- [ ] **Placement analytics page at `/analytics/placements`**
  - KPI: Bar chart: placements by status (Recharts)
  - KPI: Line chart: placement volume trend over time (daily/weekly/monthly toggle)
  - KPI: Table: avg days per placement status
  - KPI: Date range picker (shadcn Calendar with range mode)
  - KPI: All charts exportable as PNG via Recharts ref

- [ ] **Discharge velocity page at `/analytics/discharge-velocity`**
  - KPI: Line chart: avg days from admission→placement, placement→discharge, over time
  - KPI: KPI cards: current averages for each stage
  - KPI: Filter by facility, social worker, care level, date range

- [ ] **Facility fill rates page at `/analytics/facility-fill-rates`**
  - KPI: Table: facility name, avg occupancy %, current occupancy %, trend (sparkline), bed count
  - KPI: Sorted by occupancy descending
  - KPI: Click row to see daily occupancy line chart for that facility

- [ ] **Readmission tracking page at `/analytics/readmissions`**
  - KPI: KPI card: readmission rate with trend
  - KPI: Table of readmitted patients: name, MRN, discharge date, readmission date, days between, facility, social worker
  - KPI: Filter by date range, care level, facility

- [ ] **Pending approvals aging page at `/analytics/pending-approvals`**
  - KPI: Card: total pending, max wait days, avg wait days
  - KPI: Table: patient name, days waiting, priority (color-coded), facility, assigned social worker
  - KPI: Sortable by days waiting descending (default)

**CSV Export**

- [ ] **Export for every report page**
  - KPI: "Export CSV" button on each analytics page
  - KPI: Server-side endpoint `GET /api/analytics/{type}/export?startDate=&endDate=` returns `Content-Type: text/csv` with `Content-Disposition: attachment; filename="{type}-{date}.csv"`
  - KPI: CSV respects current filters/date range
  - KPI: CSV includes header row with column names, BOM for Excel compatibility
  - KPI: Button disabled and shows spinner during generation
  - KPI: Timeout of 30 seconds, error toast if fails

---

### 5.0 PDF Generation (Discharge & Placement Documents)

**Service Layer**

- [ ] **PDF generation service at `src/lib/pdf.ts`**
  - KPI: `generateDischargeSummary(patientId, placementId): Promise<Buffer>` generates a complete discharge summary
  - KPI: `generatePlacementReferral(placementId): Promise<Buffer>` generates a placement referral form
  - KPI: Library chosen (react-pdf or @react-pdf/renderer) renders React components to PDF
  - KPI: PDF includes: header with CareBridge logo + org name, patient demographics section, diagnosis list, care level recommendation, facility placement details, insurance information, dates (admission, discharge, placement), signature lines
  - KPI: PDF output is A4/Letter format, 300 DPI, left-aligned text, professional layout
  - KPI: Error handling: invalid patient/placement IDs return null, logged to console, no crash
  - KPI: Generation completes in under 5 seconds for a single document

**API Endpoints**

- [ ] **PDF generation endpoints**
  - KPI: `GET /api/patients/{id}/documents/discharge-summary` returns PDF buffer as `application/pdf`
  - KPI: `GET /api/placements/{id}/referral-form` returns PDF buffer as `application/pdf`
  - KPI: Both endpoints require `patients:read` or `placements:read` permission
  - KPI: Both return 404 if resource not found or not in org scope
  - KPI: Both set `Content-Disposition: attachment; filename="discharge-summary-{patientId}.pdf"`

**Frontend Integration**

- [ ] **Download buttons on pages**
  - KPI: "Download Discharge Summary" button on `/patients/[id]` page, visible when patient status is "placed" or "discharged"
  - KPI: "Download Referral Form" button on `/placements/[id]` page, visible when status is "approved" or "in_progress"
  - KPI: Buttons show loading spinner during generation
  - KPI: Buttons use `<a href="..." download>` or blob download via fetch
  - KPI: Error state: toast "Failed to generate PDF" with retry option

**Auto-generation**

- [ ] **Auto-generate on placement completion**
  - KPI: When `updatePlacement()` transitions status to `completed`, auto-generates discharge summary PDF
  - KPI: Generated PDF is uploaded to S3 and a `PatientDocument` record is created with category="discharge_summary"
  - KPI: ActivityEvent created for the auto-generated document
  - KPI: Background generation — doesn't block the placement update response

---

### 6.0 Bulk Import (Patients & Facilities)

**Upload Page**

- [ ] **Import page at `/import`**
  - KPI: Route accessible to admins, superadmins, and roles with `patients:create`/`facilities:create`
  - KPI: File upload zone (shadcn Dropzone or drag-and-drop area) accepting `.csv` and `.xlsx` files
  - KPI: File size limit: 10MB, enforced client-side and server-side
  - KPI: Template download: "Download CSV template" link for patients and for facilities
  - KPI: Loading state: progress bar during upload

**Column Mapping**

- [ ] **Column mapping UI**
  - KPI: After upload, preview table shows first 10 rows of data
  - KPI: Dropdown for each column to map to a target field (e.g., "Full Name" → `firstName` + `lastName`)
  - KPI: Auto-detection attempts to match column headers to field names by common names (e.g., "MRN", "Medical Record #" → `mrn`)
  - KPI: Required fields highlighted with red border if unmapped
  - KPI: Validation errors shown inline per cell with specific message (e.g., "Invalid date format", "Care level 'unknown' not recognized")

**Validation & Import**

- [ ] **Server-side validation + import endpoint**
  - KPI: `POST /api/import/patients` and `POST /api/import/facilities` accept multipart form with file + column mapping JSON
  - KPI: Server validates all rows before inserting any (all-or-nothing within a batch)
  - KPI: Batch size: 100 rows per transaction
  - KPI: Validation checks: required fields present, enum values match, date formats parseable, unique MRNs (patients) / names (facilities within org)
  - KPI: Duplicate MRN detection: warn + skip option vs overwrite option
  - KPI: Return JSON with: `{ imported: int, errors: int, total: int, errorRows: [{ row, field, message }] }`

**History & Correction**

- [ ] **Import history page/log**
  - KPI: Sidebar or section displays last 10 imports with: timestamp, type (patients/facilities), rows attempted, rows succeeded, rows failed
  - KPI: Click an import to see full error details

- [ ] **Download error CSV**
  - KPI: Error CSV includes original data plus an "Error" column with the failure reason
  - KPI: User can correct errors and re-upload the error CSV directly

---

### 7.0 Placement Comparison View

**Data Layer**

- [ ] **Comparison query**
  - KPI: `getPlacementComparison(placementId, organizationId, filters?)` returns `MatchedFacility[]` with full scoring details
  - KPI: Each result includes: facility name, type, rating, distance (miles), currentOccupancy, totalCapacity, careLevelsOffered, insuranceAccepted, estimatedCost, waitlistDays, matchScore (0-100), scoreBreakdown (careLevelWeight, availabilityWeight, locationWeight, ratingWeight, insuranceWeight)
  - KPI: Results sorted by matchScore descending by default
  - KPI: Filters: care level, insurance, min rating, max distance, max cost
  - KPI: Completes in under 1 second for up to 50 matched facilities

**Comparison Page**

- [ ] **Side-by-side comparison at `/placements/[id]/compare`**
  - KPI: Table layout with one facility per column, attributes as rows
  - KPI: First column is attribute labels, remaining columns are facilities
  - KPI: Row headers: Match Score, Facility Name, Type, Distance, Rating, Occupancy, Available Beds, Care Levels Offered, Insurance Accepted, Est. Cost, Waitlist Days
  - KPI: Selected facility (if any) highlighted with accent border
  - KPI: Match Score row shows visual score bar (0-100) with color gradient (red→yellow→green)
  - KPI: Default view shows top 3 facilities; "Show all N matches" expand button
  - KPI: Responsive: horizontal scroll on mobile, sticky first column
  - KPI: Each facility column has a "Select" button at the bottom

**Selection Action**

- [ ] **Select facility flow**
  - KPI: "Select for Placement" button opens a confirmation dialog
  - KPI: Dialog shows: "Assign [patient name] to [facility name]? This will update the placement and notify the facility coordinator."
  - KPI: On confirm: PATCH `/api/placements/[id]` sets `selectedFacilityId` and status to `pending_approval`
  - KPI: On success: redirect to placement detail page with success toast
  - KPI: ActivityEvent created for the selection

**Integration with Matching Algorithm**

- [ ] **Comparison accessible from placement workflow**
  - KPI: "Compare Facilities" link/button on placement detail page when status is `matching` or `searching`
  - KPI: Button also in AI chat assistant output when facilities are returned
  - KPI: Comparison page has its own loading skeleton in `dashboard-skeletons.tsx`

---

## P1 — Production & Enterprise Hardening

### 8.0 Patient Transport / Logistics Tracking

**Schema & Data Layer**

- [ ] **Transport Prisma model created**
  - KPI: Model with fields: `id` (String, cuid), `placementId` (String, FK→Placement, indexed), `transportType` (TransportType enum: "ambulance"|"wheelchair_van"|"medical_transport"|"family"|"other"), `providerName` (String?), `contactPhone` (String?), `scheduledPickupAt` (DateTime?), `actualPickupAt` (DateTime?), `arrivalAt` (DateTime?), `status` (TransportStatus enum: "scheduled"|"in_transit"|"arrived"|"completed"|"cancelled"), `notes` (Text?), `createdAt`, `updatedAt`
  - KPI: Migration generates cleanly
  - KPI: `src/lib/data-access.ts` exports `createTransport(data)`, `updateTransport(id, data)`, `getTransportsForPlacement(placementId)`, `getTransport(id)`

**UI**

- [ ] **Transport section on placement detail page**
  - KPI: Collapsible section "Transport / Logistics" on `/placements/[id]`
  - KPI: Shows: transport type, provider, scheduled pickup time (formatted), status badge
  - KPI: Status timeline: scheduled → in_transit → arrived → completed (visual stepper)
  - KPI: "Add Transport" button if none exists
  - KPI: "Edit" and "Cancel" buttons for existing transport (permission-gated)
  - KPI: Form: dropdown for transport type, text inputs for provider/contact, datetime picker for pickup
  - KPI: Cancel transport opens a confirmation dialog with reason field

**Notifications**

- [ ] **Transport status change notifications**
  - KPI: On status change → in_transit: notification to social worker
  - KPI: On status change → arrived: notification to social worker + facility coordinator
  - KPI: On status change → completed: notification to social worker
  - KPI: On status change → cancelled: notification to social worker with cancellation reason

---

### 9.0 Multi-language / Internationalization (i18n)

**Framework Setup**

- [ ] **i18n library integration**
  - KPI: `next-intl` installed and configured per its Next.js 16 App Router setup
  - KPI: `i18n.ts` config file with locales: `['en', 'es']`
  - KPI: `next.config.ts` updated with `next-intl` plugin
  - KPI: Middleware updated to detect locale from `Accept-Language` header and redirect `/` → `/en/` or `/es/`
  - KPI: All routes wrapped with `NextIntlClientProvider`

**Translation Files**

- [ ] **Translation files created**
  - KPI: `messages/en.json` and `messages/es.json` exist with complete key-value pairs
  - KPI: Keys organized by namespace: `common`, `nav`, `patients`, `facilities`, `placements`, `dashboard`, `auth`, `settings`, `errors`, `notifications`
  - KPI: Spanish translations verified by native speaker or translation service for all user-facing text
  - KPI: Missing key fallback: component renders English key name surrounded by `***` for visibility during development, silently falls back to English in production

**Language Switcher**

- [ ] **Language switcher UI**
  - KPI: Language toggle in sidebar footer or header area
  - KPI: Shows current language flag/abbreviation (EN / ES)
  - KPI: Clicking switches locale and persists to cookie + user preference
  - KPI: Preference survives page navigation and browser close
  - KPI: No page flash — suspense boundary during locale switch

**Date & Number Formatting**

- [ ] **Locale-aware formatting**
  - KPI: All dates use `next-intl`'s `DateTimeFormat` (es: "19 de julio de 2026")
  - KPI: All numbers use locale-aware formatting (es: 1.234,56)
  - KPI: Currency amounts formatted per locale

**RTL Support**

- [ ] **RTL layout consideration**
  - KPI: CSS logical properties used instead of `left`/`right` where feasible (future-proofing)
  - KPI: Document `dir` attribute updates with locale change
  - KPI: Tailwind RTL variants (`rtl:` prefix) used for layout-critical positioning

---

### 10.0 Audit Log Viewer UI

**Page & Data Layer**

- [ ] **Audit log page at `/admin/audit`**
  - KPI: Route accessible only to superadmin and administrator roles
  - KPI: TanStack table with columns: Timestamp, Event Type (icon+badge), Title, Patient, User, Resource Link
  - KPI: Server-side pagination: 50 rows per page
  - KPI: Total count displayed: "Showing 1-50 of 2,347 events"
  - KPI: Loading skeleton in `dashboard-skeletons.tsx`

**Filters**

- [ ] **Advanced filters**
  - KPI: Event type multi-select dropdown (ActivityType enum values)
  - KPI: Date range picker (shadcn Calendar range mode), defaults to last 30 days
  - KPI: User search/select (autocomplete from org users)
  - KPI: Patient search/select (autocomplete from org patients)
  - KPI: Resource type filter (patient/placement/facility)
  - KPI: "Clear filters" button resets all to defaults
  - KPI: Filters reflected in URL query params for shareability

**Detail & Export**

- [ ] **Event detail modal**
  - KPI: Clicking a row opens a shadcn Dialog with full event details
  - KPI: Shows: type icon + title, full description, timestamp, user name + email, patient name + link, organization, any metadata
  - KPI: "View related [resource]" link at bottom

- [ ] **CSV export**
  - KPI: "Export CSV" button respects current filters
  - KPI: Server-side endpoint generates CSV with all columns
  - KPI: Filename: `audit-log-{org-slug}-{date}.csv`

- [ ] **Retention policy display**
  - KPI: Banner or tooltip: "Events older than 90 days are automatically archived"
  - KPI: Configurable retention period in org settings

---

### 11.0 SSO / SAML Login Support

**Clerk Configuration**

- [ ] **Clerk SAML/SSO integration enabled**
  - KPI: SAML connection configured in Clerk Dashboard for the instance
  - KPI: `NEXT_PUBLIC_CLERK_SAML_SSO=true` in env for development
  - KPI: Tested with at least one provider (Okta, Azure AD, or Google Workspace)
  - KPI: SSO button appears on sign-in page alongside email/password and Google OAuth

**Org Settings Integration**

- [ ] **SSO enrollment in org settings**
  - KPI: `/settings/sso` page accessible to admins
  - KPI: "Enable SSO" toggle with domain input field
  - KPI: Instructions displayed for configuring the IdP
  - KPI: Connection status indicator: "Connected" / "Not Connected" / "Error"
  - KPI: "Disconnect SSO" button with confirmation dialog

**Just-in-Time Provisioning**

- [ ] **JIT provisioning for SAML users**
  - KPI: Clerk webhook `user.created` handler detects SAML provider
  - KPI: Auto-creates user in local DB with role from SAML attributes or default "customer"
  - KPI: Auto-assigns to org based on email domain matching org's SSO domain
  - KPI: ActivityEvent created for auto-provisioned users

**Domain Enforcement**

- [ ] **Domain-based SSO enforcement**
  - KPI: Org setting: "Require SSO for @hospital.org emails"
  - KPI: When enabled, users with matching email domain are redirected to SSO on sign-in
  - KPI: Non-SSO sign-in blocked with message: "Please use your organization's SSO to sign in"

---

### 12.0 Data Export for List Views

**Feature Implementation**

- [ ] **Export CSV button on all TanStack table pages**
  - KPI: Button present on: patients, facilities, placements, users, hospitals pages
  - KPI: Button is visible to any role with read permission for that resource
  - KPI: Button position: top-right of table, aligned with other actions

**Export Behavior**

- [ ] **CSV generation respects current filters and search**
  - KPI: If user has typed in the search box, CSV only includes matching rows
  - KPI: If filters are active (status, type, etc.), CSV respects them
  - KPI: If paginated — exports ALL matching rows, not just current page
  - KPI: Maximum export: 100,000 rows (server-side limit)

- [ ] **Server-side CSV endpoint**
  - KPI: `GET /api/{resource}/export?filters...` returns `Content-Type: text/csv`
  - KPI: Streaming response for large datasets (uses Node.js streams or paginated iteration)
  - KPI: BOM character at start for Excel UTF-8 compatibility
  - KPI: All string fields escaped for CSV (quotes, commas, newlines)
  - KPI: Endpoint requires same permission as read endpoint for the resource

- [ ] **Filename convention**
  - KPI: `patients-{org-slug}-{YYYY-MM-DD}.csv`
  - KPI: `facilities-{org-slug}-{YYYY-MM-DD}.csv`
  - KPI: `placements-{org-slug}-{YYYY-MM-DD}.csv`
  - KPI: Same pattern for all exported resources

- [ ] **UI feedback**
  - KPI: Button shows loading spinner during export
  - KPI: Toast on success: "Export started — your download will begin shortly"
  - KPI: Toast on error: "Export failed. Please try again."
  - KPI: Prevents double-click: button disabled while export is in progress

---

### 13.0 Two-Factor Authentication Enforcement

**Clerk Configuration**

- [ ] **Clerk 2FA enabled**
  - KPI: Clerk instance has 2FA (TOTP) enabled in Dashboard
  - KPI: Each user can enroll via their Clerk account security page
  - KPI: 2FA methods: authenticator app (TOTP), SMS backup codes

**Org-Level Enforcement**

- [ ] **Org settings for 2FA enforcement**
  - KPI: `/settings/security` toggle: "Require 2FA for all members"
  - KPI: When enabled, users without 2FA enrolled see a warning banner on every page until they enroll
  - KPI: After grace period (configurable, default 7 days), users without 2FA are blocked from accessing app routes
  - KPI: Superadmin bypasses 2FA enforcement for support purposes

- [ ] **User-level 2FA status display**
  - KPI: User management table at `/users` includes "2FA" column: "Enabled" (green), "Not Enrolled" (gray), "Exempt" (badge)
  - KPI: Filter by 2FA status in user management
  - KPI: Admin can view which users have not enrolled 2FA

---

## P2 — Quality of Life

### 14.0 Saved Searches & Facility Lists

**Schema & Data Layer**

- [ ] **SavedSearch model**
  - KPI: `id` (String, cuid), `userId` (String, FK→User), `name` (String), `filters` (Json — full filter state), `resourceType` (String: "facility"|"patient"|"placement"), `createdAt`
  - KPI: Unique constraint on `(userId, name)` per resource type
  - KPI: Data-access functions: `createSavedSearch()`, `getSavedSearches(userId, resourceType)`, `deleteSavedSearch(id, userId)`

**UI**

- [ ] **Save search flow**
  - KPI: "Save Current Search" button below filter panel on facility network page
  - KPI: Clicking opens an inline text input for naming the search
  - KPI: Saved searches appear in a dropdown: "Saved Searches" heading, list of names with delete icon
  - KPI: Clicking a saved search applies all filters and runs the search

- [ ] **Facility list / favorites model**
  - KPI: `FacilityList` model: `id`, `userId`, `name`, `facilityIds` (String[]), `createdAt`, `updatedAt`
  - KPI: Data-access: `createFacilityList()`, `getFacilityLists(userId)`, `addFacilityToList()`, `removeFacilityFromList()`, `deleteFacilityList()`

- [ ] **Facility list UI**
  - KPI: "Save to List" button on facility card/detail (heart icon or bookmark icon)
  - KPI: Quick-access dropdown in sidebar under "My Facility Lists" or in facility page header
  - KPI: Lists page at `/facilities/lists` showing all saved lists with facility counts
  - KPI: Click a list to see only those facilities on the network page

- [ ] **Share lists**
  - KPI: "Share List" button generates a shareable link with a unique token
  - KPI: Shared list is read-only, accessible to anyone in the same org with `facilities:read`
  - KPI: Token model: `id`, `listId`, `token` (unique, random string), `createdById`, `expiresAt?`, `createdAt`

---

### 15.0 Task / To-Do Assignments

**Schema & Data Layer**

- [ ] **Task Prisma model**
  - KPI: Fields: `id` (String, cuid), `organizationId` (String, FK→Org), `title` (String, max 200 chars), `description` (Text?), `assignedById` (String, FK→User), `assignedToId` (String, FK→User, indexed), `patientId` (String?, FK→Patient), `placementId` (String?, FK→Placement), `dueAt` (DateTime?), `completedAt` (DateTime?), `status` (TaskStatus enum: "open"|"in_progress"|"completed"|"cancelled"), `priority` (Priority enum), `createdAt`, `updatedAt`
  - KPI: Index on `(assignedToId, status)` for common query pattern
  - KPI: Migration generates cleanly

- [ ] **Task data-access functions**
  - KPI: `createTask(data)` — creates task, returns it
  - KPI: `getTasksForUser(userId, filters?)` — returns tasks for a user, supports filters: status, priority, patientId, dueBefore, dueAfter
  - KPI: `getTasksForOrg(organizationId, filters?)` — admin view of all org tasks
  - KPI: `updateTaskStatus(id, status)` — updates status, sets `completedAt` if status is "completed"
  - KPI: `getTaskCounts(userId)` — returns `{ open, inProgress, overdue, completedToday }`

**Task List Page**

- [ ] **Task list at `/tasks`**
  - KPI: TanStack table with columns: checkbox (select), Status (dropdown), Title (clickable), Priority, Patient/Placement (links), Assignee (for admin view), Due Date, Actions (edit, complete, cancel)
  - KPI: Filters: status multi-select, priority multi-select, patient search, due date range
  - KPI: Sorting by priority (emergency→low), due date (ascending)
  - KPI: Inline status change via dropdown
  - KPI: Bulk complete via checkbox selection + "Mark Complete" button
  - KPI: Empty state: "No tasks assigned" with "Create Task" CTA (if admin)
  - KPI: Loading skeleton in `dashboard-skeletons.tsx`

**Task Creation**

- [ ] **Task creation modal / page**
  - KPI: "New Task" button in header of `/tasks` page
  - KPI: Modal (shadcn Dialog) with fields: Title (required), Description (textarea), Assignee (user autocomplete, org-scoped), Patient (autocomplete), Placement (autocomplete), Priority (select), Due Date (date picker)
  - KPI: Validation: title required, max 200 chars; assignee required
  - KPI: On submit: POST `/api/tasks` → create task → close modal → refresh table
  - KPI: Error handling: toast on failure

**Dashboard Widget**

- [ ] **"My Tasks" widget on dashboard**
  - KPI: Card on role-appropriate dashboard showing: count of open tasks, count of overdue tasks (red), list of top 5 tasks (title, due date, priority badge)
  - KPI: "View All" link to `/tasks`
  - KPI: Click a task title to view task detail modal
  - KPI: Skeleton loading state

**Notifications**

- [ ] **Task notifications**
  - KPI: On task creation, assigned user receives in-app notification
  - KPI: If `dueAt` is within 24 hours and task is not completed, notification sent at 9 AM on due date
  - KPI: If task becomes overdue (past `dueAt` and not completed), notification sent at time of overdue

---

### 16.0 Facility Waitlist Management

**Schema & Data Layer**

- [ ] **WaitlistEntry Prisma model**
  - KPI: Fields: `id` (String, cuid), `facilityId` (String, FK→Facility), `patientId` (String, FK→Patient), `placementId` (String?, FK→Placement), `position` (Int), `status` (WaitlistStatus enum: "active"|"paused"|"placed"|"removed"), `notes` (Text?), `createdAt`, `updatedAt`
  - KPI: Unique constraint on `(facilityId, patientId)` — one entry per patient per facility
  - KPI: Index on `(facilityId, position)` for ordered retrieval
  - KPI: Data-access: `addToWaitlist()`, `removeFromWaitlist()`, `getWaitlistForFacility(facilityId)`, `reorderWaitlist(facilityId, entryId, newPosition)`, `getActiveWaitlistCount(facilityId)`

- [ ] **Auto-promote on bed availability**
  - KPI: When `updateFacility()` reduces `currentOccupancy`, check if waitlist has active entries
  - KPI: If bed available + waitlist non-empty → notification to social worker of first waitlisted patient
  - KPI: "Auto-assign" option: org setting to auto-advance first waitlisted patient to pending_approval

**UI**

- [ ] **Waitlist section on facility detail page**
  - KPI: Collapsible "Waitlist" section showing: count of patients waiting, list of entries with position number, patient name, status badge, days waiting
  - KPI: "Add to Waitlist" button opens a patient search dialog
  - KPI: Drag-and-drop reorder positions (facility coordinator only)
  - KPI: Remove from waitlist with confirmation dialog

- [ ] **Waitlist indicator on facility card**
  - KPI: Small badge on facility card if waitlist > 0: "3 waiting"
  - KPI: Visible on bed board and facility network pages

---

### 17.0 Calendar / Scheduling

**Component**

- [ ] **Calendar view component**
  - KPI: Month view by default, with week and day toggle
  - KPI: Events displayed as colored bars on day cells
  - KPI: Click a day to see that day's events in a side panel or popover
  - KPI: Navigation: prev/next month buttons, "Today" button
  - KPI: Responsive: month grid collapses to list on mobile (<640px)

**Events**

- [ ] **Calendar event sources**
  - KPI: Scheduled discharges (placement.startDate) shown as green events
  - KPI: Placement approvals expiring shown as yellow events (if not completed within 48h of approval)
  - KPI: Task due dates shown as blue events
  - KPI: Transport scheduled pickups shown as purple events

- [ ] **Event detail modal**
  - KPI: Clicking an event opens a detail modal with: title, time, resource link, description
  - KPI: Action button: "View [Placement/Patient/Task]" navigates to the resource

**Dashboard Integration**

- [ ] **Calendar widget on dashboard**
  - KPI: Small month calendar on dashboard (next 7 days visible)
  - KPI: Shows event dots for days with events
  - KPI: Click a day → expands to show day's events list
  - KPI: "Full Calendar" link to `/calendar`
  - KPI: Skeleton loading state

- [ ] **Calendar page at `/calendar`**
  - KPI: Full-page calendar with all event sources
  - KPI: Filter by event type (discharge, task, transport, approval)
  - KPI: Sync indicator: "Last synced 5 min ago"

---

### 18.0 Facility Contracting & Rate Management

**Schema & Data Layer**

- [ ] **Contract Prisma model**
  - KPI: Fields: `id` (String, cuid), `facilityId` (String, FK→Facility), `hospitalId` (String, FK→Hospital), `name` (String), `rateTable` (Json — array of { careLevel, rate, unit }), `effectiveDate` (DateTime), `expirationDate` (DateTime?), `autoRenew` (Boolean, default true), `status` (ContractStatus enum: "draft"|"active"|"expired"|"terminated"), `signedAt` (DateTime?), `signedById` (String?), `notes` (Text?), `createdAt`, `updatedAt`
  - KPI: Data-access: `createContract()`, `updateContract()`, `getContractsForFacility(facilityId)`, `getContractsForHospital(hospitalId)`, `getExpiringContracts(organizationId, withinDays)`

**UI**

- [ ] **Contract display on facility detail**
  - KPI: "Contracts" section showing list of contracts with hospital name, status badge, effective/expiration dates
  - KPI: Click contract to expand rate table: care level per-row with negotiated rate
  - KPI: "Add Contract" button (admin only) opening a form: select hospital, rate table input, effective date, expiration date, notes

- [ ] **Rate display on matching/comparison**
  - KPI: When a hospital user views facilities they have a contract with, show estimated cost in comparison view
  - KPI: Cost = rate from contract matching patient's required care level
  - KPI: If no contract exists, show "Rate not available" / request quote placeholder

- [ ] **Contract expiry notifications**
  - KPI: Background job (API route called by cron) checks daily for contracts expiring within 30 days
  - KPI: Notification sent to admins: "Contract with [facility] expires on [date]"
  - KPI: Contract status auto-transitions to "expired" on expiration date

---

### 19.0 Medicare/Medicaid Coverage Checker

**Real-Time Check**

- [ ] **Coverage validation function**
  - KPI: `checkCoverage(patient: { insurance }, facility: { acceptsMedicare, acceptsMedicaid, insuranceAccepted[] })` returns `{ eligible: boolean, reasons: string[] }`
  - KPI: Logic: if patient insurance.type is "medicare" → check facility.acceptsMedicare; if "medicaid" → check facility.acceptsMedicaid; if "private" → check patient.insurance.provider in facility.insuranceAccepted[]
  - KPI: Function is pure (no DB calls, synchronous)

**UI Integration**

- [ ] **Coverage warning on placement creation**
  - KPI: On `/placements/new`, when facility is selected, show coverage check result inline
  - KPI: If not covered: yellow warning badge "⚠ Insurance may not be accepted — verify with facility"
  - KPI: If covered: green check "✓ Insurance accepted"
  - KPI: Unchecked (no facility selected): gray "Select facility to check coverage"

- [ ] **Coverage indicator in comparison view**
  - KPI: Column in comparison table: "Coverage" with green check / red X / yellow warning
  - KPI: Warning if some insurance plans accepted but not the patient's specific plan

- [ ] **Coverage filter on facility search**
  - KPI: Filter toggle: "Show only facilities accepting patient's insurance" on placement creation and bed board
  - KPI: Default: on, when a patient context exists

---

## P3 — Future / Nice-to-Have

### 20.0 Mobile-Responsive Companion

**Responsive Audit**

- [ ] **Audit all dashboard pages for mobile breakpoints**
  - KPI: Every page tested at 320px, 375px, 768px, 1024px widths
  - KPI: No horizontal scroll on any page at any tested width
  - KPI: Tables gracefully collapse or use horizontal scroll
  - KPI: All touch targets minimum 44x44px (WCAG)
  - KPI: Font sizes readable without zoom at 375px

**Navigation**

- [ ] **Bottom navigation bar for mobile**
  - KPI: Bottom tab bar replaces sidebar on screens <768px
  - KPI: Tabs: Dashboard, Patients, Facilities, Placements, More (hamburger menu)
  - KPI: Active tab highlighted, unread notification badge on relevant tab
  - KPI: Smooth transition when switching tabs (no full page reload)
  - KPI: Tab bar hides on scroll down, shows on scroll up (iOS pattern)

**Touch Optimization**

- [ ] **Touch-optimized interactions**
  - KPI: Swipe gestures: swipe left on placement card to reveal "Approve"/"Cancel" actions
  - KPI: Pull-to-refresh on list pages (patients, facilities, placements)
  - KPI: Long-press on table rows shows context menu (mobile only)
  - KPI: All interactive elements respond to touch with visual feedback (ripple or scale)

**PWA**

- [ ] **PWA setup**
  - KPI: `manifest.json` with `display: standalone`, app name "CareBridge", theme color matching brand, icons in multiple sizes (192x192, 512x512)
  - KPI: Service worker registered, caches app shell and API responses for offline viewing
  - KPI: "Add to Home Screen" prompt on supported browsers (after 2 visits)
  - KPI: Offline page: "You're offline. Some features may be unavailable." with cached data display
  - KPI: `next.config.ts` updated with PWA headers

---

### 21.0 Public Facility Directory Portal

**Public Pages**

- [ ] **Public-facing facility search (no auth)**
  - KPI: Route at `/public/facilities` — no Clerk middleware protection
  - KPI: Search by facility name, type, city, state, care level
  - KPI: Results displayed as cards with: name, type, city/state, care levels, rating
  - KPI: Pagination (20 per page)
  - KPI: Rate-limited: max 30 requests per minute per IP

- [ ] **Public facility detail page at `/public/facilities/[id]`**
  - KPI: Read-only view: name, type, address, phone, website, care levels, specialties, rating, photos
  - KPI: No patient data, no placement data, no occupancy data visible
  - KPI: SEO metadata: description, Open Graph tags, JSON-LD structured data (LocalBusiness schema)
  - KPI: Leaflet map showing facility location

**Lead Capture**

- [ ] **Lead capture form**
  - KPI: "Interested in this facility? Contact us" form on public detail page
  - KPI: Fields: name, email, phone, organization, message (optional)
  - KPI: GDPR-compliant: consent checkbox "I agree to be contacted"
  - KPI: Form submission creates a `Lead` record in DB
  - KPI: Notification sent to org admins on new lead

**SEO**

- [ ] **SEO optimization**
  - KPI: Unique `<title>` and `<meta name="description">` per facility page
  - KPI: Open Graph tags: `og:title`, `og:description`, `og:image` (facility photo), `og:type: business.business`
  - KPI: JSON-LD structured data with `@type: LocalBusiness` or `@type: MedicalBusiness`
  - KPI: Sitemap at `/sitemap.xml` including all public facility URLs
  - KPI: `robots.txt` with correct public/disallowed paths

---

### 22.0 Patient Portal / Family View

**Role & Auth**

- [ ] **New Clerk role: `family-guardian`**
  - KPI: Role added to `UserRole` enum and RBAC permission matrix
  - KPI: Permission set: `patients:read` (self only, scoped to single patient by `guardianPatientId` relationship), zero create/update/delete permissions
  - KPI: Data-access functions check `guardianPatientId` scoping for this role

**Read-Only View**

- [ ] **Guardian dashboard at `/portal`**
  - KPI: Logged-in guardian sees only their linked patient's info
  - KPI: Sections: patient name, status badge, current facility (if placed), timeline (read-only), admissions/discharge dates
  - KPI: No edit buttons, no create buttons, no navigation to other patients
  - KPI: Header shows "Welcome, [name] — [Patient Name]'s Care Team"

**Secure Share Links**

- [ ] **Share link generation**
  - KPI: Social worker can generate a share link from patient detail page: "Share with Family"
  - KPI: Link format: `/share/[token]` where token is a random 64-char hex string
  - KPI: Token expires after configurable duration (default 30 days, max 90 days)
  - KPI: ShareLinkToken model: `id`, `patientId`, `token` (unique), `createdById`, `expiresAt`, `createdAt`

- [ ] **Shared patient view (no login required)**
  - KPI: `/share/[token]` page requires no authentication
  - KPI: Shows: patient name (first name only for privacy), status, facility, timeline (anonymized — no staff names)
  - KPI: Expired link shows: "This link has expired. Please ask your care team for a new one."
  - KPI: Invalid link shows 404

---

### 23.0 EHR Integration (Epic / Cerner)

**Patient Sync via FHIR**

- [ ] **FHIR patient demographic sync**
  - KPI: FHIR client library configured (`fhirclient` or direct REST)
  - KPI: `GET /api/fhir/Patient?identifier={mrn}` returns FHIR Patient resource
  - KPI: Mapping: FHIR Patient → CareBridge Patient (name, DOB, gender, address, phone, MRN)
  - KPI: Scheduled sync: daily job fetches new/updated patients from FHIR endpoint
  - KPI: Manual sync: "Sync from EHR" button on patient list page

**ADT Feed**

- [ ] **ADT feed processing endpoint**
  - KPI: `POST /api/integrations/adt` accepts HL7 v2 ADT messages
  - KPI: Parses ADT events: A01 (admission), A02 (transfer), A03 (discharge), A08 (update)
  - KPI: Maps to CareBridge actions: A01 → create patient if new / update status to admitted; A03 → update patient status to discharged; A08 → update patient demographics
  - KPI: Authenticated via static API key in header
  - KPI: Idempotent: duplicate ADT messages don't create duplicate patients (matched on MRN + facility + timestamp dedup)

**Document Exchange**

- [ ] **Document import from EHR**
  - KPI: Fetch clinical documents from FHIR `DocumentReference` endpoint
  - KPI: Download and store in S3, create `PatientDocument` record
  - KPI: Supported formats: PDF, CDA, plain text
  - KPI: Manual trigger: "Import Documents" button on patient page

- [ ] **Document export to EHR**
  - KPI: Export discharge summary PDF back to EHR via FHIR `DocumentReference` create
  - KPI: Configured per-organization: FHIR server URL, auth credentials, export enabled/disabled

**SMART-on-FHIR Launch**

- [ ] **SMART-on-FHIR launch context**
  - KPI: Launch endpoint at `/api/fhir/launch` handles EHR launch
  - KPI: Extracts patient context from launch and auto-navigates to patient page
  - KPI: Supports standalone launch (user selects patient within CareBridge)
  - KPI: Configuration page at `/settings/ehr` for FHIR endpoint, client ID, scope

---

### 24.0 Facility Quality Scorecards

**Data Model**

- [ ] **QualityScorecard model**
  - KPI: Fields: `id` (String, cuid), `facilityId` (String, FK→Facility), `period` (String, e.g., "2026-Q2"), `readmissionRate` (Float?), `patientSatisfaction` (Float?, 0-100), `complaintCount` (Int?), `starRating` (Float?, 1-5), `dataSource` (String: "manual"|"api"|"calculated"), `submittedAt` (DateTime), `submittedById` (String?)
  - KPI: Unique constraint on `(facilityId, period)`
  - KPI: Data-access: `getScorecard(facilityId, period?)`, `getScorecardHistory(facilityId, periods)`, `upsertScorecard(data)`

**UI Display**

- [ ] **Scorecard section on facility detail page**
  - KPI: Section shows latest period's metrics in a grid: readmission rate, patient satisfaction bar, complaint count, star rating
  - KPI: Trend arrows vs previous period (up/down/flat) for each metric
  - KPI: Historical table: period, readmission rate, satisfaction, complaints, stars
  - KPI: Mini sparkline chart for each metric over last 6 periods

- [ ] **Trend indicators**
  - KPI: Green up arrow (↑ improving) for: satisfaction increase, complaint decrease, readmission rate decrease
  - KPI: Red down arrow (↓ declining) for: opposite movements
  - KPI: Gray dash (— no change) for: within 1% of previous period

**Data Entry**

- [ ] **Manual data entry form**
  - KPI: "Update Scorecard" button (admin/facility-coordinator) opens a form
  - KPI: Fields: period (month-year picker), readmission rate %, satisfaction score 0-100, complaint count, star rating 1-5
  - KPI: "Save" → upserts scorecard for that period

---

### 25.0 On-Call / Shift Scheduling

**Schema & Data Layer**

- [ ] **Shift Prisma model**
  - KPI: Fields: `id` (String, cuid), `userId` (String, FK→User), `organizationId` (String, FK→Org), `role` (UserRole — the role the user is serving in this shift), `startAt` (DateTime), `endAt` (DateTime, must be > startAt), `department` (String?), `status` (ShiftStatus enum: "scheduled"|"active"|"completed"|"cancelled"), `handoffNotes` (Text?), `createdAt`, `updatedAt`
  - KPI: Index on `(organizationId, startAt, endAt)` for schedule queries
  - KPI: Data-access: `createShift()`, `getShiftsForOrg(organizationId, startDate, endDate)`, `getShiftsForUser(userId, startDate, endDate)`, `updateShift()`, `cancelShift()`

**UI**

- [ ] **Schedule view at `/schedule`**
  - KPI: Week view by default, with month toggle
  - KPI: Each day column shows shifts as colored blocks: user name, role, time range
  - KPI: Click shift block opens detail modal: user, role, time, department, handoff notes
  - KPI: "Add Shift" button opens creation form: user select, date picker, time range, role, department

- [ ] **Handoff notes**
  - KPI: "Add Handoff Notes" button on active/completed shifts
  - KPI: Text area: "Notes for next shift" — visible to next user in same role
  - KPI: Handoff notes displayed at shift handoff time (last hour of shift)

- [ ] **Coverage gap detection**
  - KPI: Highlight time slots with no coverage in red on schedule view
  - KPI: Notification to admin 24 hours before uncovered shift starts
  - KPI: Coverage report: shifts covered vs uncovered per week

---

### 26.0 API Rate Limiting & Usage Tracking

**Middleware**

- [ ] **Rate limiter implementation**
  - KPI: Middleware in `src/lib/rate-limit.ts` using upstash-redis (preferred) or in-memory Map fallback
  - KPI: Configurable per-endpoint limits: `{ windowMs: number, maxRequests: number }`
  - KPI: Rate limit key: combination of userId + IP + endpoint pattern
  - KPI: Default limits: 100 requests/minute for authenticated, 20 requests/minute for unauthenticated
  - KPI: Public API endpoints have stricter limits: 30/min

**Headers**

- [ ] **Rate limit headers on all API responses**
  - KPI: `X-RateLimit-Limit` — max requests per window
  - KPI: `X-RateLimit-Remaining` — remaining requests in current window
  - KPI: `X-RateLimit-Reset` — Unix timestamp when window resets
  - KPI: `Retry-After` — seconds to wait when limit exceeded
  - KPI: Headers present on all API routes, including error responses

**Enforcement**

- [ ] **Rate limit exceeded handling**
  - KPI: 429 status code with JSON body: `{ error: "rate_limit_exceeded", message: "Too many requests. Please wait X seconds.", retryAfter: number }`
  - KPI: Rate limit bypass for superadmin role (configurable in env)
  - KPI: Rate limit state stored in Redis with TTL matching window

**Usage Dashboard**

- [ ] **API usage admin page at `/admin/api-usage`**
  - KPI: Charts: requests per hour/day/week, top endpoints, top users
  - KPI: Table: user, endpoint, request count in current period, rate limit hits
  - KPI: "Rate Limit Config" section showing current limits and allowing admin override
  - KPI: Export usage data to CSV
  - KPI: Skeleton loading state

---

## Already In Progress (from tasks/)

- [ ] **Facility detail / create / edit / delete pages** (`tasks/todo.md`)
- [ ] **Patient detail / create / edit / delete pages** (`tasks/patient-plan.md`)
- [ ] **Loading skeleton + error states for facility and patient pages**

---

## Legacy / Already Built (v0.1.0 — no action needed)

- [x] Patient CRUD (list + API + data access)
- [x] Facility CRUD (list + API + data access)
- [x] Placement workflow (8-step pipeline + matching algorithm)
- [x] Hospital management (CRUD + image upload)
- [x] User management (list, invite codes, join requests)
- [x] Organization onboarding (create/join flow)
- [x] Role-based access control (6 roles, 26 permissions)
- [x] Role-adaptive dashboards (staff, facility, admin)
- [x] S3 file storage (presigned URLs for media + documents)
- [x] Clerk authentication (email/password, Google OAuth, webhooks)
- [x] AI chat assistant (OpenAI-powered, streaming, chat history)
- [x] Facility matching algorithm (scoring-based)
- [x] Activity / audit event tracking
- [x] Leaflet map integration
- [x] TanStack data tables (sorting, filtering, pagination)
- [x] Dark mode
- [x] Dashboard skeletons (section-level + composition)
- [x] Responsive sidebar with permission filtering
- [x] 63 shadcn/ui components installed
