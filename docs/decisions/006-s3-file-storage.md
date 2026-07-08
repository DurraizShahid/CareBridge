# ADR-006: S3 File Storage & Media Management

## Status

Accepted

## Date

2026-07-08

## Context

CareBridge needs to store binary files for two use cases:

1. **Facility media** -- Images, videos, and 3D gaussian splat scans that showcase facilities to social workers making placement decisions
2. **Patient documents** -- Medical records, insurance forms, and discharge paperwork attached to patient records
3. **Hospital branding** -- Hospital photos and logos

Requirements:
- Files must be accessible via public URLs for rendering in the browser
- Upload sizes range from small images (< 10 MB) to large video/3D files (up to 500 MB)
- Files must be scoped to their parent entity (facility, patient, hospital)
- The database should not store binary data directly
- The upload flow should work with the existing Next.js API routes

## Decision

Use **S3-compatible object storage** with **presigned POST URLs** for direct client-to-storage uploads.

### Storage Provider

Railway Object Storage (S3-compatible) was chosen because:
- Same platform as the database and app hosting (single billing, low-latency access)
- Standard S3 API compatibility (can swap to AWS S3 or MinIO without code changes)
- Built-in CDN-style public URLs

### Upload Architecture

```
Client                    API Route                   S3
  │                          │                         │
  ├── POST /upload ──────────►                         │
  │   { fileName,            │                         │
  │     contentType }        ├── createPresignedPost ──►
  │                          │                         │
  │   ◄── { url, fields, ───┤◄── presigned URL ───────┤
  │        key }             │                         │
  │                          │                         │
  ├── POST url (multipart) ────────────────────────────►
  │   (direct to S3)         │                    stores file
  │                          │                         │
  ├── POST /metadata ────────►                         │
  │   { key, url, name }     ├── prisma.create() ─────►
  │                          │   (DB record only)      │
  ◄── 201 Created ───────────┤                         │
```

This two-step flow (presigned URL + metadata record) keeps large files out of the API server's memory.

### S3 Key Structure

```
facilities/{facilityId}/{mediaType}/{uuid}-{fileName}
patients/{patientId}/documents/{uuid}-{fileName}
hospitals/{hospitalId}/{field}/{uuid}-{fileName}
```

UUIDs prevent key collisions; original filenames are preserved for readability.

### File Type and Size Limits

| Category | Allowed Types | Max Size |
|---|---|---|
| Facility images | JPEG, PNG, WebP, AVIF | 10 MB |
| Facility videos | MP4, WebM, QuickTime | 500 MB |
| Gaussian splats | octet-stream, PLY, SPZ | 500 MB |
| Patient documents | PDF, JPEG, PNG, WebP, DOC, DOCX, TXT, CSV | 50 MB |
| Hospital images | JPEG, PNG, WebP, AVIF | 10 MB |

### Database Models

- `FacilityMedia` -- Stores metadata (type, S3 key, URL, dimensions, display order)
- `PatientDocument` -- Stores metadata (name, S3 key, URL, category, uploader)

Hospital images are stored as URL fields directly on the `Hospital` model.

## Alternatives Considered

### Store files in PostgreSQL (bytea columns)
- Pros: Single data store, transactional consistency
- Cons: Terrible performance for large files, bloats database, no CDN
- Rejected: Not viable for 500 MB video files

### Cloudinary / Uploadthing
- Pros: Managed upload UX, image transformations
- Cons: Additional vendor, cost at scale, lock-in
- Rejected: S3-compatible storage is simpler and more portable

### Server-side upload (stream through API route)
- Pros: Simpler client code
- Cons: API server becomes a bottleneck for large files, uses server memory/bandwidth
- Rejected: Presigned URLs are the standard pattern for large file uploads

## Consequences

- Client-side upload code must handle the two-step flow (presigned URL, then metadata POST)
- CORS must be configured on the S3 bucket for browser uploads
- Deleting a DB record does not automatically delete the S3 object (orphan cleanup not implemented)
- Swapping storage providers only requires changing the S3 credentials and endpoint
