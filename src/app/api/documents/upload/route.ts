import { NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getS3Client, getBucketName, hasS3Config } from "@/lib/storage";
import { requireOrgPermission, authErrorResponse } from "@/lib/server-auth";

const ALLOWED_MIME: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];

const MAX_SIZE = 50 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { org } = await requireOrgPermission("documents:create");

    const body = await request.json();
    const { fileName, contentType, fileSize } = body as {
      fileName: string;
      contentType: string;
      fileSize?: number;
    };

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "File name and content type are required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME.includes(contentType)) {
      return NextResponse.json(
        { error: `Content type '${contentType}' is not allowed` },
        { status: 400 },
      );
    }

    if (fileSize && fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum allowed size of 50MB" },
        { status: 400 },
      );
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const orgId = org.organizationId;
    const key = `orgs/${orgId}/documents/${crypto.randomUUID()}-${safeFileName}`;

    const isLocalDev = process.env.NODE_ENV === "development" || request.headers.get("host")?.includes("localhost");

    if (hasS3Config() && !isLocalDev) {
      const client = getS3Client();
      const bucket = getBucketName();

      const { url, fields } = await createPresignedPost(client, {
        Bucket: bucket,
        Key: key,
        Conditions: [
          { bucket },
          ["eq", "$key", key],
          ["eq", "$Content-Type", contentType],
          ["content-length-range", 1, MAX_SIZE],
        ],
        Expires: 3600,
      });

      return NextResponse.json({ url, fields, key });
    }

    return NextResponse.json({
      url: "/api/documents/upload/local",
      fields: null,
      key,
      _local: true,
      _contentType: contentType,
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
