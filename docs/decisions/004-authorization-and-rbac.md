# ADR-004: Authorization & RBAC System

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision-makers:** Engineering Team

## Context

CareBridge needs flexible authorization:
- Different user roles need different permissions
- Super admins need full access
- Hospital admins manage their own users
- Social workers manage patients/placements
- Facility coordinators manage their facility
- Need to protect routes and API endpoints

## Decision

Build a custom **Role-Based Access Control (RBAC)** system, defined in `src/lib/permissions.ts`.

### Roles defined:
- `superadmin`: Full platform access
- `administrator`: Hospital admin, manages hospital users
- `social-worker`: Manages patients & placements
- `discharge-planner`: Coordinates discharges
- `facility-coordinator`: Manages facility placements
- `customer`: Limited external access

### Permissions structure:
Format: `<resource>:<action>`, e.g.:
- `patients:read`
- `placements:approve`
- `users:manage-roles`
- `dashboard:admin`

### Implementation details:
- Role-to-permissions map defined in `ROLE_PERMISSIONS`
- Helper functions to check permissions: `roleHasPermission`, `canRoleAccessRoute`
- React hooks and server utilities available
- Route access map `ROUTE_ACCESS` to protect pages

## Consequences

### Positive
- Fine-grained control
- Easy to add new roles/permissions
- Works on server and client
- Clear separation of concerns

### Trade-offs
- Custom code instead of off-the-shelf solution (but simple enough for our needs)
- Need to keep permissions in sync as app grows

## Alternatives Considered
- **Clerk Roles/Permissions** - good but less flexible than custom
- **Casl** - popular library, but custom is simpler for our needs
- **Zodiac** - not exactly authorization
- **Next.js Middleware** - part of solution, but need per-route checks too
