# CareBridge â€” Agent Handoff (living document)

> **Read this file FIRST before starting any task on this repo.** Update the
> "Current state" and "Active workstreams" sections when you start or finish work.
> This keeps parallel agents (ChatGPT chats, Maya) from stepping on each other.

## Project
- **CareBridge Health** â€” hospital-to-care-home placement platform for client **Anam Akhter**.
- Stack: Next.js 16, React 19, Prisma/PostgreSQL, Clerk, Stripe.
- Repo: `DurraizShahid/CareBridge` (private). `master` is the source of truth.

## Current state
- Master: `b0ee6132a` â€” "Remove unused ogl WebGL dependency" (2026-10-09).
- (Update this line on every merge to master.)

## Completed work (2026-10-09)
- **Money loop**: referral â†’ accept/decline â†’ contract auto-generated â†’ both-party
  e-sign â†’ Stripe deposit (demo mode) â†’ row-locked bed reservation â†’ atomic
  placement conversion. `STRIPE_ENABLE_LIVE_CHARGES` guards live charges.
  No PHI in Stripe metadata. 112/112 tests, tsc + build green.
- **Template cleanup**: 16 files (~4,042 lines) removed, Three.js uninstalled,
  dev fallback role fixed from `superadmin` to `customer`.
- **Capacity fix**: completed placements no longer reserve beds forever.
- **Care Weave reskin**: brand tokens in `~/workspace/carebridge/DESIGN_GUIDELINE.md`
  (also in the ChatGPT "CareBridge" project); palette Navy `#102B4E` /
  Blue `#255DCE` / Azure `#6EA8F2` / Ice `#DCEBFF` / Mist `#EEF4FC` / lime `#C6F135`.
- **Visual consistency pass**: 9 fixes (dashboard redirect, tealâ†’blue, onboarding
  logo, dark-card contrast, Join tab contrast, sidebar logo, seed org rename,
  beds indicator, sign-in mesh) + `/api/me` response guard. Merged.
- **Landing overhaul**: concrete placement copy ("From hospital discharge to
  confirmed placement. Without the phone tag."), 6 real workflow steps, trust
  strip, both-sides sections, CSS product mockups (referral inbox, match scores,
  e-signed contract, deposit checkout with DEMO badge). Merged.
- **Landing polish**: H1 tightening, readable deposit price, hero-overlapping
  trust strip, alternating section band (Vamtam Salute structural inspo).
- **3D remnants removed**: `ogl` dependency pruned; no WebGL/splat code remains.

## Active workstreams (check before starting â€” avoid conflicts)
| Branch | Owner | Task | Status |
|---|---|---|---|
| `fix/security-major-upgrades` | ChatGPT ("Check Remote Connection" chat) | Major-version upgrades for 34 npm vulns (Prisma â†’ Next â†’ shadcn/Radix), tsc+build+tests per group | In progress (2026-10-09) |
| `fix/demo-seed` | ChatGPT (Remote Desktop Commander) | Synthetic demo seed, Docker 127.0.0.1:5433 + tsc verified | PR #10 open â€” awaiting Maya (2026-10-09) |

## Pending (needs a human)
- **Security PR (Maya review)**: fix/security-major-upgrades preserves Prisma 7.x, updates Next.js to 16.4.0, resolves 21 reported audit vulnerabilities (13 high remain), removes unused Lightfall/OGL remnants, and adds an npm test script. TypeScript and production build pass; 109 tests pass and 3 integration tests are skipped. Maya coordinates PR review and merge.
- **Authenticated visual QA**: dashboard, patients, permissions, referrals inbox,
  deposit checkout + demo banner â€” needs signed-in screenshots (user will provide).
- **Two-org Clerk walkthrough**: needs the user driving two logins.
- **Real Stripe test keys**: blocked until Anam creates the Stripe account.

## Roadmap (planned features)
- **Facility 3D virtual tours with Gaussian splats** (noted 2026-10-09, not started):
  facilities can showcase their property with an interactive virtual 3D tour built
  from Gaussian splats. Needs: photo/video capture + upload flow, splat generation
  pipeline, and an embedded web viewer on facility profiles. Shortlist for the
  viewer: `@mkkellogg/gaussian-splats-3d` (three.js), PlayCanvas splat support.
  Generation options to evaluate: self-hosted pipeline vs managed APIs.

## Hard rules
- **Never invent** stats, testimonials, customer logos, metrics, or verification results.
- **Landing stays light**: keep the `landing-root` class on the page root and the
  `.dark .landing-root` override in `globals.css`. The dashboard dark theme must
  never leak into the landing page again.
- **Money-loop code paths** (referral/contract/deposit/capacity): dependency
  upgrades only â€” no logic changes without explicit approval.
- **Gates before merge**: `npx tsc --noEmit`, `npm run build`, and `npm test`
  (112 tests) all green. Merge to master via PR, then push.
- **After merging**: update "Current state" above and move your row out of
  "Active workstreams".

