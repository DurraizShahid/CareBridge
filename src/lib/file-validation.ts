export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
] as const;

export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;

export class FileValidationError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FileValidationError";
    this.status = status;
  }
}

export type DetectedMagicType =
  | "pdf"
  | "jpeg"
  | "png"
  | "webp"
  | "zip"
  | "ole2"
  | "text";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const OLE2_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const TEXT_SAMPLE_LENGTH = 512;

/**
 * Detect the real file type from magic bytes instead of trusting the
 * browser-supplied Content-Type.
 */
export function detectMagicType(buffer: Buffer): DetectedMagicType | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("latin1") === "%PDF-") {
    return "pdf";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "webp";
  }
  if (
    buffer.length >= 4 &&
    buffer.subarray(0, 2).toString("latin1") === "PK" &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return "zip";
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(OLE2_SIGNATURE)) {
    return "ole2";
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, TEXT_SAMPLE_LENGTH));
  for (const byte of sample) {
    if (byte === 0) return null;
    if (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) return null;
  }
  if (sample.length > 0) return "text";

  return null;
}

/**
 * A valid Office document (docx/xlsx/pptx) is a ZIP container that carries
 * a [Content_Types].xml entry. Plain ZIP archives are rejected.
 */
export function isOfficeZip(buffer: Buffer): boolean {
  const target = Buffer.from("[Content_Types].xml", "latin1");
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) break;
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    if (nameLength === target.length && buffer.subarray(nameStart, nameStart + nameLength).equals(target)) {
      return true;
    }
    offset = nameStart + nameLength + extraLength;
  }
  return false;
}

export interface ValidatedFile {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

function magicToMime(magic: DetectedMagicType): string {
  switch (magic) {
    case "pdf":
      return "application/pdf";
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "zip":
      return "application/zip";
    case "ole2":
      return "application/msword";
    case "text":
      return "text/plain";
  }
}

function mimeFamily(mime: string): string {
  if (
    mime === "application/zip" ||
    mime.startsWith("application/vnd.openxmlformats-officedocument.")
  ) {
    return "office";
  }
  if (mime === "application/msword") return "ole";
  return mime;
}

function mimeCompatible(detected: string, declared: string): boolean {
  const detectedFamily = mimeFamily(detected);
  const declaredFamily = mimeFamily(declared);
  if (detectedFamily === declaredFamily) return true;
  if (detectedFamily === "text/plain" && declaredFamily === "text/csv") return true;
  if (detectedFamily === "text/csv" && declaredFamily === "text/plain") return true;
  return false;
}

/**
 * Validate size, real content type (magic bytes), and declared MIME type.
 * The declared type must be in the allowlist and compatible with what the
 * bytes actually contain.
 */
export function validateDocumentUpload(
  buffer: Buffer,
  declaredName: string,
  declaredType: string | null,
): ValidatedFile {
  const fileSize = buffer.length;
  if (fileSize === 0) {
    throw new FileValidationError(400, "Empty file");
  }
  if (fileSize > MAX_DOCUMENT_SIZE) {
    throw new FileValidationError(
      400,
      `File size exceeds the maximum allowed size of ${Math.floor(MAX_DOCUMENT_SIZE / 1024 / 1024)}MB`,
    );
  }

  const magic = detectMagicType(buffer);
  if (!magic) {
    throw new FileValidationError(400, "Could not determine file type from content");
  }
  const detectedMime = magicToMime(magic);

  const declared = (declaredType ?? "").trim().toLowerCase() || detectedMime;
  if (!(DOCUMENT_MIME_TYPES as readonly string[]).includes(declared)) {
    throw new FileValidationError(400, `Content type '${declared}' is not allowed`);
  }

  if (!mimeCompatible(detectedMime, declared)) {
    throw new FileValidationError(
      400,
      `File content does not match declared type '${declared}'`,
    );
  }

  if (magic === "zip" && !isOfficeZip(buffer)) {
    throw new FileValidationError(
      400,
      "ZIP archives are not allowed; only Office documents (.docx/.xlsx/.pptx) may be uploaded",
    );
  }

  const safeName = declaredName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);

  return {
    fileName: safeName || "document",
    fileSize,
    mimeType: declared,
  };
}
