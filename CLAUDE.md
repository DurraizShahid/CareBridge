# CLAUDE.md - Guidelines for Claude AI Working on CareBridge

This document provides guidelines for Claude AI (and other AI assistants) working on the CareBridge project.

## Critical Rules - Always Follow These First

### 1. Next.js Version
This is Next.js 16, which has breaking changes from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing code, and heed deprecation notices.

### 2. Tables - Use TanStack Table
**Always** use `@tanstack/react-table` (v8) for data tables. Do NOT use plain HTML `<table>` elements.

### 3. Dashboard UI - shadcn/ui Only
All pages under `src/app/(app)/dashboard/` **must** use shadcn UI components from `@/components/ui/` exclusively.

#### Available shadcn Components
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Badge`
- `Button`
- `Input`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` (for TanStack Table)
- `Separator`, `Skeleton`, `Sheet`, `Tooltip`, `Sidebar`
- And many more! Check `src/components/ui/` for all available components.

When adding new components, use:
```bash
npx shadcn add <component-name>
```

## Project Conventions

### Authentication & Authorization
- Use Clerk for authentication (`@clerk/nextjs`)
- Use the RBAC system in `src/lib/permissions.ts`
- Protect routes with permission guards

### Database
- Use Prisma ORM for all database operations
- Prisma client is in `src/generated/prisma`
- Run `npm run db:generate` after schema changes

### Code Organization
- Keep pages in `src/app/` (App Router)
- Components in `src/components/`
- Utilities in `src/lib/`
- Types in `src/types/`

### Documentation
- See [README.md](README.md) for project overview
- See [AGENTS.md](AGENTS.md) for more detailed agent guidelines
- Check `docs/` for Architecture Decision Records (ADRs)
