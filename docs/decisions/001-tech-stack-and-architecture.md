# ADR-001: Tech Stack & Application Architecture

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision-makers:** Engineering Team

## Context

CareBridge Health needs a modern, maintainable web platform for hospital social workers and discharge planners. The platform must be:

- **Desktop-first with responsive mobile** — social workers use desktop during shifts but need mobile access on the go
- **Secure & compliant** — handle PHI with HIPAA-appropriate safeguards
- **Fast & reliable** — placement decisions are time-sensitive
- **Extensible** — facility network, insurance integrations, analytics all planned
- **Multi-tenant** — support for multiple hospitals and care facilities with data isolation

## Decision

### Framework: Next.js 16 (App Router)

Next.js provides server-side rendering for fast initial loads, file-based routing for clear page structure, and React Server Components for secure data access without exposing API tokens to the client.

- **App Router** — nested layouts, loading states, error boundaries at route level
- **React Server Components** — data fetching on the server, minimal client JS
- **API Routes** — lightweight backend endpoints co-located with pages

### Database & ORM: PostgreSQL + Prisma

PostgreSQL is our primary database with Prisma ORM for type-safe database access.

- **PostgreSQL** — robust, ACID-compliant relational database
- **Prisma ORM** — type-safe database client, declarative schema, automatic migrations
- **Prisma Client** — generated in `src/generated/prisma`

### Authentication: Clerk

Clerk is our authentication and user management platform.

- **Secure authentication** — built-in support for sign-in, sign-up, and user profiles
- **Organization support** — multi-tenant isolation
- **Webhooks** — sync user data to our database

### Authorization: Custom RBAC System

We have a custom role-based access control (RBAC) system defined in `src/lib/permissions.ts`.

- **Roles** — superadmin, administrator, social-worker, discharge-planner, facility-coordinator, customer
- **Permissions** — fine-grained resource/action permissions (e.g., `patients:read`, `placements:approve`)
- **Route guards** — protect routes based on permissions

### Styling: Tailwind CSS v4 + shadcn/ui (base-nova)

Tailwind CSS v4 provides a utility-first workflow with the `@theme` directive for design tokens. shadcn/ui provides accessible, unstyled primitives via Base UI React that we customize to our brand.

- **Design tokens** — colors, fonts, spacing defined as CSS custom properties in `@theme`
- **Semantic colors** — `health` (teal) and `warmth` (coral) added as domain-specific tokens beyond shadcn defaults
- **Dark mode** — supported via `.dark` class variant with adjusted deep navy background

### Typography: Montserrat + Open Sans via next/font/google

- **Montserrat** — headings (clean, modern, confident)
- **Open Sans** — body (highly readable at all sizes)
- Both self-hosted at build time — zero external network requests, no layout shift

### Data Tables: TanStack Table v8

All data tables use TanStack Table for sorting, filtering, pagination, etc.

### Component Architecture

```
Page Component
  └── Layout (app shell with sidebar)
        └── Feature Pages
              └── Domain Components (composed from UI primitives)
                    └── shadcn/ui Primitives (Base UI React)
```

- **Pages** — Next.js App Router pages, server components by default
- **Layouts** — route-group layouts for authenticated vs public sections
- **Domain Components** — feature-specific compositions (PatientCard, FacilityTable)
- **UI Primitives** — shadcn/ui components (Button, Card, Input, Dialog, etc.)

### Routing Structure

```
/                          → Public landing page
/(onboarding)              → Onboarding flow (no sidebar)
/(app)                     → Authenticated app shell (sidebar layout)
  /dashboard                 → Overview dashboard
    /admin                    → Admin dashboard
    /staff                    → Staff dashboard
    /facility                 → Facility dashboard
    /users                    → User management
  /patients                  → Patient list, search, intake
  /facilities                → Care setting directory with filters
  /placements                → Active placement workflow tracker
  /admin                     → Admin-only pages
/api/                       → API routes
  /me                        → Current user info
  /onboarding/create-org     → Create new organization
  /invite-codes              → Manage invite codes
  /invite-codes/validate     → Validate invite code
  /join-requests             → Manage join requests
  /join-requests/[id]        → Approve/deny join request
  /webhooks                  → Clerk webhooks
/sign-in/, /sign-up/         → Clerk authentication pages
```

### Data Strategy

We now use PostgreSQL + Prisma for production-ready data access. Domain entities are defined in the Prisma schema and TypeScript types are generated.

## Consequences

### Positive

- **Fast development velocity** — Next.js convention-over-configuration, pre-built UI primitives
- **Strong type safety** — TypeScript throughout, Prisma type-safe database access
- **Secure authentication** — Clerk handles auth security
- **Multi-tenant support** — Organizations for hospitals and facilities
- **SEO & performance** — server rendering, automatic code splitting, font optimization
- **Accessible baseline** — Base UI React provides ARIA-compliant primitives

### Trade-offs

- **Clerk dependency** — third-party auth provider dependency
- **Tailwind CSS v4 ecosystem** — newer version means fewer community resources than v3
- **Next.js 16** — latest major version; some patterns differ from Next.js 12-14 docs

## Alternatives Considered

- **Remix** — similar SSR model but smaller ecosystem for UI primitives
- **Vite + React Router** — more flexible but requires manual SSR setup and lacks file-based routing
- **Material UI** — comprehensive but heavier and harder to customize to a specific brand
- **Auth.js (NextAuth)** — self-hosted auth alternative to Clerk
- **MongoDB** — NoSQL alternative to PostgreSQL
- **Supabase Auth** — alternative to Clerk for auth + DB
