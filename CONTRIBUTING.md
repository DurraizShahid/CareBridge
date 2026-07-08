# Contributing to CareBridge

Thank you for your interest in contributing to CareBridge Health.

## Getting Started

1. Fork and clone the repository
2. Follow the [Development Guide](docs/development.md) to set up your local environment
3. Create a feature branch from `master`

## Development Workflow

```bash
# Create a feature branch
git checkout -b feat/your-feature-name

# Make your changes, then verify
npm run lint
npm run build

# Commit with conventional commit messages
git commit -m "feat: add patient search filter"

# Push and open a PR
git push origin feat/your-feature-name
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `style:` | Visual/CSS changes (no logic change) |
| `refactor:` | Code restructuring (no behavior change) |
| `chore:` | Build, tooling, or dependency changes |
| `docs:` | Documentation changes |

Examples:
```
feat: add facility search by care level
fix: prevent duplicate placements for same patient
style: update dashboard card spacing
refactor: extract placement scoring into utility
chore: upgrade Prisma to v7.9
docs: add API reference for placement routes
```

## Code Standards

### Must Follow

- **Dashboard pages** use shadcn/ui components exclusively (see [AGENTS.md](AGENTS.md))
- **Data tables** use TanStack React Table (never plain `<table>`)
- **Every dashboard page** has a matching skeleton in `src/components/dashboard-skeletons.tsx`
- **All DB queries** go through `src/lib/data-access.ts` (never import Prisma directly in pages/routes)
- **Permissions** are checked on both server and client side

### Style

- TypeScript strict mode -- no `any` types without justification
- Use the `@/*` path alias for imports (e.g., `@/components/ui/button`)
- Follow existing code patterns; read neighboring files before writing new ones
- Run `npm run lint` before committing

### Architecture Decisions

If your change involves a significant architectural choice (new library, data model change, new integration), write an ADR in `docs/decisions/` following the existing format. See [ADR-001](docs/decisions/001-tech-stack-and-architecture.md) for the template.

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include a description of what changed and why
- Reference any related issues
- Ensure `npm run build` passes
- Update documentation if you change APIs or add features

## Project Documentation

| Document | When to Update |
|---|---|
| `README.md` | New features, tech stack changes |
| `docs/api-reference.md` | New or changed API routes |
| `docs/data-model.md` | Schema changes |
| `docs/development.md` | New patterns or workflows |
| `CHANGELOG.md` | Every shipped feature or fix |
| `docs/decisions/` | Significant architectural choices |

## Questions?

Open an issue or reach out to the team. Check the [Development Guide](docs/development.md) for common patterns and troubleshooting.
