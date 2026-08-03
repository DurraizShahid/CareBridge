# HIPAA Documentation Vault — Compliance & User Guide

## 1. HIPAA Security Practices

### Encryption at Rest
The Documentation Vault implements envelope encryption for PHI documents at rest:

- **Master Encryption Key**: Stored in environment variable `DOCUMENT_ENCRYPTION_KEY` (256-bit AES key)
- **Per-Document Keys**: Each document gets a unique encryption key and initialization vector, stored as `encryptionKey` and `encryptionIv` on the Document model (encrypted with the master key before storage)
- **Storage Layer**: Files stored on S3-compatible storage (Railway) with SSE at the provider level

### Encryption in Transit
- **API traffic**: TLS enforced via HSTS header (`max-age=63072000; includeSubDomains; preload`)
- **File uploads**: Server-mediated uploads over HTTPS only. The client posts the file body to the vault API; the server validates, scans, encrypts, and stores it. The browser never holds an S3 URL.
- **File downloads**: Server-side streaming GET via the vault API (HTTPS). No presigned URLs exposed to the client.
- **No public URLs**: Files are never accessible via direct S3 public URLs

### Upload Pipeline (Defense in Depth)
1. **Client sends** file bytes to `POST /api/documents/upload` (HTTPS, authenticated)
2. **Magic-byte validation**: File content is checked against its declared MIME type (PDF, DOCX, JPEG, PNG, TXT, CSV, etc.). Files whose content does not match the declared type are rejected. ZIP-based office formats are validated by parsing their local file headers.
3. **Malware scan**: Built-in heuristics scan for executable signatures (PE `MZ` header, ELF magic, `#!` shebang) and embedded script markers. If `MALWARE_SCAN_URL` is configured, the file is also submitted to the external scanner — the upload **fails closed** if the scanner is unavailable or returns a non-OK response.
4. **Server-side encryption**: The file is encrypted in memory with a per-document AES-256 key (wrapped by the master `DOCUMENT_ENCRYPTION_KEY`), then stored on S3. Plaintext never touches storage.
5. **Upload token**: A one-time, 15-minute `DocumentUploadToken` (created by the API, linked to org + user) is required to complete the upload; the token row is recorded on the stored document and can never be reused. Client-generated tokens and presigned URLs are not accepted.

### Access Control (RBAC)

| Role | documents:read | documents:create | documents:update | documents:delete | documents:audit |
|------|:---:|:---:|:---:|:---:|:---:|
| superadmin | ✓ | ✓ | ✓ | ✓ | ✓ |
| administrator | ✓ | ✓ | ✓ | ✓ | ✓ |
| social-worker | ✓ | ✓ | ✗ | ✗ | ✗ |
| discharge-planner | ✓ | ✓ | ✗ | ✗ | ✗ |
| facility-coordinator | ✓ | ✓ | ✓ | ✗ | ✗ |
| customer | ✓ | ✗ | ✗ | ✗ | ✗ |

- **Least privilege**: Every role has minimum permissions needed
- **Organization isolation**: All queries scoped by `organizationId`
- **No IDOR**: Document access verified against org + role on every request

### Audit Logging
- **Immutable logs**: `DocumentAccessLog` model — no update/delete API exists for logs
- **Tracked actions**: VIEW, DOWNLOAD, UPLOAD, UPDATE, DELETE, SHARE, EXPORT, ARCHIVE, RESTORE
- **Captured data**: User ID, action, timestamp, IP address, user agent, success/failure, details
- **Failed attempts**: Unauthorized access attempts also logged
- **Retention**: Logs retained per organizational policy (configurable retention date on documents)

### Data Isolation (Multi-Tenant)
- Every database query includes `organizationId` filter
- Superadmin bypass is explicit (`isSuperadmin()` check)
- Storage paths isolated by tenant: `orgs/{orgId}/documents/{uuid}-{filename}`
- Cross-tenant access is impossible at the query level

### File Security
- **MIME validation**: Whitelist of allowed types (PDF, DOCX, JPEG, PNG, TXT, CSV, etc.)
- **Magic-byte checks**: Declared MIME type must match actual file content; executable signatures (MZ, ELF, shebang) rejected outright
- **Size limits**: Maximum 50MB per file
- **Secure naming**: UUID-based storage keys — no original filenames in storage paths
- **No executable uploads**: MIME whitelist + magic-byte + heuristic malware scanning prevent script/executable upload
- **Integrity**: SHA-256 checksums stored for file verification
- **Fail-closed scanning**: With `MALWARE_SCAN_URL` configured, uploads are rejected if the scanner cannot be reached

### Retention & Lifecycle
- **Soft delete**: Documents marked with `deletedAt` timestamp — never hard-deleted from API
- **Legal hold**: `isOnLegalHold` flag prevents deletion of documents under legal hold
- **Retention dates**: Per-document `retentionDate` field for compliance scheduling
- **Expiration**: Automatic expiration support via `expiresAt` field

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Client Browser                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Dashboard UI (shadcn + TanStack Table)          │    │
│  │  Document Upload Dialog                          │    │
│  │  Document Detail (Tabs: Info/Version/Access)     │    │
│  └──────────────────────┬──────────────────────────┘    │
└─────────────────────────┼──────────────────────────────┘
                          │ HTTPS + Clerk Auth
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js 16 App Router                                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Middleware    │  │  API Routes  │  │  Server       │  │
│  │  (Clerk Auth + │──│  /api/documents/* │  Components  │  │
│  │   Rate Limit)  │  └──────┬───────┘  └──────────────┘  │
│  └──────────────┘         │                             │
│                     ┌─────┴──────┐                      │
│                     │  RBAC       │                      │
│                     │  (5 doc     │                      │
│                     │   perms)    │                      │
│                     └─────┬──────┘                      │
└───────────────────────────┼────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  PostgreSQL       │ │  S3 Storage   │ │  Audit Logs      │
│  (Prisma ORM)     │ │  (Railway)    │ │  (DocumentAccess  │
│                   │ │               │ │   Log table)      │
│  Document         │ │  orgs/{id}/   │ │                   │
│  DocumentVersion  │ │  documents/   │ │  Immutable        │
│  DocumentAccessLog│ │  {uuid}-{fn}  │ │  No delete API    │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

---

## 3. API Endpoints Reference

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/documents` | `documents:read` | List/search documents (paginated, filterable) |
| `POST` | `/api/documents` | `documents:create` | Create document record after upload |
| `POST` | `/api/documents/upload` | `documents:create` | Upload file (validate, scan, encrypt, store) and create document record |
| `GET` | `/api/documents/stats` | `documents:read` | Get vault statistics |
| `GET` | `/api/documents/[id]` | `documents:read` | Get single document (logs VIEW) |
| `PATCH` | `/api/documents/[id]` | `documents:update` | Update document metadata |
| `DELETE` | `/api/documents/[id]` | `documents:delete` | Soft-delete document |
| `POST` | `/api/documents/[id]/download` | `documents:read` | Download file (server-side streamed, audit logged) |
| `GET` | `/api/documents/[id]/versions` | `documents:read` | Get version history |
| `GET` | `/api/documents/[id]/access-logs` | `documents:audit` | Get paginated access logs |

### Query Parameters (List/Search)

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search across title, description, tags, filename |
| `category` | enum | Filter by document category |
| `tags` | string (comma-sep) | Filter by tags (OR match) |
| `uploadedById` | string | Filter by uploader |
| `isArchived` | boolean | Show only archived documents |
| `dateFrom` | ISO date | Filter by created date >= |
| `dateTo` | ISO date | Filter by created date <= |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |
| `sortBy` | string | Sort field (default: createdAt) |
| `sortOrder` | asc/desc | Sort direction (default: desc) |

---

## 4. User Guide

### Uploading Documents
1. Navigate to **Dashboard → Documentation Vault** (`/dashboard/documents`)
2. Click **"Upload Document"** button (requires `documents:create` permission)
3. In the upload dialog:
   - Select a file (PDF, DOCX, TXT, CSV, JPEG, PNG — max 50MB)
   - Enter a **Title** for the document
   - Select a **Category** from the dropdown
   - Optionally add **Tags**, **Description**, **Notes**
   - Optionally set **Retention Date** or **Expiration Date**
4. Click **"Upload"** — the file is transmitted to the server, which validates content, scans for malware, encrypts with a per-document key, and stores it. The file is not stored until all checks pass.
5. The document appears in the vault listing immediately

### Searching Documents
- Use the **search bar** to search across title, description, tags, and filename
- Use **category filter** to narrow by document type
- Use **date range** to find documents from specific periods
- Toggle **archived** filter to include archived documents
- Results are paginated (20 per page, sortable by any column)

### Viewing Document Details
1. Click on a document title in the table to open the detail page
2. The **Info tab** shows full metadata: category, tags, description, version history, notes
3. The **Version History tab** shows all previous versions with uploader and timestamps
4. The **Access Log tab** shows who viewed/downloaded/modified the document (requires `documents:audit`)

### Downloading Documents
1. Click the **Download** button on the document row or detail page
2. The file is streamed from encrypted storage, decrypted server-side, and delivered over HTTPS (audit logged)
3. The download is delivered through the vault API — no expiring public URLs

### Archiving / Deleting Documents
- **Archive**: Update the document and set `isArchived: true` (requires `documents:update`)
- **Delete**: Click the Delete button (requires `documents:delete`)
  - Documents are **soft-deleted** — recoverable by admin
  - Documents under **legal hold** cannot be deleted
  - Access is logged in the audit trail

---

## 5. Testing Report

### Security Tests (50 tests)
- **Permission tests**: 16 tests covering all 5 document permissions across all 6 roles
  - Verified only `superadmin` and `administrator` have `documents:delete`
  - Verified `customer` has only `documents:read`
  - Wildcard matching (`documents:*`) verified for superadmin
- **API Security tests**: 34 tests covering:
  - Authentication bypass prevention
  - Authorization checks (wrong org returns null, not data)
  - Soft-delete filtering (deleted docs excluded from list results)
  - Legal hold enforcement (delete throws 409)
  - Pagination clamping (pageSize max 100, page min 1)
  - Category enum consistency (kebab–snake round-trip for all 13 categories)
  - Input validation edge cases (empty tags, long titles, minimal payloads)
  - **Upload token lifecycle**: creation with 15-minute expiry, valid/invalid token lookup (expired, used, wrong-org), single-use consumption (race winner wins, loser gets false)

### File Validation
- MIME type whitelist enforced at upload API
- File size limit (50MB) enforced at upload API
- Secure filename generation (alphanumeric + uuid prefix)
- No executable/script uploads allowed (magic-byte + heuristic scan)
- Fail-closed external malware scan when `MALWARE_SCAN_URL` is configured

### Audit Verification
- Every VIEW/DOWNLOAD/UPLOAD/UPDATE/DELETE action logged via `logDocumentAccess()`
- Access logs include: userId, action, timestamp, IP address, user agent, success/failure
- No update or delete API exists for `DocumentAccessLog`
- Failed/unauthenticated access attempts: HTTP 401/403 returned, unauthorized requests logged

### Edge Cases Covered
- Empty document lists return empty data array with valid pagination
- Very long titles (>200 chars) handled correctly
- Pagination at boundaries (page 0 → clamped to 1, negative page → clamped to 1)
- Missing optional fields default correctly
- Superadmin bypasses org scoping (sees all orgs' documents)
- Cross-tenant queries return null instead of cross-org data

---

## 6. Remaining Risks

### Compliance Gaps
| Risk | Severity | Mitigation |
|------|----------|------------|
| No automated breach notification workflow | Medium | Manual process required; logs available for review |
| No BAA confirmation in app | Medium | BAA documents supported in vault but no automated workflow |
| MFA not enforced | Medium | Available via Clerk (TOTP) but not required |
| No formal penetration testing | High | Unit/security tests pass; pen testing needed before production |

### Operational Requirements
- **Business Associate Agreement (BAA)**: Required with Railway (S3 storage provider) before storing PHI
- **Database encryption**: PostgreSQL at rest encryption should be enabled at the infrastructure level
- **Backup policy**: Regular backups of both PostgreSQL and S3 storage
- **Incident response plan**: Documented procedure for PHI breach notification

### Future Improvements
- Add document preview (PDF viewer, image viewer) inline in the browser
- Implement automated retention policy enforcement (cron job to purge expired documents)
- Add batch operations (bulk archive, bulk delete with confirmation)
- Implement document sharing with expiring external links
- Add watermarking for downloaded documents
- Implement full-text search with PostgreSQL tsvector
- Add document templates and auto-generated compliance forms
- Integrate with e-signature providers
