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

## Decision

### Framework: Next.js 16 (App Router)

Next.js provides server-side rendering for fast initial loads, file-based routing for clear page structure, and React Server Components for secure data access without exposing API tokens to the client.

- **App Router** — nested layouts, loading states, error boundaries at route level
- **React Server Components** — data fetching on the server, minimal client JS
- **API Routes** — lightweight backend endpoints co-located with pages

### Styling: Tailwind CSS v4 + shadcn/ui (base-nova)

Tailwind CSS v4 provides a utility-first workflow with the `@theme` directive for design tokens. shadcn/ui provides accessible, unstyled primitives via Base UI React that we customize to our brand.

- **Design tokens** — colors, fonts, spacing defined as CSS custom properties in `@theme`
- **Semantic colors** — `health` (teal) and `warmth` (coral) added as domain-specific tokens beyond shadcn defaults
- **Dark mode** — supported via `.dark` class variant with adjusted deep navy background

### Typography: Lato + Open Sans via next/font/google

- **Lato** — headings (clean, modern, confident)
- **Open Sans** — body (highly readable at all sizes)
- Both self-hosted at build time — zero external network requests, no layout shift

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
/                  → Public landing page
/(app)             → Authenticated app shell (sidebar layout)
  /dashboard       → Overview with stats, recent activity, alerts
  /patients        → Patient list, search, intake
  /patients/[id]   → Patient detail, assessment, placement history
  /facilities      → Care setting directory with filters
  /facilities/[id] → Facility detail, availability, contacts
  /placements      → Active placement workflow tracker
  /placements/[id] → Placement detail, status, documents
```

### Data Strategy

For the initial build, data will be mocked with realistic TypeScript types and sample data. This enables:

- Fully interactive UI development without backend dependency
- Iterative refinement of domain models before API design
- Parallel frontend/backend development

Domain entities follow a DDD-light approach with clear type definitions and separation between entities and value objects.

## Consequences

### Positive

- **Fast development velocity** — Next.js convention-over-configuration, pre-built UI primitives
- **Strong type safety** — TypeScript throughout, Zod-ready for runtime validation
- **SEO & performance** — server rendering, automatic code splitting, font optimization
- **Accessible baseline** — Base UI React provides ARIA-compliant primitives

### Trade-offs

- **Mock data dependency** — UI works in isolation but needs API contract alignment before production
- **Tailwind CSS v4 ecosystem** — newer version means fewer community resources than v3
- **Next.js 16** — latest major version; some patterns differ from Next.js 12-14 docs

## Alternatives Considered

- **Remix** — similar SSR model but smaller ecosystem for UI primitives
- **Vite + React Router** — more flexible but requires manual SSR setup and lacks file-based routing
- **Material UI** — comprehensive but heavier and harder to customize to a specific brand
