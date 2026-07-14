# Dashboard Typography Audit

Audit date: July 13, 2026
Scope: `src/app/(app)/dashboard/` — all role-adaptive dashboard views (staff, facility, admin, default)
Type: Typography hierarchy, weight distribution, UX consistency

---

## Executive Summary

The dashboard uses a single typeface (Nohemi) which is correct for a product UI. However, the typographic hierarchy is under-utilized — most text across the interface uses only 3 of the 9 available weights (400, 600, 700). The result is a flat information hierarchy where primary data, secondary labels, and tertiary metadata all compete at similar visual weight. By intentionally distributing Nohemi's weight range (100–900) across distinct semantic roles, the dashboard can achieve clearer scan paths, faster cognitive parsing, and a more polished, intentional feel.

---

## Current State Analysis

### Font weights in use

| Usage | Current weight | CSS / class |
|---|---|---|
| Page heading (h1) | `font-bold` (700) | `text-3xl font-bold` |
| Section headings | `font-semibold` (600) | `text-sm font-semibold uppercase` |
| Card titles / patient names | `font-semibold` (600) | `text-sm font-semibold` or `text-base font-bold` |
| Stat values (large numbers) | `font-bold` (700) | `text-3xl font-bold` |
| Stat labels | `font-medium` (500) | `text-sm font-medium` |
| Body / description text | default (400) | `text-xs` or `text-sm` |
| Badge labels | default or medium | `font-medium` |
| Table headers | `font-medium` (500) | `text-[10px] font-medium uppercase` |
| Tiny metadata | default (400) | `text-[10px]` or `text-[9px]` |
| Hover tooltip content | default (400) | `text-[10px] font-medium` |

### Weight distribution across the dashboard

```
Weight  Used in
────────────────────────────────────────────
100     (unused)
200     (unused)
300     (unused)
400     body text, descriptions, metadata, timestamps
500     stat labels, table headers, some badges
600     section headings, card titles, list item names
700     page heading, stat values, facility name
800     (unused)
900     (unused)
```

### Typographic surface area (by role view)

**Staff view** (`staff-overview.tsx`):
- 1 h1 greeting, 2 section headings (My Caseload, Pending Approvals)
- Patient cards with name (600), diagnosis (400), metadata (400)
- Recent Activity with title (500), description (400), timestamp (400)

**Facility view** (`facility-overview.tsx`):
- 2-3 section headings (Referral Requests, My Facility, Facility Network)
- Referral cards with patient name (600), diagnosis (400), metadata (400)
- My Facility card with facility name (700), metadata (400), stats (700)
- Facility network list items (500)

**Admin view** (`admin-overview.tsx`):
- 8 card titles (500), 3 stat values (600), legends/labels (400)
- Placement pipeline labels (400), counts (500), percentages (400)

**Default view** (`main-overview.tsx`):
- 1 section heading, placement cards with name (600), metadata (400)

### Consistency audit

| Pattern | Consistent? | Notes |
|---|---|---|
| Section heading style | ✅ Yes | All use `text-sm font-semibold uppercase tracking-widest` |
| Card title weight | ⚠️ Mixed | Some `font-semibold` (600), some `font-bold` (700), some `font-medium` (500) |
| Stat value weight | ⚠️ Mixed | `font-bold` (700) in StatCard, `font-semibold` (600) in admin cards |
| Metadata size | ⚠️ Mixed | `text-xs` in staff/facility, `text-[10px]` and `text-[11px]` in admin |
| Badge text weight | ⚠️ Mixed | `font-medium` in some, default in others |
| Label capitalization | ✅ Yes | All uppercase with tracking-widest |
| Line length | ✅ Fine | No prose blocks, compact UI fits well |

---

## Issues Found

### P1 — Flat weight hierarchy (systemic)

**Location**: All dashboard views
**Category**: Typography / UX
**Impact**: Users cannot visually distinguish primary data from secondary context at a glance. Patient names, stat values, and card titles all use 600–700, while everything else uses 400. The 9-weight Nohemi family is underutilized — only 3 of 9 weights appear.
**Recommendation**: Define a 5-tier weight scale mapped to semantic roles (see below).

### P2 — Inconsistent stat value weights

**Location**: `stats-grid.tsx` (700), `admin-overview.tsx` cards (600), `platform-health-chart.tsx` (600)
**Category**: Consistency
**Impact**: The same kind of data (a numeric stat) reads differently depending on which card renders it. Subtle but undermines trust in the interface's precision.
**Recommendation**: Standardize all prominent stat values at `font-bold` (700) with `tracking-tight`.

### P2 — Admin cards use lighter weights than other views

**Location**: `users-by-role-card.tsx`, `network-overview-card.tsx`, `placement-pipeline-card.tsx`, `recent-users-card.tsx`
**Category**: Consistency
**Impact**: Admin view card titles at `font-semibold` (500) and stat numbers at `font-semibold` (600) feel quieter than staff/facility cards at 600–700. Creates a subtle visual unevenness between views.
**Recommendation**: Align admin card title weight and stat value weight with the rest of the dashboard.

### P2 — Tiny font sizes used inconsistently

**Location**: Various admin cards use `text-[9px]`, `text-[10px]`, `text-[11px]` interchangeably
**Category**: Typography / Consistency
**Impact**: 9px text at 0.05em letter-spacing on Nohemi can be hard to read, especially on high-DPI displays. The arbitrary mix of 9/10/11px suggests no system was followed.
**Recommendation**: Floor minimum size at 10px. Use Tailwind's scale (`text-xs` = 12px, `text-[11px]` in specific cases). Remove all 9px text.

### P2 — No weight contrast on interactive items

**Location**: `recent-activity-card.tsx`, `recent-placements-card.tsx`, `recent-users-card.tsx`
**Category**: UX / Interaction
**Impact**: Activity entries, placement rows, and user rows all use the same weight as surrounding text. No visual cue that these are interactive before hover.
**Recommendation**: Interactive list items should use a slightly heavier weight (500 vs 400) than purely decorative text.

### P3 — Leading is undefined

**Location**: Global
**Category**: Typography
**Impact**: Most text uses default line-height (1.2–1.3 on headings, 1.5 on body). With `tracking-wider` letter-spacing, body text at 14px can feel cramped vertically.
**Recommendation**: Set explicit `leading` on body text (e.g., `leading-relaxed` for descriptions).

### P3 — `text-wrap` not used

**Location**: Section headings and card titles
**Category**: Polish
**Impact**: Headings that wrap break at odd places. With longer names or diagnoses, wrapping looks unpolished.
**Recommendation**: Add `text-wrap: balance` to section headings, card titles, and patient names.

---

## Proposed Typography System

### Weight scale (5-tier)

```
Token          Weight  CSS                   Used for
────────────────────────────────────────────────────────────────
--fw-display   300     font-light            Hero stats, large display numbers
--fw-heading   700     font-bold             Page titles, stat values, facility names
--fw-label     600     font-semibold         Section headings, card titles, list item names
--fw-body      500     font-medium           Body text, descriptions, interactive items
--fw-meta      400     font-normal           Metadata, timestamps, secondary labels, badges
```

This distributes across 5 of the 9 available weights, creating clear visual separation between each tier.

### Size scale

```
Token          Size    CSS        Used for
─────────────────────────────────────────────
--fs-display   36px    text-4xl   Admin stat totals (not body text)
--fs-h1        30px    text-3xl   Page greeting / title
--fs-stat      24px    text-2xl   Stat card values
--fs-card      14px    text-sm    Card titles, patient names, list items
--fs-body      13px    text-xs    Descriptions, diagnoses, secondary text
--fs-meta      11px    text-[11px] Timestamps, metadata, badge labels
--fs-tiny      10px    text-[10px] Legends, percentages, chart labels
```

Floor at 10px. Remove all 9px text.

### Mapping by component

| Component | Current | Proposed |
|---|---|---|
| Page heading (`text-3xl`) | `font-bold` | `font-bold` (700) ✓ keep |
| Section heading | `text-sm font-semibold uppercase tracking-widest` | `text-xs font-semibold uppercase tracking-widest` (match size, keep weight) |
| StatCard value | `text-3xl font-bold tracking-tight` | `text-3xl font-bold tracking-tight` ✓ keep |
| StatCard label | `text-sm font-medium` | `text-xs font-medium` (lighter size, same weight) |
| Card title / patient name | `text-sm font-semibold` | `text-sm font-semibold` ✓ keep |
| Card description / diagnosis | `text-xs` | `text-xs font-medium` (500) — interactive context |
| Metadata (time, age, status) | `text-xs` | `text-xs` (400) — non-interactive |
| Badge label | `font-medium` or default | `font-medium` (500) — standardized |
| Tiny metadata (9px) | `text-[9px]` | `text-[10px]` — floor at 10px |
| Admin stat values | `font-semibold` (600) | `font-bold` (700) — align with rest |
| Admin card title | `text-sm font-semibold` (600) | `text-sm font-semibold` (600) ✓ align |
| Interactive list items | `font-medium` (500) or default | `font-medium` (500) — explicit interactive weight |

### Implementation pattern

Rather than applying weights ad-hoc, define semantic class utilities or use Tailwind's existing scale with the weight mapping above. For example:

```tsx
// Before
<span className="text-sm font-semibold text-card-foreground">
  {patient.firstName} {patient.lastName}
</span>

// After (same — already correct)
<span className="text-sm font-semibold text-card-foreground">
  {patient.firstName} {patient.lastName}
</span>

// Before
<p className="text-xs text-muted-foreground">{patient.primaryDiagnosis}</p>

// After — add weight for interactive context
<p className="text-xs font-medium text-muted-foreground">
  {patient.primaryDiagnosis}
</p>
```

### Where to apply changes

1. **`stats-grid.tsx`** — No change needed for stat cards (already bold). AdminStatsGrid's inline stat values should change from `font-light` (300) to... actually the admin grid uses `font-light` for its big numbers, which is fine as a display use (300). Keep as is but standardize.
2. **`staff-overview.tsx`** — Card descriptions from default → `font-medium`, patient name already `font-semibold` ✓
3. **`facility-overview.tsx`** — Card descriptions from default → `font-medium`, facility name already `font-bold` ✓
4. **`admin-overview.tsx` cards** — Card titles from `font-semibold` → unified, stat values from `font-semibold` → `font-bold` where appropriate, remove 9px text
5. **`main-overview.tsx`** — Card descriptions from default → `font-medium`
6. **`recent-activity-card.tsx`** — Activity title from `font-medium` → `font-medium` (keep), timestamps from default → stay `font-normal` for contrast
7. **`placement-pipeline-card.tsx`** — Stat value `font-semibold` → `font-bold`, tiny percentages keep as is
8. **`platform-health-chart.tsx`** — Bottom stats `font-semibold` → `font-bold`

---

## Verdict

The dashboard is functional and consistent in structure but lacks typographic intentionality. The single-family choice (Nohemi) is correct. The `tracking-wider` body text is a deliberate choice. But the weight palette is flat, making it hard for users to visually tier information while scanning.

The fix is not a redesign — it's a systematic weight distribution across existing components. Estimated effort: ~45–60 minutes across ~12 files, mostly adding `font-medium` (500) to body text in interactive contexts and standardizing admin view weights to match staff/facility views.

---

## Recommended commands

1. **`/impeccable typeset dashboard`** — Apply the weight scale and size floor across all dashboard section files
2. **`/impeccable audit dashboard`** — Re-run to measure improvement
