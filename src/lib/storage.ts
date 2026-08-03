import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === "test" || process.env.VITEST === "true";
}

export class StorageError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "StorageError";
    this.status = status;
  }
}

function getStorageConfig() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET ?? process.env.S3_BUCKET_NAME;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION ?? "auto";

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new StorageError(
      503,
      "S3 storage is not configured. PHI documents cannot be stored without " +
        "private S3-compatible storage (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY).",
    );
  }

  return { endpoint, bucket, accessKeyId, secretAccessKey, region };
}

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    const { endpoint, accessKeyId, secretAccessKey, region } =
      getStorageConfig();
    s3Client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: false,
    });
  }
  return s3Client;
}

export function getBucketName(): string {
  return getStorageConfig().bucket;
}

export function hasS3Config(): boolean {
  const bucket = process.env.S3_BUCKET ?? process.env.S3_BUCKET_NAME;
  return !!(
    process.env.S3_ENDPOINT &&
    bucket &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY
  );
}

/**
 * Private S3 storage is mandatory in every environment except isolated tests.
 * Upload/registration routes call this to fail fast instead of silently
 * falling back to an insecure local path.
 */
export function requireS3Config(): { bucket: string; endpoint: string } {
  if (isTestEnvironment() && !hasS3Config()) {
    return { bucket: "test-bucket", endpoint: "https://test.invalid" };
  }
  return { bucket: getBucketName(), endpoint: getStorageConfig().endpoint };
}

export function getEndpoint(): string {
  return getStorageConfig().endpoint;
}

/**
 * Verify that an uploaded object is present in the bucket with the expected
 * size and content type. Throws StorageError on mismatch.
 */
export async function verifyStoredObject(params: {
  bucket: string;
  key: string;
  expectedContentLength: number;
  expectedContentType: string;
}): Promise<void> {
  if (isTestEnvironment() && !hasS3Config()) return;

  const client = getS3Client();
  let head;
  try {
    head = await client.send(
      new HeadObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
      }),
    );
  } catch (error: unknown) {
    console.error("[storage] HEAD failed for object:", params.key, error);
    throw new StorageError(500, "Uploaded object could not be verified");
  }

  if (head.ContentLength !== params.expectedContentLength) {
    console.error(
      `[storage] Size mismatch for '${params.key}': expected ${params.expectedContentLength}, got ${head.ContentLength}`,
    );
    throw new StorageError(500, "Uploaded object size verification failed");
  }

  if (head.ContentType && head.ContentType !== params.expectedContentType) {
    console.error(
      `[storage] Content-Type mismatch for '${params.key}': expected '${params.expectedContentType}', got '${head.ContentType}'`,
    );
    throw new StorageError(500, "Uploaded object content type verification failed");
  }
}
