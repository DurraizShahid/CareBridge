# CareBridge Health

**Bridging hospital to home -- empowering social workers to place patients into the right care settings.**

CareBridge Health is a multi-tenant SaaS platform that enables hospital social workers and discharge planners to place patients who cannot safely return home into appropriate care settings. From initial assessment through intelligent facility matching to final placement, CareBridge streamlines the entire discharge planning workflow.

## Mission

Every patient deserves the right care beyond the hospital. CareBridge exists to eliminate the delays, inefficiencies, and information gaps that prevent timely, appropriate patient placements.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) | 16 |
| Language | [TypeScript](https://www.typescriptlang.org/) | 5 |
| Runtime | [React](https://react.dev/) | 19 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 + [shadcn/ui](https://ui.shadcn.com/) (base-luma) | 4 |
| UI Primitives | [@base-ui/react](https://base-ui.com/) | 1.6 |
| Icons | [Remixicon](https://remixicon.com/) + [Lucide React](https://lucide.dev/) | |
| Database | [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/) | 7 |
| Authentication | [Clerk](https://clerk.com/) | 7.5 |
| Tables | [TanStack React Table](https://tanstack.com/table/latest) | 8 |
| Charts | [Recharts](https://recharts.org/) | 3 |
| File Storage | AWS S3 (Railway Object Storage) | |
| Animations | [Motion](https://motion.dev/) (Framer Motion successor) | 12 |
| Toasts | [Sonner](https://sonner.emilkowal.dev/) | 2 |
| Date Utilities | [date-fns](https://date-fns.org/) | 4 |
| Theme | [next-themes](https://github.com/pacocoursey/next-themes) | |
| Package Manager | npm | |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or managed)
- [Clerk](https://clerk.com/) account
- S3-compatible storage (optional, for file uploads)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/CareBridge.git
cd CareBridge

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your actual values (see .env.example for all variables)

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:dev

# Seed the database (optional, adds sample data)
npx prisma db seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server with Turbopack |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client from schema |
| `npm run db:dev` | Run Prisma migrations in development |
| `npm run db:push` | Push schema changes directly (no migration file) |

### Environment Variables

See [`.env.example`](.env.example) for all required variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Yes | Clerk webhook signing secret |
| `S3_ACCESS_KEY_ID` | For uploads | S3 access key |
| `S3_SECRET_ACCESS_KEY` | For uploads | S3 secret key |
| `S3_BUCKET_NAME` | For uploads | S3 bucket name |
| `S3_REGION` | For uploads | S3 region |
| `S3_ENDPOINT` | For uploads | S3 endpoint URL |
| `S3_PUBLIC_URL` | For uploads | Public URL prefix for stored files |

---

## Key Features

- **Multi-Organization Support** -- Isolated data for hospitals and care facilities with org-scoped queries
- **Role-Based Access Control** -- 6 roles with 26 granular permissions across 8 resources
- **Intelligent Facility Matching** -- Scoring algorithm considering care level, availability, insurance, location, and ratings
- **Placement Workflow** -- 8-step status pipeline from referral through completion
- **Organization Onboarding** -- New users choose org type, create an org, or join via invite code
- **Invite Code System** -- Generate reusable codes with optional role assignment, usage limits, and expiration
- **Join Request Workflow** -- Users request to join, admins approve or deny
- **S3 File Storage** -- Facility media (images, videos, 3D scans) and patient documents
- **Role-Adaptive Dashboard** -- Different dashboard views for staff, facility coordinators, and admins
- **Facility Network** -- Cross-organization facility directory for discovering care settings
- **Dark Mode** -- Full dark mode support in the dashboard via CSS custom properties
- **Responsive Design** -- Desktop-first with mobile responsiveness

---

## User Roles & Permissions

CareBridge implements a custom RBAC system (see [ADR-004](docs/decisions/004-authorization-and-rbac.md)) with 6 roles:

| Role | Scope | Description |
|---|---|---|
| `superadmin` | Platform | Full access across all organizations |
| `administrator` | Organization | Manages org users, settings, and all resources |
| `social-worker` | Organization | Manages patients and creates placements |
| `discharge-planner` | Organization | Coordinates discharge workflows |
| `facility-coordinator` | Organization | Manages facility-side operations and referrals |
| `customer` | Limited | View-only access for external stakeholders |

Permissions follow a `resource:action` format (e.g., `patients:create`, `placements:approve`). See `src/lib/permissions.ts` for the complete permission map.

---

## Project Structure

```
carebridge/
├── docs/                              # Documentation
│   ├── decisions/                     # Architecture Decision Records
│   │   ├── 001-tech-stack-and-architecture.md
│   │   ├── 002-database-and-orm.md
│   │   ├── 003-authentication.md
│   │   ├── 004-authorization-and-rbac.md
│   │   ├── 005-organization-onboarding-flow.md
│   │   ├── 006-s3-file-storage.md
│   │   ├── 007-facility-matching-algorithm.md
│   │   └── 008-dashboard-architecture.md
│   ├── api-reference.md               # Complete API documentation
│   ├── data-model.md                  # Database schema and relationships
│   ├── deployment.md                  # Deployment guide
│   └── development.md                 # Development workflow guide
├── prisma/
│   ├── schema.prisma                  # Database schema (12 models, 11 enums)
│   └── seed.ts                        # Sample data seeder
├── public/Images/                     # Static images (hero, logos)
├── scripts/
│   └── configure-s3-cors.mjs          # S3 CORS configuration utility
├── src/
│   ├── app/
│   │   ├── (onboarding)/              # Onboarding flow (no sidebar layout)
│   │   │   ├── onboarding/page.tsx    # Org type selection + create/join
│   │   │   └── layout.tsx
│   │   ├── (app)/                     # Authenticated app (sidebar layout)
│   │   │   ├── layout.tsx             # Sidebar + org check + theme provider
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx           # Role-adaptive dashboard
│   │   │   │   ├── _sections/         # Dashboard section components
│   │   │   │   ├── admin/             # Admin dashboard
│   │   │   │   ├── staff/             # Staff dashboard
│   │   │   │   ├── facility/          # Facility dashboard
│   │   │   │   ├── facility-network/  # Cross-org facility directory
│   │   │   │   │   └── [id]/          # Facility network detail
│   │   │   │   ├── hospitals/         # Hospital management
│   │   │   │   └── users/             # User, invite code, join request management
│   │   │   ├── patients/              # Patient CRUD
│   │   │   │   ├── page.tsx           # Patient list
│   │   │   │   ├── new/               # Create patient
│   │   │   │   └── [id]/              # Patient detail, edit, delete
│   │   │   ├── facilities/            # Facility CRUD
│   │   │   │   ├── page.tsx           # Facility list
│   │   │   │   ├── new/               # Create facility
│   │   │   │   └── [id]/              # Facility detail, edit, delete
│   │   │   ├── placements/            # Placement workflow
│   │   │   │   ├── page.tsx           # Placement list
│   │   │   │   ├── new/               # Create placement
│   │   │   │   └── [id]/              # Placement detail, edit, delete
│   │   │   └── admin/permissions/     # Permission admin page
│   │   ├── api/                       # API routes (REST)
│   │   │   ├── me/                    # Current user profile
│   │   │   ├── webhooks/              # Clerk webhook handler
│   │   │   ├── onboarding/create-org/ # Organization creation
│   │   │   ├── patients/              # Patient CRUD + documents + uploads
│   │   │   ├── facilities/            # Facility CRUD + media + uploads
│   │   │   ├── placements/            # Placement CRUD
│   │   │   ├── hospitals/upload/      # Hospital image uploads
│   │   │   ├── invite-codes/          # Invite code management + validation
│   │   │   └── join-requests/         # Join request management
│   │   ├── sign-in/[[...sign-in]]/    # Clerk sign-in
│   │   ├── sign-up/[[...sign-up]]/    # Clerk sign-up
│   │   ├── globals.css                # Theme (CSS custom properties, dark mode)
│   │   ├── layout.tsx                 # Root layout (ClerkProvider, fonts)
│   │   └── page.tsx                   # Public landing page
│   ├── components/
│   │   ├── ui/                        # 63+ shadcn/ui components (base-luma)
│   │   ├── layout/                    # App sidebar, header, navbar, footer
│   │   ├── auth/                      # Permission guards (DashboardGuard, Can, RequireRole)
│   │   ├── forms/                     # Entity forms (patient, facility, placement)
│   │   ├── media/                     # S3 upload components
│   │   └── dashboard-skeletons.tsx    # Loading skeleton compositions
│   ├── hooks/                         # Custom hooks (permissions, org, theme, mobile, scroll)
│   ├── lib/
│   │   ├── data-access.ts            # Org-scoped data access layer (47 functions)
│   │   ├── permissions.ts            # RBAC system (roles, permissions, route access)
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── data.ts                   # Mock/seed data
│   │   └── utils.ts                  # Shared utilities
│   ├── types/                         # TypeScript type definitions
│   │   ├── index.ts                   # Domain types
│   │   └── permissions.ts            # Permission types
│   ├── generated/prisma/             # Generated Prisma client (gitignored)
│   └── proxy.ts                      # Clerk middleware (auth + route protection)
├── tasks/                             # Planning documents
├── .env.example                       # Environment variable template
├── AGENTS.md                          # AI agent rules
├── CLAUDE.md                          # AI assistant guidelines
├── CONTRIBUTING.md                    # Contributing guidelines
├── CHANGELOG.md                       # Version changelog
├── components.json                    # shadcn/ui configuration
├── next.config.ts                     # Next.js config (image domains)
├── prisma.config.ts                   # Prisma config (migrations, seed)
├── tsconfig.json                      # TypeScript config (@ path alias)
└── package.json                       # Dependencies and scripts
```

---

## Architecture Overview

### Multi-Tenant Data Architecture

All data is isolated by organization. Every query passes through the org-scoped data access layer in `src/lib/data-access.ts`, which automatically filters by the user's `organizationId`. Superadmins bypass this scoping for read operations. The only cross-org feature is the facility network search.

### Authentication Flow

1. Users authenticate via Clerk (email/password or Google OAuth)
2. Clerk webhooks sync user data to the local PostgreSQL database
3. The middleware (`src/proxy.ts`) validates sessions and protects routes
4. Role is resolved from Clerk session claims and stored in `publicMetadata`

### Authorization Flow

1. Permissions are defined as `resource:action` pairs in `src/lib/permissions.ts`
2. Each role maps to a set of permissions via `ROLE_PERMISSIONS`
3. Server-side: API routes check `roleHasPermission()` before mutations
4. Client-side: `<Can>`, `<RequirePermission>`, and `usePermissions()` hook for conditional UI
5. Route-level: `ROUTE_ACCESS` map defines required permissions per page

### Placement Workflow

1. Social worker creates a placement for a patient
2. System runs the facility matching algorithm (scores by care level, availability, insurance, location)
3. Top 5 matched facilities are stored on the placement
4. Social worker selects a facility and sends a referral
5. Facility coordinator reviews and accepts/rejects
6. On acceptance, patient is placed; facility occupancy is updated

### File Storage

S3-compatible storage (Railway Object Storage) handles facility media and patient documents. Upload flow uses presigned POST URLs -- the client requests a presigned URL from the API, uploads directly to S3, then creates a metadata record in the database.

---

## Database Schema

The database contains 12 models and 11 enums. Core entities:

| Model | Description |
|---|---|
| Organization | Multi-tenant root entity (hospital or facility) |
| User | Platform user (synced from Clerk) |
| Patient | Patient record with demographics, medical info, insurance |
| Facility | Care facility with capacity, care levels, ratings |
| Placement | Patient-to-facility workflow (8-step pipeline) |
| Hospital | Hospital branding and details |
| ActivityEvent | Audit trail |
| InviteCode | Organization invite codes |
| JoinRequest | Join request workflow |
| FacilityMedia | S3-stored facility media (images, videos, 3D scans) |
| PatientDocument | S3-stored patient documents |

See [`docs/data-model.md`](docs/data-model.md) for the complete schema, relationships, and enum reference.

---

## Brand Identity

### Color Palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| Navy (Trust) | `#1F3B57` | Primary buttons, headers, text -- stability and professionalism |
| Teal (Health) | `#4ED8C7` | Accents, highlights, CTAs -- vitality and clarity |
| Coral (Warmth) | `#FF7E6B` | Secondary accents -- human touch and compassion |
| White | `#FFFFFF` | Backgrounds, cards |
| Light Gray | `#F8F9FA` | Muted backgrounds, sidebar |
| Slate | `#64748B` | Secondary/muted text |

### Typography

- **Headings:** [Montserrat](https://fonts.google.com/specimen/Montserrat) -- weights 300-900, self-hosted via `next/font/google`
- **Body:** [Open Sans](https://fonts.google.com/specimen/Open+Sans) -- weights 300-800, self-hosted via `next/font/google`

### Design Principles

1. **Trust first** -- Navy primary conveys stability; clear hierarchy builds confidence
2. **Clarity over density** -- Generous whitespace, readable typography, focused flows
3. **Compassion by design** -- Coral warmth accents, plain language, patient-first orientation
4. **Responsive by default** -- Desktop-first layouts that scale down to mobile
5. **Security by design** -- Proper authentication, authorization, and data isolation

---

## Documentation

| Document | Description |
|---|---|
| [API Reference](docs/api-reference.md) | Complete REST API documentation |
| [Data Model](docs/data-model.md) | Database schema, relationships, and enums |
| [Deployment Guide](docs/deployment.md) | Production deployment instructions |
| [Development Guide](docs/development.md) | Development workflow and conventions |
| [Contributing](CONTRIBUTING.md) | How to contribute to the project |
| [Changelog](CHANGELOG.md) | Version history |

### Architecture Decision Records

| ADR | Decision |
|---|---|
| [ADR-001](docs/decisions/001-tech-stack-and-architecture.md) | Tech Stack & Application Architecture |
| [ADR-002](docs/decisions/002-database-and-orm.md) | Database & ORM Selection |
| [ADR-003](docs/decisions/003-authentication.md) | Authentication Provider (Clerk) |
| [ADR-004](docs/decisions/004-authorization-and-rbac.md) | Authorization & RBAC System |
| [ADR-005](docs/decisions/005-organization-onboarding-flow.md) | Organization Onboarding & Invite System |
| [ADR-006](docs/decisions/006-s3-file-storage.md) | S3 File Storage & Media Management |
| [ADR-007](docs/decisions/007-facility-matching-algorithm.md) | Facility Matching Algorithm |
| [ADR-008](docs/decisions/008-dashboard-architecture.md) | Role-Adaptive Dashboard Architecture |

---

## License

Private -- all rights reserved.
