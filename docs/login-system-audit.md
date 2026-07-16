# Login System Security & Architecture Audit

**Date:** 2026-07-15 | **Last updated:** 2026-07-16
**Scope:** `src/app/sign-in/`, `src/app/sign-up/`, `src/lib/server-auth.ts`, `src/lib/permissions.ts`, `src/lib/server-organization.ts`, `src/hooks/use-permissions.ts`, `src/hooks/use-organization.tsx`, `src/app/api/webhooks/route.ts`, `src/app/api/me/route.ts`, `src/app/api/onboarding/create-org/`, `src/components/auth/`, `src/components/auth-controls.tsx`, `src/app/(app)/layout.tsx`, `src/app/(onboarding)/onboarding/page.tsx`.

---

## All Issues Resolved

| # | Severity | Area | Summary | Status |
|---|----------|------|---------|--------|
| C1 | Critical | Client auth hook | Role read from client-accessible public metadata | ✅ `usePermissions` now fetches from `/api/me` |
| C2 | Critical | Route protection | No middleware — only client-side redirects | ✅ False positive; `src/proxy.ts` is Next.js 16 middleware |
| C3 | Critical | Webhooks | Silent failure → DB permanently out of sync | ✅ Retry with backoff + structured logging + 500 on failure |
| C4 | Critical | Webhooks | Org deletion crashes on FK constraints | ✅ Disconnects users via `updateMany` before delete |
| C5 | Critical | Server org | Dev-only `org-001` fallback bypasses provisioning | ✅ Removed |
| H1 | High | Onboarding | Prisma org created but not Clerk org | ✅ Rejected — Clerk org API not used by this app |
| H2 | High | Permissions | DB role changes don't propagate to Clerk metadata | ✅ All 4 codepaths already sync to Clerk metadata |
| H3 | High | API | No CSRF protection on state-changing routes | ✅ Mitigated — SameSite cookies + Clerk session validation |
| H4 | High | Sign-in | Google OAuth redirect chain | ✅ Added OAuth error detection + URL cleanup |
| H5 | High | Permissions | `usePermissions` never reads from DB | ✅ Now fetches `/api/me` instead of Clerk metadata |
| M1 | Medium | Sign-in | Can't handle passwordless users | ✅ Inspects `supportedFirstFactors` and shows appropriate message |
| M2 | Medium | Sign-in | MFA step has no retreat path | ✅ Added Back button to MFA form |
| M3 | Medium | Sign-in/up | Several async handlers lack try/catch | ✅ All 6 handlers wrapped in try/catch |
| M4 | Medium | Onboarding | Hard navigation after org creation | ✅ Replaced `window.location.href` with `router.push` |
| M5 | Medium | API | `/api/me` returns null silently | ✅ Returns proper 401/404/500 with error messages |
| M6 | Medium | Performance | Two Clerk API calls per server request | ✅ Removed `currentUser()` from `getServerOrganization` |
| L1 | Low | Maintenance | Three duplicated role mappings | ✅ Consolidated into `organization-role.ts` |
| L2 | Low | Types | `PermissionResource` type silently breaks | ✅ `Permission` uses `satisfies \`${string}:${string}\`[]` |
| L3 | Low | UX | Divergent sign-in flows (modal vs page) | ✅ `SignInButton` now uses `mode="redirect"` |
| L4 | Low | API | `authErrorResponse` null return easy to misuse | ✅ Always returns a response; callers simplified |
| L5 | Low | Webhooks | Org update upserts with hardcoded type | ✅ Uses `normalizeOrganizationType` from metadata |
| L6 | Low | Onboarding | Invite code `usedCount` never incremented | ✅ Incremented atomically in Prisma `$transaction` |
