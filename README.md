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
| Fonts | [Lato](https://fonts.google.com/specimen/Lato) (headings), [Open Sans](https://fonts.google.com/specimen/Open+Sans) (body) |
| Icons | [Lucide React](https://lucide.dev/) |
| UI Primitives | [Base UI React](https://base-ui.com/) |
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

- **Headings:** [Lato](https://fonts.google.com/specimen/Lato) — clean, modern sans-serif (weights: 300, 400, 700, 900)
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
src/
├── app/
│   ├── globals.css          # Global styles, theme variables, Tailwind config
│   ├── layout.tsx           # Root layout — fonts, metadata, HTML shell
│   └── page.tsx             # Landing page — hero, features, about, CTA
├── components/
│   └── ui/
│       └── button.tsx       # shadcn/ui Button (Base UI primitive)
└── lib/
    └── utils.ts             # Utility: cn() — clsx + tailwind-merge
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Key Features

- **Social Worker Portal** — Streamlined case management for assessments, matching, and placement
- **Care Setting Discovery** — Facility directory with real-time availability
- **Placement Coordination** — End-to-end workflow with secure stakeholder communication
- **Patient-Centered Matching** — Intelligent algorithms considering medical, insurance, location, and facility data

## Design Principles

1. **Trust first** — Navy primary conveys stability; clear information hierarchy builds confidence
2. **Clarity over density** — Generous whitespace, readable typography, focused task flows
3. **Compassion by design** — Coral warmth accents, plain language, patient-first orientation
4. **Responsive by default** — Mobile-first layouts that scale to desktop workflows

## Deployment

The application is optimized for deployment on [Railway](https://railway.com/) or [Vercel](https://vercel.com/).

```bash
# Standard production build
npm run build
npm run start
```
