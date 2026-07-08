<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-table-rules -->
# Use TanStack Table for all new data tables

`@tanstack/react-table` (v8, already a dependency) **must** be used for any new page or component that renders a data table. Do not build new tables with plain HTML `<table>` elements — use the TanStack React Table library for sorting, filtering, pagination, column visibility, and row selection instead.
<!-- END:ui-table-rules -->

<!-- BEGIN:ui-dashboard-rules -->
# Dashboard must use shadcn components exclusively

All dashboard pages under `src/app/(app)/dashboard/` **must** use shadcn UI components (`@/components/ui/`) for all UI elements. Do not use plain HTML elements, custom-wrapped components, or inline Tailwind class patterns where a shadcn component exists.

Available shadcn components include:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` — instead of custom `<div>` cards
- `Badge` — instead of inline `bg-* text-*` badge spans
- `Button` — already available in `@/components/ui/button`
- `Input` — already available in `@/components/ui/input`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` — instead of raw `<select>` elements
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` — instead of custom modal implementations
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` — as the wrapper around TanStack Table
- `Separator`, `Skeleton`, `Sheet`, `Tooltip`, `Sidebar` — already available

When adding new shadcn components, use the project's shadcn CLI (`npx shadcn add <component>`) to install from the registry, ensuring consistency with the existing `base-nova` style and `@base-ui/react` primitives.
<!-- END:ui-dashboard-rules -->

<!-- BEGIN:ui-dashboard-skeleton-rule -->
# Every dashboard page must have a matching skeleton

Any new page created under `src/app/(app)/dashboard/` **must** have a corresponding skeleton component added to `src/components/dashboard-skeletons.tsx` at the same time. This includes both:

1. **Section-level skeletons** — individual skeleton components matching each distinct section/block on the page (e.g. a stats grid, a card list, a chart area). Each section skeleton should mirror the layout structure, dimensions, and heading hierarchy of its real counterpart using `Skeleton` placeholders.
2. **A composition skeleton** — a top-level skeleton component that composes the section skeletons together to form a full-page loading state, matching the exact page layout (grid columns, section ordering, parent containers).

Without both, the page will flash empty content while data loads. Always check the existing patterns in `src/components/dashboard-skeletons.tsx` for reference.
<!-- END:ui-dashboard-skeleton-rule -->
