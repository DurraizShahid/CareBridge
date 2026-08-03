import crypto from "node:crypto";
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  decryptDocument,
  encryptDocument,
  generateDocumentKeyMaterial,
  sha256Hex,
  unwrapKeyMaterial,
} from "@/lib/document-encryption";
import { FileValidationError, validateDocumentUpload } from "@/lib/file-validation";
import { scanForMalware } from "@/lib/malware-scan";
import { getS3Client, requireS3Config, StorageError, verifyStoredObject } from "@/lib/storage";

export interface StoredDocument {
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  encryptionKey: string;
  encryptionIv: string;
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

/**
 * Validate, scan, encrypt, and store a document in private S3. The stored
 * object is verified with a HEAD request; any failure removes the object
 * so no orphaned ciphertext remains.
 */
export async function storeDocumentUpload(
  buffer: Buffer,
  declaredName: string,
  declaredType: string | null,
  organizationId: string,
): Promise<StoredDocument> {
  const validated = validateDocumentUpload(buffer, declaredName, declaredType);

  const scan = await scanForMalware(buffer, validated.mimeType);
  if (!scan.safe) {
    throw new FileValidationError(400, `File failed malware scan: ${scan.reason}`);
  }

  const { bucket } = requireS3Config();

  const material = generateDocumentKeyMaterial();
  const ciphertext = encryptDocument(buffer, material.fileKey, material.fileIv);
  const checksum = sha256Hex(buffer);
  const key = `orgs/${organizationId}/documents/${crypto.randomUUID()}-${validated.fileName}`;

  const client = getS3Client();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: new Uint8Array(ciphertext),
        ContentType: "application/octet-stream",
        ContentLength: ciphertext.length,
        Metadata: {
          checksum,
          encrypted: "true",
        },
      }),
    );

    await verifyStoredObject({
      bucket,
      key,
      expectedContentLength: ciphertext.length,
      expectedContentType: "application/octet-stream",
    });
  } catch (error: unknown) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      // best-effort cleanup
    }
    if (error instanceof StorageError) throw error;
    throw new StorageError(500, "Failed to store encrypted document in S3");
  }

  return {
    key,
    fileName: validated.fileName,
    fileSize: validated.fileSize,
    mimeType: validated.mimeType,
    checksum,
    encryptionKey: material.wrappedKey,
    encryptionIv: material.wrapIv,
  };
}

export async function fetchDocumentObject(bucket: string, key: string): Promise<Buffer> {
  const client = getS3Client();
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) {
      throw new StorageError(500, "Stored object returned no body");
    }
    return await streamToBuffer(response.Body as ReadableStream<Uint8Array>);
  } catch (error: unknown) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(500, "Failed to retrieve encrypted document from S3");
  }
}

export function decryptStoredDocument(
  ciphertext: Buffer,
  encryptionKey: string,
  encryptionIv: string,
  expectedChecksum?: string | null,
): Buffer {
  const material = unwrapKeyMaterial(encryptionKey, encryptionIv);
  const plaintext = decryptDocument(ciphertext, material.fileKey, material.fileIv);

  if (expectedChecksum) {
    const actual = sha256Hex(plaintext);
    if (actual !== expectedChecksum) {
      throw new Error(
        "Document checksum mismatch — stored object may be corrupted or tampered with",
      );
    }
  }

  return plaintext;
}
