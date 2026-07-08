# Changelog

All notable changes to CareBridge Health are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-07-09

### Added

- **Facility Network Dashboard** -- Cross-organization facility browsing and search with detail pages
- **Facility Management** -- Full CRUD for care facilities with media uploads (images, videos, 3D gaussian splats)
- **Patient Management** -- Full CRUD for patient records with document uploads (PDF, DOCX, images)
- **Placement Workflow** -- End-to-end placement pipeline with intelligent facility matching algorithm
- **Hospital Management** -- Hospital CRUD with image and logo upload support
- **User Management** -- Admin panel for managing users within an organization
- **Invite Code System** -- Generate reusable invite codes with optional role assignment, usage limits, and expiration
- **Join Request Workflow** -- Users request to join organizations via invite codes; admins approve or deny
- **Organization Onboarding** -- Step-by-step flow for creating or joining an organization
- **Role-Based Access Control** -- 6 roles with 26 granular permissions across 8 resources
- **Role-Adaptive Dashboard** -- Separate dashboard views for staff, facility coordinators, and administrators
- **S3 File Storage** -- Presigned URL upload flow for facility media and patient documents
- **Clerk Authentication** -- Email/password and Google OAuth with webhook-based user sync
- **Permission Guards** -- Server-side and client-side permission checking (`Can`, `RequirePermission`, `DashboardGuard`)
- **Dashboard Skeletons** -- Section-level and composition loading skeletons for all dashboard pages
- **Dark Mode** -- Full dark mode support in the dashboard via CSS custom properties
- **Public Landing Page** -- Marketing-style landing page with hero, features, and footer
- **Activity Feed** -- Audit trail of patient, placement, and facility events
- **Facility Matching Algorithm** -- Scoring-based matching considering care level, availability, insurance, location, and ratings
- **Responsive Sidebar** -- Permission-filtered navigation with role badges and Clerk user button

### Architecture Decisions

- [ADR-001](docs/decisions/001-tech-stack-and-architecture.md): Next.js 16 + React 19 + Tailwind v4 + shadcn/ui
- [ADR-002](docs/decisions/002-database-and-orm.md): PostgreSQL + Prisma ORM v7
- [ADR-003](docs/decisions/003-authentication.md): Clerk for authentication
- [ADR-004](docs/decisions/004-authorization-and-rbac.md): Custom RBAC system
- [ADR-005](docs/decisions/005-organization-onboarding-flow.md): Custom org model with invite codes
- [ADR-006](docs/decisions/006-s3-file-storage.md): S3 presigned URL upload pattern
- [ADR-007](docs/decisions/007-facility-matching-algorithm.md): Scoring-based facility matching
- [ADR-008](docs/decisions/008-dashboard-architecture.md): Role-adaptive dashboard with skeletons
