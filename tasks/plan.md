# Implementation Plan: Facility CRUD Pages

## Overview

Build facility detail (`/facilities/[id]`), create (`/facilities/new`), edit (`/facilities/[id]/edit`), and delete (on detail page) functionality. The list page exists at `/facilities` but cards aren't clickable, there are no detail/create/edit pages, and no way to mutate facility data. Facility Coordinators are read-only; Administrators and Superadmins have full CRUD.

## Architecture Decisions

1. **API routes for mutations** — Follow the existing pattern (invite-codes, join-requests, create-org). Use REST API routes at `/api/facilities` (POST) and `/api/facilities/[id]` (PATCH, DELETE) for mutations.
2. **Server components for reads** — Detail page fetches facility data server-side via `getFacility(id, orgId, role)`, matching the existing list page pattern.
3. **Client form components** — Create and edit forms are client components that POST/PATCH to the API routes.
4. **Permission gating** — Server-side: check role + permission in API routes. Client-side: use `usePermissions().can()` to show/hide actions and buttons.
5. **Detail page layout** — Sections: profile info (name, type, address, contacts) → capacity/occupancy → placements list filtered by facility → staff/coordinators list.
6. **No new shadcn components needed** — Button, Input, Label, Select, Dialog, Card, Badge, Separator, Textarea are already installed.
7. **Route permissions** — `/facilities/[id]` uses existing `facilities:read`; new routes will need explicit route access entries.

## Task List

### Phase 1: Foundation (Data + API)

- [ ] Task 1: Add data-access functions — `getFacility`, `createFacility`, `updateFacility`, `deleteFacility`
- [ ] Task 2: Add facility CRUD API routes — `GET /api/facilities` (list), `POST /api/facilities` (create), `GET /api/facilities/[id]`, `PATCH /api/facilities/[id]`, `DELETE /api/facilities/[id]`

### Checkpoint: Foundation
- [ ] Build succeeds: `npm run build`

### Phase 2: Pages

- [ ] Task 3: Detail page at `/facilities/[id]` — profile info, capacity, placements list, staff list
- [ ] Task 4: Create page at `/facilities/new` with form (all facility fields)
- [ ] Task 5: Edit page at `/facilities/[id]/edit` with form (pre-populated from existing facility)
- [ ] Task 6: Delete action on detail page with confirmation dialog

### Checkpoint: Pages
- [ ] Manual flow test: navigate list → detail → edit → save → verify changes

### Phase 3: Integration

- [ ] Task 7: Update list page — link cards to detail page (`<Link>` wrapper), add "New Facility" button for admin/superadmin
- [ ] Task 8: Add route permissions for new pages in `ROUTE_ACCESS`

### Phase 4: Polish

- [ ] Task 9: Add `loading.tsx` and `error.tsx` for facility routes + facility skeletons in `dashboard-skeletons.tsx`

### Checkpoint: Complete
- [ ] Build succeeds: `npm run build`
- [ ] All acceptance criteria met
- [ ] Ready for review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `crypto.randomUUID()` requires Node 19+ | Med | Prisma schema already uses `@default(cuid())` — use Prisma's auto-generated IDs or fallback to manual UUID |
| Form has many fields (address, contacts, arrays) | Med | Break into logical sections in the form UI; use existing `Address` and `Contact` type patterns |
| Delete may cascade to placements | High | Placements reference `facilityId` (optional). Disallow deletion if active placements exist, or handle the cascade |

## Open Questions

None — confirmed during interview-me.
