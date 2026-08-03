import { NextResponse } from "next/server";
import { storeDocumentUpload } from "@/lib/document-upload";
import { createDocumentUploadToken, UPLOAD_TOKEN_TTL_MS } from "@/lib/data-access";
import { FileValidationError, MAX_DOCUMENT_SIZE } from "@/lib/file-validation";
import { authErrorResponse, requireOrgPermission } from "@/lib/server-auth";

/**
 * Server-mediated document upload.
 *
 * The file never reaches the browser's static file system: it is validated by
 * magic bytes, malware-scanned, encrypted, stored in private S3, and verified
 * with a HEAD request. A one-time database-backed upload token bound to the
 * organization and the generated storage key is returned so that document
 * metadata can only be registered for objects this endpoint created.
 */
export async function POST(request: Request) {
  try {
    const { org } = await requireOrgPermission("documents:create");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the maximum allowed size of ${Math.floor(MAX_DOCUMENT_SIZE / 1024 / 1024)}MB`,
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const stored = await storeDocumentUpload(
      buffer,
      file.name ?? "document",
      file.type || null,
      org.organizationId,
    );

    const token = await createDocumentUploadToken({
      organizationId: org.organizationId,
      key: stored.key,
      fileName: stored.fileName,
      fileSize: stored.fileSize,
      mimeType: stored.mimeType,
      checksum: stored.checksum,
      encryptionKey: stored.encryptionKey,
      encryptionIv: stored.encryptionIv,
    });

    return NextResponse.json(
      {
        uploadToken: token.id,
        key: stored.key,
        fileName: stored.fileName,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
        expiresIn: UPLOAD_TOKEN_TTL_MS / 1000,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof FileValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}
