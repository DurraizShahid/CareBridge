# ADR-003: Authentication Provider Selection (Clerk)

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision-makers:** Engineering Team

## Context

CareBridge needs secure, user authentication and user management with:
- Sign in / sign up
- Multi-organization support (hospitals and care facilities)
- User profiles
- Integration with Next.js 16 App Router
- Webhooks to sync user data to our database

## Decision

Use **Clerk** for authentication.

## Why Clerk?
- Native Next.js 16 App Router support
- Beautiful, accessible UI components
- Webhook support for syncing data
- SOC2 compliant (good for healthcare)
- Excellent developer experience

## Integration approach:
1. `@clerk/nextjs SDK`
2. Custom organization management in PostgreSQL (instead of Clerk Organizations)
3. Webhook to sync user/org data to PostgreSQL via Prisma
4. Custom role stored in metadata

## Consequences

### Positive
- No need to build auth from scratch
- Secure, maintained auth provider
- Webhooks keep our database in sync

### Trade-offs
- Third-party dependency (Clerk)
- Paid plans for production scale
- Some lock-in

## Alternatives Considered
- **Auth.js (NextAuth)** - open source, more flexible, but more setup
- **Supabase Auth** - great if using Supabase DB, but we chose separate
- **Firebase Auth** - good ecosystem, but less ideal for Next.js
- **Custom auth** - way too much work, security risk
