# Local PostgreSQL verification

Docker Desktop runs PostgreSQL 17 in container carebridge-pg with
persistent volume carebridge_pgdata. Host connection: localhost:5433,
database carebridge_dev. Host port 5432 was unavailable.

Local credentials and ESIGN_IP_HASH_SECRET are stored ONLY in ignored
.env.local. .env preserves the Railway connection for later.

Start: docker start carebridge-pg
Migration status: npx prisma migrate status
Apply migrations: npx prisma migrate deploy

To run actual DB integration tests, set CAREBRIDGE_LOCAL_E2E=1 and
DATABASE_URL from .env.local in your PowerShell process, then execute:
npx vitest run src/lib/__tests__/money-loop.integration.test.ts

Tests call real Next.js API handlers and use real Prisma/Postgres writes,
but simulate the two authenticated organization contexts. The synthetic
hospital/facility DB users are not real Clerk login identities.
Clerk/browser authorization and Stripe test/live processing remain
separate verification steps. No actual patient information is used.

Synthetic test records are intentionally left on the local DB for
independent inspection. Do not run these tests on production data.