# CareBridge Deployment Guide

This guide covers deploying CareBridge to production and managing infrastructure.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────►│  PostgreSQL  │     │   S3 Storage │
│   App        │     │  (Prisma)    │     │   (Railway)  │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       │ Webhooks
       ▼
┌──────────────┐
│    Clerk     │
│  (Auth SaaS) │
└──────────────┘
```

### Components

| Component | Purpose | Provider |
|---|---|---|
| Next.js App | Frontend + API routes | Railway / Vercel |
| PostgreSQL | Primary database | Railway / Neon / Supabase |
| S3 Storage | File uploads (media, documents) | Railway Object Storage / AWS S3 |
| Clerk | Authentication & user management | Clerk (SaaS) |

---

## Prerequisites

1. **Node.js 18+** installed
2. **PostgreSQL database** provisioned and accessible
3. **Clerk account** with application configured
4. **S3-compatible storage** (optional, for file uploads)
5. All environment variables set (see [`.env.example`](../.env.example))

---

## Production Build

```bash
# Install dependencies
npm ci

# Generate Prisma client
npm run db:generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Start the production server
npm run start
```

---

## Railway Deployment

CareBridge is optimized for [Railway](https://railway.app/). The project uses Railway's PostgreSQL and Object Storage services.

### Setup Steps

1. **Create a Railway project** with a PostgreSQL service and an Object Storage service.

2. **Configure environment variables** in the Railway dashboard:
   - `DATABASE_URL` -- from Railway's PostgreSQL service
   - `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` -- from Clerk
   - `CLERK_WEBHOOK_SECRET` -- from Clerk webhooks config
   - `S3_*` variables -- from Railway Object Storage

3. **Deploy from GitHub:** Connect your repository; Railway auto-detects Next.js and runs `npm run build`.

4. **Run migrations** after the first deploy:
   ```bash
   npx prisma migrate deploy
   ```

5. **Configure S3 CORS** (if using Railway Object Storage):
   ```bash
   node scripts/configure-s3-cors.mjs
   ```

### Railway Image Domains

The `next.config.ts` is preconfigured to allow images from Railway storage:

```typescript
images: {
  remotePatterns: [
    { hostname: '*.storage.railway.app' }
  ]
}
```

---

## Vercel Deployment

For Vercel deployment:

1. Import the repository on [vercel.com](https://vercel.com).
2. Set all environment variables in the Vercel dashboard.
3. Vercel auto-detects Next.js and handles the build.
4. Run `npx prisma migrate deploy` via Vercel CLI or a deployment hook.

**Note:** File uploads require an external S3-compatible service (not Railway Object Storage).

---

## Clerk Webhook Configuration

Clerk webhooks sync user and organization events to the local database. This is required for the app to function correctly.

### Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/) > Webhooks
2. Create a new endpoint pointing to `https://your-domain.com/api/webhooks`
3. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organization.created`
   - `organization.updated`
   - `organization.deleted`
4. Copy the **Signing Secret** and set it as `CLERK_WEBHOOK_SECRET`

### Testing Webhooks Locally

Use the Clerk CLI to forward webhooks to your local dev server:

```bash
npx clerk webhook forward --url http://localhost:3000/api/webhooks
```

---

## S3 Storage Configuration

CareBridge uses S3-compatible storage for facility media and patient documents.

### Supported Providers

- **Railway Object Storage** (default)
- **AWS S3**
- Any S3-compatible provider (MinIO, DigitalOcean Spaces, etc.)

### CORS Configuration

Run the included script to configure CORS for local development:

```bash
node scripts/configure-s3-cors.mjs
```

For production, update the allowed origins in the script or configure CORS via your provider's dashboard.

### File Size Limits

| Content Type | Max Size |
|---|---|
| Patient documents (PDF, DOCX, etc.) | 50 MB |
| Facility images (JPEG, PNG, WebP, AVIF) | 10 MB |
| Hospital images/logos | 10 MB |
| Facility videos (MP4, WebM) | 500 MB |
| Gaussian splat scans | 500 MB |

---

## Database Migrations

### Development

```bash
# Create a new migration after schema changes
npm run db:dev

# Reset the database (drops all data)
npx prisma migrate reset

# Seed with sample data
npx prisma db seed
```

### Production

```bash
# Apply pending migrations (safe for production)
npx prisma migrate deploy
```

Never run `npm run db:dev` or `prisma migrate reset` in production.

---

## Health Checks

- **App health:** `GET /` should return 200 (landing page)
- **API health:** `GET /api/me` returns user data (requires auth) or 401
- **Database:** Prisma will throw connection errors on startup if the DB is unreachable

---

## Monitoring Checklist

Before going live, verify:

- [ ] All environment variables are set
- [ ] Database migrations have been applied
- [ ] Clerk webhook endpoint is configured and receiving events
- [ ] S3 CORS is configured for the production domain
- [ ] Next.js image domains include your storage provider
- [ ] SSL/TLS is enabled (handled by Railway/Vercel)
- [ ] Database backups are configured
