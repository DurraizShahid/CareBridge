# Implementation Plan: Patient CRUD Pages

Same architecture as facility CRUD — org-scoped data-access functions, API routes, server component pages, shared client form.

## Tasks

1. Data-access functions: `getPatient`, `createPatient`, `updatePatient`, `deletePatient`
2. API routes: `GET/POST /api/patients`, `GET/PATCH/DELETE /api/patients/[id]`
3. Detail page: profile/demographics, medical info, placements, activity
4. Create page: full form at `/patients/new`
5. Edit page: pre-populated form at `/patients/[id]/edit`
6. Delete dialog on detail page
7. Update list page: link table rows, wire "Add Patient" button
8. Route permissions for new pages
9. Loading skeleton + error states
