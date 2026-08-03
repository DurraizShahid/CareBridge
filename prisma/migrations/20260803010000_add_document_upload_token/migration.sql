-- Document upload tokens bind a server-mediated upload to a single
-- organization and expire after 15 minutes. The S3 object key and its
-- encryption key material are created by the server and handed to the
-- client only through this token, so PHI never touches public/ and
-- unauthorized uploads are rejected at the database level.

CREATE TABLE "DocumentUploadToken" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "encryptionKey" TEXT NOT NULL,
    "encryptionIv" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentUploadToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentUploadToken_organizationId_idx" ON "DocumentUploadToken"("organizationId");
CREATE INDEX "DocumentUploadToken_key_idx" ON "DocumentUploadToken"("key");
CREATE INDEX "DocumentUploadToken_expiresAt_idx" ON "DocumentUploadToken"("expiresAt");
CREATE INDEX "DocumentUploadToken_usedAt_idx" ON "DocumentUploadToken"("usedAt");

ALTER TABLE "DocumentUploadToken"
  ADD CONSTRAINT "DocumentUploadToken_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
