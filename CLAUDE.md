# CLAUDE.md - Guidelines for AI Assistants Working on CareBridge

This document provides essential context for AI assistants (Claude, Copilot, etc.) working on the CareBridge codebase.

## Critical Rules

### 1. Next.js 16

This project uses **Next.js 16**, which has breaking changes from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing any page or API route code. Heed deprecation notices.

### 2. Data Tables: TanStack Table Only

**Always** use `@tanstack/react-table` v8 for data tables. Never use plain HTML `<table>` elements for data display.

### 3. Dashboard UI: shadcn/ui Only

All pages under `src/app/(app)/dashboard/` **must** use shadcn UI components from `@/components/ui/`. No plain HTML where a shadcn component exists. Install new components with `npx shadcn add <component>`.

### 4. Dashboard Skeletons Required

Every dashboard page **must** have a matching skeleton in `src/components/dashboard-skeletons.tsx`:
- Section-level skeletons for each distinct block
- A composition skeleton that assembles them into a full-page loading state

### 5. Database Queries: Data Access Layer Only

Never import Prisma directly in pages or API routes. All queries go through `src/lib/data-access.ts`, which handles org scoping, enum conversion, and validation.

---

## Project Architecture

### Tech Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS v4** + **shadcn/ui** (base-luma style, @base-ui/react primitives)
- **PostgreSQL** + **Prisma ORM v7** (client generated to `src/generated/prisma/`)
- **Clerk** for auth (`@clerk/nextjs` v7)
- **TanStack React Table v8** for data tables
- **S3-compatible storage** for file uploads (presigned POST URLs)

### Key Files

| File | Purpose |
|---|---|
| `src/lib/data-access.ts` | Org-scoped data access layer (47 functions) |
| `src/lib/permissions.ts` | RBAC system (6 roles, 26 permissions, route access map) |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/proxy.ts` | Clerk middleware (auth + route protection) |
| `prisma/schema.prisma` | Database schema (12 models, 11 enums) |
| `src/components/dashboard-skeletons.tsx` | Loading skeleton components |

### Multi-Tenancy

All data is scoped by `organizationId`. The data access layer enforces this:
- Regular users: queries filter by their `organizationId`
- Superadmins: bypass org filtering on reads
- Cross-org: only the facility network search (`searchFacilities()`) allows cross-org reads

### Enum Convention

Prisma uses `SCREAMING_SNAKE_CASE` (e.g., `SOCIAL_WORKER`). The UI uses `kebab-case` (e.g., `social-worker`). Conversion happens in the data access layer.

### Auth Patterns (API Routes)

```typescript
// Pattern 1: Manual (most CRUD routes)
const { userId } = await auth();
const { organizationId, role } = await getServerOrganization();
if (!roleHasPermission(role, 'resource:action')) return Response(403);

// Pattern 2: Combined helper (preferred for new routes)
const { userId, org } = await requireOrgPermission('resource:action');
```

### File Upload Pattern

Uses presigned POST URLs:
1. Client requests presigned URL from API (`POST /api/.../upload`)
2. Client uploads directly to S3 using the presigned URL
3. Client creates metadata record via API (`POST /api/.../`)

---

## Code Organization

```
src/app/                  # Pages and API routes (App Router)
src/components/ui/        # shadcn/ui components (do not edit directly)
src/components/layout/    # Sidebar, header, navbar, footer
src/components/auth/      # Permission guard components
src/components/forms/     # Entity form components
src/components/media/     # File upload components
src/hooks/                # Custom hooks (permissions, org, theme)
src/lib/                  # Utilities, data access, permissions
src/types/                # TypeScript type definitions
```

---

## Documentation

- **[README.md](README.md)** -- Project overview and quick start
- **[AGENTS.md](AGENTS.md)** -- Project legacy rules for AI agents
- **[docs/api-reference.md](docs/api-reference.md)** -- Complete API documentation
- **[docs/data-model.md](docs/data-model.md)** -- Database schema and relationships
- **[docs/development.md](docs/development.md)** -- Development workflow and patterns
- **[docs/deployment.md](docs/deployment.md)** -- Deployment guide
- **[docs/decisions/](docs/decisions/)** -- Architecture Decision Records (8 ADRs)
- **[CONTRIBUTING.md](CONTRIBUTING.md)** -- Contributing guidelines
- **[CHANGELOG.md](CHANGELOG.md)** -- Version history
