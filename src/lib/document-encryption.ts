import crypto from "node:crypto";

/**
 * Envelope encryption for the Documentation Vault.
 *
 * Each document gets a random 256-bit file key. The document bytes are
 * encrypted with AES-256-GCM using that file key and a random 96-bit IV.
 * The file key itself is wrapped (encrypted) with a master key derived
 * from DOCUMENT_ENCRYPTION_KEY so key material at rest is useless without
 * the master key. The wrapped key payload carries the file IV; the wrap IV
 * is stored alongside the wrapped key so the wrap operation is
 * deterministic for a given master key.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const WRAP_VERSION = "v1";

export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionError";
  }
}

const TEST_MASTER_KEY = "carebridge-test-master-key";

function getMasterKeyMaterial(): Buffer {
  const configured = process.env.DOCUMENT_ENCRYPTION_KEY;
  const isTest =
    process.env.NODE_ENV === "test" || process.env.VITEST === "true";

  const source = configured ?? (isTest ? TEST_MASTER_KEY : undefined);

  if (!source) {
    throw new EncryptionError(
      "DOCUMENT_ENCRYPTION_KEY is not set. PHI documents cannot be encrypted without a master key.",
    );
  }

  if (/^[0-9a-fA-F]{64}$/.test(source)) {
    return Buffer.from(source, "hex");
  }

  if (source.length >= 16) {
    return crypto.createHash("sha256").update(source, "utf8").digest();
  }

  throw new EncryptionError(
    "DOCUMENT_ENCRYPTION_KEY must be at least 16 characters (or 64 hex characters).",
  );
}

export function getMasterKey(): Buffer {
  return getMasterKeyMaterial();
}

export interface DocumentKeyMaterial {
  fileKey: Buffer;
  fileIv: Buffer;
  wrappedKey: string;
  wrapIv: string;
}

/**
 * Wrap a file key with the master key. The returned wrappedKey payload is
 * `v1:<authTagB64>:<fileIvB64>:<ciphertextB64>` — the file IV travels inside
 * the authenticated payload so tampering with either breaks decryption.
 */
export function wrapKeyMaterial(fileKey: Buffer): { wrappedKey: string; wrapIv: string } {
  const masterKey = getMasterKeyMaterial();
  const fileIv = crypto.randomBytes(IV_LENGTH);
  const wrapIv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, wrapIv);
  const wrapped = Buffer.concat([cipher.update(fileKey), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    wrappedKey: [
      WRAP_VERSION,
      tag.toString("base64"),
      fileIv.toString("base64"),
      wrapped.toString("base64"),
    ].join(":"),
    wrapIv: wrapIv.toString("base64"),
  };
}

export function generateDocumentKeyMaterial(): DocumentKeyMaterial {
  const fileKey = crypto.randomBytes(KEY_LENGTH);
  const { wrappedKey, wrapIv } = wrapKeyMaterial(fileKey);
  const { fileIv } = unwrapKeyMaterial(wrappedKey, wrapIv);
  return { fileKey, fileIv, wrappedKey, wrapIv };
}

export function unwrapKeyMaterial(
  wrappedKey: string,
  wrapIv: string,
): { fileKey: Buffer; fileIv: Buffer } {
  const [version, tagB64, fileIvB64, ciphertextB64] = wrappedKey.split(":");
  if (version !== WRAP_VERSION || !tagB64 || !fileIvB64 || !ciphertextB64) {
    throw new EncryptionError("Unsupported wrapped key format");
  }

  const masterKey = getMasterKeyMaterial();
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, Buffer.from(wrapIv, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const fileKey = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);
  if (fileKey.length !== KEY_LENGTH) {
    throw new EncryptionError("Wrapped key has unexpected length");
  }
  return { fileKey, fileIv: Buffer.from(fileIvB64, "base64") };
}

export function encryptDocument(buffer: Buffer, fileKey: Buffer, fileIv: Buffer): Buffer {
  const cipher = crypto.createCipheriv(ALGORITHM, fileKey, fileIv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([ciphertext, cipher.getAuthTag()]);
}

export function decryptDocument(ciphertext: Buffer, fileKey: Buffer, fileIv: Buffer): Buffer {
  if (ciphertext.length < TAG_LENGTH) {
    throw new EncryptionError("Ciphertext is too short");
  }
  const body = ciphertext.subarray(0, ciphertext.length - TAG_LENGTH);
  const tag = ciphertext.subarray(ciphertext.length - TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, fileKey, fileIv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

export function sha256Hex(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
