import { NextResponse } from "next/server";
import {
  DataAccessError,
  getDocumentWithKeyMaterial,
  logDocumentAccess,
} from "@/lib/data-access";
import { decryptStoredDocument, fetchDocumentObject } from "@/lib/document-upload";
import { authErrorResponse, requireOrgPermission } from "@/lib/server-auth";
import { StorageError } from "@/lib/storage";

/**
 * Download route.
 *
 * The stored object is encrypted at rest, so files are retrieved by the
 * server, decrypted with the per-document key (unwrapped by the master key),
 * verified against the stored SHA-256 checksum, and streamed to the caller.
 * No direct S3 signed URL is ever exposed.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { org } = await requireOrgPermission("documents:read");

    const { id } = await params;
    const doc = await getDocumentWithKeyMaterial(id, org.organizationId, org.role);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (!doc.encryptionKey || !doc.encryptionIv) {
      return NextResponse.json(
        { error: "Document is not encrypted and cannot be served" },
        { status: 500 },
      );
    }

    const ciphertext = await fetchDocumentObject(doc.storageBucket, doc.storageKey);
    const plaintext = decryptStoredDocument(
      ciphertext,
      doc.encryptionKey,
      doc.encryptionIv,
      doc.checksum,
    );

    await logDocumentAccess({
      documentId: id,
      userId: org.userId,
      action: "DOWNLOAD",
    });

    const body = new Uint8Array(
      plaintext.buffer,
      plaintext.byteOffset,
      plaintext.byteLength,
    );
    const encodedName = encodeURIComponent(doc.fileName);

    return new Response(body as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(plaintext.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}
