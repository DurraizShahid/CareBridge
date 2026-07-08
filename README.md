# CareBridge Health

**Bridging hospital to home — empowering social workers to place patients into the right care settings.**

CareBridge Health is a web-based platform (desktop + responsive mobile) that enables hospital social workers and discharge planners to place patients who cannot safely return home into appropriate care settings. From initial assessment to final placement, CareBridge streamlines the entire discharge planning workflow.

## Mission

Every patient deserves the right care beyond the hospital. CareBridge exists to eliminate the delays, inefficiencies, and information gaps that prevent timely, appropriate patient placements.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (base-nova) |
| Fonts | [Montserrat](https://fonts.google.com/specimen/Montserrat) (headings), [Open Sans](https://fonts.google.com/specimen/Open+Sans) (body) |
| Icons | [Lucide React](https://lucide.dev/) |
| UI Primitives | [Base UI React](https://base-ui.com/) |
| Database | [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/) |
| Authentication | [Clerk](https://clerk.com/) |
| Tables | [TanStack Table v8](https://tanstack.com/table/latest) |
| Package Manager | npm |

## Brand Identity

### Color Palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| Navy (Trust) | ![](https://via.placeholder.com/14/1F3B57/1F3B57?text=+) `#1F3B57` | Primary buttons, headers, main text — conveys stability and professionalism |
| Teal (Health) | ![](https://via.placeholder.com/14/4ED8C7/4ED8C7?text=+) `#4ED8C7` | Accents, highlights, CTAs — represents health, vitality, and clarity |
| Coral (Warmth) | ![](https://via.placeholder.com/14/FF7E6B/FF7E6B?text=+) `#FF7E6B` | Secondary accents, warmth indicators — adds human touch and compassion |
| White | ![](https://via.placeholder.com/14/FFFFFF/FFFFFF?text=+) `#FFFFFF` | Backgrounds, cards — clarity and openness |
| Light Gray | ![](https://via.placeholder.com/14/F8F9FA/F8F9FA?text=+) `#F8F9FA` | Muted backgrounds, sidebar |
| Slate | ![](https://via.placeholder.com/14/64748B/64748B?text=+) `#64748B` | Secondary/muted text |

### Typography

- **Headings:** [Montserrat](https://fonts.google.com/specimen/Montserrat) — clean, modern sans-serif (weights: 300, 400, 500, 600, 700, 800, 900)
- **Body:** [Open Sans](https://fonts.google.com/specimen/Open+Sans) — highly readable, friendly sans-serif (weights: 300, 400, 500, 600, 700, 800)
- Both fonts are self-hosted via `next/font/google` for zero external network requests.

### CSS Custom Properties

The theme is defined through CSS custom properties in `src/app/globals.css`. The `@theme inline` directive in Tailwind CSS v4 maps these to utility classes:

```
bg-primary      → Navy (#1F3B57)
bg-accent       → Teal (#4ED8C7)
bg-secondary    → Coral (#FF7E6B)
bg-health       → Teal (#4ED8C7)     [custom semantic]
bg-warmth       → Coral (#FF7E6B)    [custom semantic]
text-health     → Teal text
text-warmth     → Coral text
```

Dark mode is fully supported via the `.dark` class variant with an adjusted deep navy background.

## Project Structure

```
carebridge/
├── docs/                          # Documentation and ADRs
│   └── decisions/                 # Architecture Decision Records (ADRs)
│       ├── 001-tech-stack-and-architecture.md
│       ├── 002-database-and-orm.md
│       ├── 003-authentication.md
│       ├── 004-authorization-and-rbac.md
│       └── 005-organization-onboarding-flow.md
├── prisma/                        # Prisma ORM schema and migrations
│   ├── schema.prisma
│   └── seed.ts
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (onboarding)/          # Onboarding flow (no sidebar)
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/                 # Authenticated app routes
│   │   │   ├── admin/
│   │   │   ├── dashboard/         # Dashboard pages (admin, staff, facility)
│   │   │   │   └── users/         # User management, invite codes, join requests
│   │   │   ├── facilities/        # Facility management
│   │   │   ├── patients/          # Patient management
│   │   │   ├── placements/        # Placement workflow
│   │   │   └── layout.tsx         # Authenticated app layout with sidebar
│   │   ├── api/                   # API routes
│   │   │   ├── me/
│   │   │   ├── onboarding/
│   │   │   ├── invite-codes/
│   │   │   ├── join-requests/
│   │   │   └── webhooks/
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── globals.css            # Global styles and theme
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   ├── components/
│   │   ├── auth/                  # Authentication components
│   │   ├── layout/                # Layout components (sidebar, header)
│   │   └── ui/                    # shadcn/ui components
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Utility modules
│   │   ├── data-access.ts         # Data access layer (Prisma + org-scoped queries)
│   │   ├── data.ts
│   │   ├── permissions.ts         # RBAC permission system
│   │   ├── prisma.ts
│   │   └── utils.ts
│   ├── types/                     # TypeScript types
│   │   ├── index.ts
│   │   └── permissions.ts
│   └── generated/                 # Generated files (Prisma client)
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma.config.ts
├── skills-lock.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database (local or managed)
- Clerk account for authentication

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and fill in your values

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:dev

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Key Features

- **Authentication & Authorization** — Clerk for secure authentication, role-based access control (RBAC) with permissions system
- **Multi-Organization Support** — Isolated data for hospitals and care facilities
- **Onboarding Flow** — New users choose organization type, create org, or join existing via invite code
- **Invite Code System** — Generate reusable invite codes with optional role assignment
- **Join Request Workflow** — Users request to join orgs, admins approve/deny requests
- **Social Worker Portal** — Streamlined case management for assessments, matching, and placement
- **Care Setting Discovery** — Facility directory with real-time availability
- **Placement Coordination** — End-to-end workflow with secure stakeholder communication
- **Patient-Centered Matching** — Intelligent algorithms considering medical, insurance, location, and facility data
- **User Management** — Admin panel for managing users, invite codes, and join requests
- **Responsive Design** — Works on desktop and mobile devices

## User Roles & Permissions

CareBridge implements a role-based access control (RBAC) system with the following roles:

| Role | Description |
|---|---|
| `superadmin` | Full platform access, manages all organizations and users |
| `administrator` | Hospital admin, manages hospital users and settings |
| `social-worker` | Hospital social worker, manages patients and placements |
| `discharge-planner` | Discharge planner, coordinates patient discharges |
| `facility-coordinator` | Care facility coordinator, manages facility placements |
| `customer` | Limited access for external stakeholders |

See `src/lib/permissions.ts` for detailed permission mappings.

## Design Principles

1. **Trust first** — Navy primary conveys stability; clear information hierarchy builds confidence
2. **Clarity over density** — Generous whitespace, readable typography, focused task flows
3. **Compassion by design** — Coral warmth accents, plain language, patient-first orientation
4. **Responsive by default** — Mobile-first layouts that scale to desktop workflows
5. **Security by design** — Proper authentication, authorization, and data isolation

## Database Schema

The database schema includes the following core entities:

- **Organization** — Hospital or care facility organization with `type` (hospital/facility)
- **User** — Platform user with role and organization association
- **Patient** — Patient record with medical and demographic information
- **Facility** — Care facility with capacity and specialty information
- **Placement** — Patient placement workflow and status
- **Hospital** — Hospital organization details
- **ActivityEvent** — Audit trail of system activities
- **InviteCode** — Generated invite codes for joining organizations
- **JoinRequest** — User requests to join organizations

See `prisma/schema.prisma` for the complete schema.

## Deployment

The application is optimized for deployment on [Vercel](https://vercel.com/) or any platform that supports Node.js.

```bash
# Standard production build
npm run build
npm run start
```

## Architecture Decision Records (ADRs)

Key architectural decisions are documented in `docs/decisions/`:
- [ADR-001: Tech Stack & Application Architecture](docs/decisions/001-tech-stack-and-architecture.md)
- [ADR-002: Database & ORM Selection](docs/decisions/002-database-and-orm.md)
- [ADR-003: Authentication Provider Selection (Clerk)](docs/decisions/003-authentication.md)
- [ADR-004: Authorization & RBAC System](docs/decisions/004-authorization-and-rbac.md)
- [ADR-005: Organization Onboarding & Invite System](docs/decisions/005-organization-onboarding-flow.md)
