import dotenv from "dotenv";
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

dotenv.config({ path: ".env.local" });

const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION ?? "auto";

const attempts = [
  // Pattern 1: original endpoint, path-style
  { endpoint: "https://storage.railway.app", bucket: "reserved-carrier", pathStyle: true, label: "Original endpoint, path-style" },
  // Pattern 2: bucket endpoint as full URL, no additional bucket
  { endpoint: "https://reserved-carrier.storage.railway.app", bucket: "", pathStyle: true, label: "Bucket subdomain as endpoint, no bucket" },
  // Pattern 3: bucket endpoint as full URL, with bucket name
  { endpoint: "https://reserved-carrier.storage.railway.app", bucket: "reserved-carrier", pathStyle: true, label: "Bucket subdomain as endpoint, with bucket" },
  // Pattern 4: bucket endpoint, virtual-hosted
  { endpoint: "https://storage.railway.app", bucket: "reserved-carrier", pathStyle: false, label: "Original, virtual-hosted" },
];

for (const { endpoint, bucket, pathStyle, label } of attempts) {
  console.log(`\n--- Trying: ${label} ---`);
  console.log(`  endpoint: ${endpoint}, bucket: "${bucket}", forcePathStyle: ${pathStyle}`);

  const client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: pathStyle,
  });

  try {
    await client.send(new PutBucketCorsCommand({
      Bucket: bucket || undefined,
      CORSConfiguration: {
        CORSRules: [{
          AllowedOrigins: ["http://localhost:3000"],
          AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        }],
      },
    }));
    console.log("  ✓ SUCCESS! CORS configured.");
    process.exit(0);
  } catch (err) {
    console.log(`  ✗ ${err.message || err.code || err}`);
  }
}

console.log("\nAll patterns failed.");
