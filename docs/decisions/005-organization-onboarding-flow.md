# ADR-005: Organization Onboarding & Invite System

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision-makers:** Engineering Team

## Context

We need a way for new users to join the CareBridge platform and associate with organizations. Requirements:
- New users select organization type (hospital/facility) on sign-up
- Option to create a new organization
- Option to join an existing organization via invite code
- Organization admins need to approve/deny join requests
- System should support invite codes with optional role assignment
- Email and in-app notifications for status updates

## Decision

### 1. Custom Organization Model in PostgreSQL
We will use our own `Organization` model in PostgreSQL (instead of Clerk Organizations) for more flexibility:
- Stores `type` (hospital/facility)
- Isolated data per organization
- Supports custom logic for join requests and invites

### 2. Onboarding Flow
New users are redirected to `/onboarding` immediately after sign-up if they don't have an organization.
- Step 1: Choose organization type (hospital or facility)
- Step 2: Choose to create new org or join existing via invite code
- On successful org creation/join, user is redirected to dashboard

### 3. Invite Code System
- `InviteCode` model stores generated codes
- Codes can optionally specify a role for the user
- Codes support usage limits and expiration dates
- Codes can be disabled
- Organization admins generate codes from `/dashboard/users`

### 4. Join Request Workflow
- Users submit join requests via invite code
- `JoinRequest` model tracks request status (pending/approved/denied)
- Organization admins review requests from `/dashboard/users`
- On approval, user is added to organization with specified role

### 5. Redirection from App Layout
`src/app/(app)/layout.tsx` checks if user has `organizationId` and redirects to onboarding if missing.

## Consequences

### Positive
- Full control over organization and invite logic
- Flexible role assignment via invite codes
- User-friendly onboarding experience
- Audit trail of join requests and decisions

### Trade-offs
- More custom code than using Clerk Organizations out of the box
- Need to maintain separate org/user data from Clerk
- No real-time notifications (can be added later)

## Alternatives Considered
- **Clerk Organizations with Invitations** - built-in, but less flexible for our custom join request approval flow
- **Manual org assignment by superadmin** - poor UX, doesn't scale
- **No invite codes, only superadmin invites** - inflexible, doesn't support self-service

## Implementation Details

### Database Models:
- `Organization` with `type` enum
- `InviteCode` for invite management
- `JoinRequest` for tracking requests

### API Routes:
- `POST /api/onboarding/create-org` - Create new organization
- `GET /api/invite-codes` - List active codes for org
- `POST /api/invite-codes` - Generate new code
- `POST /api/invite-codes/validate` - Validate invite code and return org info
- `GET /api/join-requests` - List pending requests for org
- `POST /api/join-requests` - Submit new join request
- `PATCH /api/join-requests/[id]` - Approve/deny join request

### UI Components:
- `src/app/(onboarding)/onboarding/page.tsx` - Onboarding flow
- `src/app/(app)/dashboard/users/invite-codes-tab.tsx` - Invite code management
- `src/app/(app)/dashboard/users/join-requests-tab.tsx` - Join request review
