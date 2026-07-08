# ADR-002: Database & ORM Selection

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision-makers:** Engineering Team

## Context

CareBridge needs a reliable, scalable database solution for:
- Storing patient, facility, placement, and user data
- Supporting multi-tenant organization isolation
- Ensuring ACID compliance for placement transactions
- Type-safe database access from our Next.js application

## Decision

We will use **PostgreSQL** with **Prisma ORM**.

### Database: PostgreSQL
- Relational database with strong ACID guarantees
- Supports complex queries and relationships
- Mature ecosystem and wide adoption in healthcare
- Supports JSON columns for flexible data
- Managed hosting options (Supabase, Neon, AWS RDS, etc.)

### ORM: Prisma
- Type-safe database client generated from schema
- Declarative schema definition
- Automatic migrations
- Built-in query builder
- Support for multiple databases
- Excellent developer experience

### Multi-tenant isolation
- Organization ID on all tables
- Row-level security can be added later if needed

## Schema structure:
```
Organization (id, name, slug, type, timestamps)
  ├─ User (id, email, role, organizationId)
  ├─ Patient (id, mrn, socialWorkerId, organizationId)
  ├─ Facility (id, name, type, organizationId)
  ├─ Hospital (id, name, organizationId)
  ├─ Placement (id, patientId, facilityId, organizationId)
  ├─ ActivityEvent (id, type, organizationId)
  ├─ InviteCode (id, code, role, expiresAt, maxUses, usedCount, isActive)
  └─ JoinRequest (id, userId, organizationId, inviteCodeId, status, requestedRole, reviewedById, reviewedAt)
```

## Consequences

### Positive
- Type-safe data access prevents bugs
- Easy migrations and schema management
- Excellent tooling and developer experience
- PostgreSQL is widely understood and supported

### Trade-offs
- Learning curve for Prisma if team new to it
- Prisma generates client adds some overhead (acceptable for our use case)

## Alternatives Considered

- **MongoDB** - NoSQL, flexible schema, but poor fit for relational data
- **MySQL** - Similar to PostgreSQL, but Postgres has better JSON and full-text search
- **Supabase (Postgres + Auth)** - Great option, but we chose separate auth (Clerk)
- **Drizzle ORM** - Alternative ORM, good performance, but Prisma has better docs and ecosystem
- **TypeORM** - More complex, more boilerplate
