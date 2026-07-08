# CareBridge Development Guide

This guide covers development workflow, coding conventions, and project-specific patterns.

## Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:dev

# Start development server (uses Turbopack)
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

---

## Code Organization

```
src/
├── app/           # Next.js App Router (pages, layouts, API routes)
├── components/    # React components
│   ├── ui/        # shadcn/ui primitives (do not edit directly)
│   ├── layout/    # Layout components (sidebar, header, navbar)
│   ├── auth/      # Permission guard components
│   ├── forms/     # Entity form components
│   └── media/     # File upload components
├── hooks/         # Custom React hooks
├── lib/           # Utility modules and data access
├── types/         # TypeScript type definitions
└── generated/     # Auto-generated code (Prisma client)
```

### Key Files

| File | Purpose |
|---|---|
| `src/lib/data-access.ts` | Org-scoped data access layer (all DB queries) |
| `src/lib/permissions.ts` | RBAC system (roles, permissions, route access) |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/proxy.ts` | Clerk middleware (auth + route protection) |
| `src/components/dashboard-skeletons.tsx` | Loading skeleton compositions |
| `prisma/schema.prisma` | Database schema |

---

## Conventions

### Next.js 16

This project uses **Next.js 16** with the App Router. There are breaking changes from earlier versions. Before writing page or API route code, read the relevant guide in `node_modules/next/dist/docs/`.

### Component Rules

1. **Dashboard pages** (`src/app/(app)/dashboard/`) must use shadcn/ui components exclusively. No plain HTML where a shadcn component exists.

2. **Data tables** must use TanStack React Table (`@tanstack/react-table` v8). No plain HTML `<table>` elements.

3. **Every dashboard page must have a matching skeleton** in `src/components/dashboard-skeletons.tsx`:
   - Section-level skeletons for each distinct block
   - A composition skeleton that assembles them into a full-page loading state

4. **shadcn/ui components** are installed with: `npx shadcn add <component>`. The project uses the `base-luma` style with `@base-ui/react` primitives.

### TypeScript

- Strict mode is enabled
- Path alias: `@/*` maps to `./src/*`
- Domain types are in `src/types/index.ts`
- Permission types are in `src/types/permissions.ts`

### Styling

- Tailwind CSS v4 with `@theme inline` directive for CSS custom properties
- Dark mode via `.dark` class on `<html>` (dashboard only)
- Semantic color tokens: `bg-primary` (navy), `bg-accent` (teal), `bg-secondary` (coral)
- Custom tokens: `bg-health` (teal), `bg-warmth` (coral)

---

## Data Access Pattern

All database queries go through `src/lib/data-access.ts`. This centralizes org-scoping, enum conversion, and validation.

### Org Scoping

Every query filters by `organizationId`:

```typescript
// Internal pattern used by all data-access functions
const whereClause = isSuperadmin
  ? {}  // Superadmin sees all
  : { organizationId };
```

### Enum Conversion

Prisma uses `SCREAMING_SNAKE_CASE` enums. The UI uses `kebab-case`. Conversion happens in the data access layer:

```
UI: "social-worker"  ↔  Prisma: "SOCIAL_WORKER"
UI: "skilled-nursing" ↔  Prisma: "SKILLED_NURSING"
```

### Adding a New Data Access Function

1. Add the function to `src/lib/data-access.ts`
2. Accept `organizationId` and `role` parameters
3. Use the org-scoping pattern
4. Convert enums at the boundary

---

## Authentication & Authorization

### Server-Side Auth

API routes use one of two patterns:

```typescript
// Pattern 1: Manual auth + org check
export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { organizationId, role } = await getServerOrganization();
  // ... use organizationId and role
}

// Pattern 2: Combined helper (preferred for new routes)
const { userId, org } = await requireOrgPermission('resource:action');
```

### Client-Side Permission Guards

```tsx
import { Can, RequirePermission } from '@/components/auth/permission-guard';

// Conditional rendering
<Can permission="patients:create">
  <Button>Add Patient</Button>
</Can>

// Route-level guard
<RequirePermission permission="dashboard:admin" fallback={<AccessDenied />}>
  <AdminDashboard />
</RequirePermission>
```

### Adding a New Permission

1. Add the permission string to the role's array in `ROLE_PERMISSIONS` (`src/lib/permissions.ts`)
2. If it protects a route, add it to `ROUTE_ACCESS`
3. Use it in API routes via `roleHasPermission()` and in components via `<Can>`

---

## File Upload Flow

Uploads use S3 presigned POST URLs:

1. **Client** calls the upload API route with file metadata (`fileName`, `contentType`)
2. **API route** generates a presigned POST URL using `@aws-sdk/s3-presigned-post`
3. **Client** uploads the file directly to S3 using the presigned URL
4. **Client** calls the metadata API route to create a DB record with the S3 key and URL

### Adding a New Upload Type

1. Create an upload API route that generates presigned URLs
2. Define allowed MIME types and size limits
3. Create a metadata API route to store the record
4. Build a client upload component (see `src/components/media/` for examples)

---

## Database Workflow

### Making Schema Changes

```bash
# 1. Edit prisma/schema.prisma

# 2. Create a migration
npm run db:dev

# 3. Regenerate the Prisma client
npm run db:generate

# 4. Update data-access.ts if needed
```

### Seeding

The seed file (`prisma/seed.ts`) creates sample organizations, users, patients, facilities, and placements:

```bash
npx prisma db seed
```

### Resetting

```bash
# Drop all data and re-run migrations + seed
npx prisma migrate reset
```

---

## Testing

### Manual Testing Checklist

When adding a new feature, verify:

- [ ] Page loads without errors
- [ ] Loading skeleton appears during data fetch
- [ ] CRUD operations work (create, read, update, delete)
- [ ] Permission guards work (unauthorized users see nothing or get redirected)
- [ ] Dark mode renders correctly
- [ ] Mobile layout is usable

### Linting

```bash
npm run lint
```

ESLint is configured with `next/core-web-vitals` and TypeScript rules.

---

## Common Patterns

### Adding a New Dashboard Page

1. Create the page at `src/app/(app)/dashboard/your-page/page.tsx`
2. Add section-level skeletons to `src/components/dashboard-skeletons.tsx`
3. Add a composition skeleton that assembles them
4. Create a `loading.tsx` that uses the composition skeleton
5. Add the route to `ROUTE_ACCESS` in `src/lib/permissions.ts`
6. Add a sidebar link in `src/components/layout/app-sidebar.tsx`
7. Use shadcn/ui components exclusively

### Adding a New Entity (CRUD)

1. **Schema:** Add the model to `prisma/schema.prisma`, run `npm run db:dev`
2. **Data access:** Add functions to `src/lib/data-access.ts` (get, create, update, delete)
3. **API routes:** Create routes in `src/app/api/your-entity/`
4. **Pages:** Create pages in `src/app/(app)/your-entity/` (list, detail, new, edit)
5. **Form:** Create a form component in `src/components/forms/`
6. **Permissions:** Add permissions to `src/lib/permissions.ts`
7. **Types:** Add types to `src/types/index.ts`
8. **Skeletons:** Add loading skeletons for any dashboard pages

### Adding a New API Route

1. Create the route file in `src/app/api/`
2. Use `auth()` + `getServerOrganization()` or `requireOrgPermission()`
3. Check permissions with `roleHasPermission()` for write operations
4. Use data-access functions for DB operations (never query Prisma directly in routes)
5. Return appropriate status codes (200, 201, 400, 401, 403, 404, 409, 500)

---

## Troubleshooting

### Prisma Client Errors

If you see "PrismaClient is not defined" or import errors:

```bash
npm run db:generate
```

The Prisma client is generated to `src/generated/prisma/` and is gitignored.

### Clerk Auth Issues

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set
- Check that webhook events are being received (`/api/webhooks`)
- Verify the user exists in the local DB (webhooks may have failed)

### S3 Upload Failures

- Check S3 credentials and endpoint URL
- Verify CORS is configured: `node scripts/configure-s3-cors.mjs`
- Check file size against limits (see [API Reference](api-reference.md))
