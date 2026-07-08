# ADR-008: Role-Adaptive Dashboard Architecture

## Status

Accepted

## Date

2026-07-08

## Context

CareBridge serves multiple user roles with fundamentally different workflows:

- **Social workers / discharge planners** need patient case overviews, placement pipelines, and activity feeds
- **Facility coordinators** need incoming referral queues, occupancy metrics, and bed availability
- **Administrators** need user management, organization statistics, and system health
- **Superadmins** need platform-wide metrics across all organizations

A single dashboard layout cannot serve all of these needs well. Users should see the information most relevant to their role immediately upon login.

## Decision

Implement a **role-adaptive dashboard** where the main `/dashboard` page detects the user's role and renders different section compositions.

### Architecture

```
src/app/(app)/dashboard/
├── page.tsx              # Routes to role-specific dashboard
├── _sections/            # Shared section components
│   ├── stats-cards.tsx
│   ├── recent-activity.tsx
│   ├── placement-pipeline.tsx
│   ├── facility-overview.tsx
│   └── ...
├── staff/page.tsx        # Social worker / discharge planner dashboard
├── facility/page.tsx     # Facility coordinator dashboard
├── admin/page.tsx        # Administrator dashboard
└── layout.tsx            # Shared dashboard layout
```

### Role-to-Dashboard Mapping

| Role | Dashboard | Key Sections |
|---|---|---|
| `social-worker`, `discharge-planner` | `/dashboard/staff` | Patient stats, placement pipeline, recent activity, pending actions |
| `facility-coordinator` | `/dashboard/facility` | Referral queue, occupancy metrics, bed availability, facility stats |
| `administrator` | `/dashboard/admin` | User management stats, org metrics, system overview |
| `superadmin` | `/dashboard/admin` | Platform-wide stats (all orgs), user counts, facility network overview |
| `customer` | `/dashboard` (default) | Limited view with basic stats |

### Section Component Pattern

Each dashboard section is a standalone async server component:

```tsx
// _sections/stats-cards.tsx
export async function StatsCards({ organizationId, role }: Props) {
  const stats = await getDashboardStats(organizationId, role);
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard title="Active Patients" value={stats.activePatients} />
      {/* ... */}
    </div>
  );
}
```

Sections are composed into role-specific pages using React Suspense for progressive loading:

```tsx
// staff/page.tsx
export default function StaffDashboard() {
  return (
    <>
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards organizationId={orgId} role={role} />
      </Suspense>
      <Suspense fallback={<PlacementPipelineSkeleton />}>
        <PlacementPipeline organizationId={orgId} role={role} />
      </Suspense>
    </>
  );
}
```

### Skeleton System

Every section has a matching skeleton component in `src/components/dashboard-skeletons.tsx`:

1. **Section-level skeletons** mirror the layout of their real counterpart using `<Skeleton>` placeholders
2. **Composition skeletons** assemble section skeletons into full-page loading states
3. Dashboard `loading.tsx` files use the composition skeletons

This ensures no flash of empty content during server-side data fetching.

### Data Layer

Each dashboard type has a dedicated data-access function:

| Function | Scope | Used By |
|---|---|---|
| `getDashboardStats()` | Org-scoped | Staff dashboard |
| `getFacilityDashboardStats()` | Org-scoped + optional facility filter | Facility dashboard |
| `getSuperAdminDashboardStats()` | Platform-wide (no org scope) | Admin dashboard (superadmin) |
| `getReferrals()` | Org-scoped, facility coordinators | Facility dashboard |
| `getRecentActivity()` | Org-scoped | All dashboards |

## Alternatives Considered

### Single dashboard with conditional sections
- Pros: One page, simpler routing
- Cons: Complex conditional logic, harder to maintain, all roles load all components
- Rejected: Separate pages are cleaner and allow independent evolution

### Configurable widget grid (drag-and-drop)
- Pros: Maximum user flexibility
- Cons: Significant implementation complexity, most users prefer a sensible default
- Rejected: Over-engineered for current needs; fixed layouts serve the use cases well

### Client-side role detection
- Pros: Single server render
- Cons: Sends all dashboard code to the client, slower initial render, poor for SEO (though dashboard is private)
- Rejected: Server components with Suspense are more performant and keep role-specific code out of the client bundle

## Consequences

- Adding a new role requires creating a new dashboard page and wiring the routing
- Shared sections can be reused across dashboards, reducing duplication
- Each dashboard can be independently optimized for its data-fetching pattern
- The skeleton system must be maintained in parallel with the real components (overhead but prevents layout shift)
- Permission guards ensure users can only access their authorized dashboard
