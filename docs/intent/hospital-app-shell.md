# Hospital App Shell — Intent

**Date:** 2026-07-12

## Confirmed Intent

- **Outcome:** A new app shell with a bottom dock (5 visible + "More" overflow) that replaces the sidebar for social-worker, discharge-planner, and administrator roles, with a ChatGPT-style AI input as the landing page.

- **User:** Social-workers, discharge-planners, and administrators (not superadmin) — the frontline hospital roles who need quick task-oriented access, not a dashboard of metrics.

- **Why now:** The current dashboard + sidebar experience makes these users hunt for their most-used actions. The sidebar hierarchy buries patients, placements, and facility lookups behind clicks, and the dashboard itself is noise they skip past.

- **Success:** These roles log in → land on the AI home with a welcoming dummy input → tap one of 5 dock items (Home, Explore, Dashboard, Patients, More) → get where they're going in one tap. Superadmin still gets the sidebar unchanged.

- **Constraint:** Existing route paths stay as-is (`/dashboard/*`, `/patients`, `/placements`, etc.). The dock navigates to existing pages. Routes are not moved. The AI input is decorative — placeholder + suggested prompts, no backend. Items in "More" are role-gated (administrator sees Management/Users/Hospitals; social-worker/discharge-planner does not).

- **Out of scope:** No real AI backend. No route restructuring. No sidebar removal for superadmin or facility-coordinator. No changes to existing page content or layout internals (the dock wraps existing pages, it doesn't replace them).

## Dock Structure

| Dock Item | Route | Notes |
|-----------|-------|-------|
| Home | `/dashboard/home` | New AI chat placeholder |
| Explore | `/dashboard/facility-network` | Existing page |
| Dashboard | `/dashboard` | Existing role-dispatch page |
| Patients | `/patients` | Existing page |
| More (overflow) | — | Dropdown with remaining items |

More overflow items:
- Facility Network → `/dashboard/facility-network`
- Placements → `/placements`
- Management → `/admin/permissions` (admin only)
- Users → `/dashboard/users` (admin only)
- Hospitals → `/dashboard/hospitals` (admin only)
