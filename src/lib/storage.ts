import { S3Client } from "@aws-sdk/client-s3";

function getStorageConfig() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION ?? "auto";

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing S3 configuration. Ensure S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY are set.",
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

export function getEndpoint(): string {
  return getStorageConfig().endpoint;
}
