# Facility CRUD — Task List

## Phase 1: Foundation

### Task 1: Add data-access functions
- [ ] Add `getFacility(id, organizationId, role)` — single facility fetch
- [ ] Add `createFacility(data, organizationId, role)` — create with org-scoping
- [ ] Add `updateFacility(id, data, organizationId, role)` — update with permission check
- [ ] Add `deleteFacility(id, organizationId, role)` — delete with permission check
- **Files:** `src/lib/data-access.ts`
- **Verification:** Build succeeds

### Task 2: Add facility CRUD API routes
- [ ] `src/app/api/facilities/route.ts` — GET (list all, org-scoped), POST (create)
- [ ] `src/app/api/facilities/[id]/route.ts` — GET (single), PATCH (update), DELETE (delete)
- [ ] Each endpoint checks auth via Clerk `auth()` and permissions via role
- **Files:** `src/app/api/facilities/route.ts`, `src/app/api/facilities/[id]/route.ts`
- **Verification:** Build succeeds

## Phase 2: Pages

### Task 3: Detail page (`/facilities/[id]`)
- [ ] Server component that fetches facility by ID
- [ ] Profile info section: name, type badge, address, phone, email, website, contacts
- [ ] Capacity section: occupancy/capacity bar with availability status, waitlist days
- [ ] Details section: licensure, accreditations, insurance accepted, care levels, specialties, rating
- [ ] Edit button (visible for admin/superadmin)
- [ ] Delete button with confirmation dialog (visible for admin/superadmin)
- [ ] Placements section: list placements filtered to this facility
- [ ] Staff section: list facility coordinators for this facility
- **Files:** `src/app/(app)/facilities/[id]/page.tsx`
- **Verification:** Navigate to `/facilities/fac-001` — see full facility info

### Task 4: Create page (`/facilities/new`)
- [ ] Client component form with all facility fields
- [ ] Sections: basic info (name, type), address, contact info (phone, email, website), contacts array, licensure/accreditations (tag inputs), capacity, insurance, care levels, rating
- [ ] On submit: POST to `/api/facilities`; redirect to `/facilities/[newId]` on success
- [ ] Cancel button returns to list page
- **Files:** `src/app/(app)/facilities/new/page.tsx`
- **Verification:** Fill form, submit — facility appears in list

### Task 5: Edit page (`/facilities/[id]/edit`)
- [ ] Client component form, same layout as create
- [ ] Pre-populated fields from existing facility (fetched via `getFacility`)
- [ ] On submit: PATCH to `/api/facilities/[id]`; redirect to detail page on success
- **Files:** `src/app/(app)/facilities/[id]/edit/page.tsx`
- **Verification:** Edit a facility, save — detail page shows updated values

### Task 6: Delete action on detail page
- [ ] "Delete facility" button in a danger zone section
- [ ] Opens shadcn Dialog for confirmation
- [ ] On confirm: DELETE to `/api/facilities/[id]`; redirect to list page
- [ ] Show error if facility has active placements
- **Files:** `src/app/(app)/facilities/[id]/page.tsx` (integrated into detail page)
- **Verification:** Delete a facility — it disappears from the list

## Phase 3: Integration

### Task 7: Update list page
- [ ] Wrap each facility card with `<Link href={/facilities/${facility.id}}>` for navigation to detail
- [ ] Replace "Filter" button with conditional "New Facility" button (visible for admin/superadmin)
- **Files:** `src/app/(app)/facilities/page.tsx`
- **Verification:** Click a card → navigates to detail page

### Task 8: Route permissions
- [ ] Add `/facilities/[id]` route to `ROUTE_ACCESS` requiring `facilities:read`
- [ ] Add `/facilities/new` route requiring `facilities:create`
- [ ] Add `/facilities/[id]/edit` route requiring `facilities:update`
- **Files:** `src/lib/permissions.ts`
- **Verification:** Route access checks work correctly

## Phase 4: Polish

### Task 9: Loading & error states
- [ ] Add `loading.tsx` with facility-specific skeleton for detail page
- [ ] Add `error.tsx` for facility routes
- [ ] Add facility skeleton components to `dashboard-skeletons.tsx`
- **Files:** `src/app/(app)/facilities/[id]/loading.tsx`, `src/app/(app)/facilities/[id]/error.tsx`, `src/components/dashboard-skeletons.tsx`
- **Verification:** Loading skeleton appears during page load

## Verification Checklist

- [ ] Build passes: `npm run build`
- [ ] Facility list cards link to detail page
- [ ] Detail page shows profile, capacity, placements, staff
- [ ] Create form works end-to-end (creates facility, redirects to detail)
- [ ] Edit form works end-to-end (saves changes, reflects on detail)
- [ ] Delete works with confirmation and redirects to list
- [ ] Admin/superadmin can see create/edit/delete buttons
- [ ] Facility Coordinator cannot see create/edit/delete buttons
- [ ] Loading skeleton renders during page load
