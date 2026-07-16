import { NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getS3Client, getBucketName } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireOrgPermission } from "@/lib/server-auth";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

function sanitizeFileName(fileName: string): string {
  return fileName
    .split(/[\\/]/)
    .pop()
    ?.replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120) || "upload";
}

export async function POST(req: Request) {
  try {
    const { org } = await requireOrgPermission("hospitals:manage");

    const body = await req.json();
    const { fileName, contentType, hospitalId, field } = body as {
      fileName: string;
      contentType: string;
      hospitalId: string;
      field: "image" | "logo";
    };

    if (
      typeof fileName !== "string"
      || typeof contentType !== "string"
      || typeof hospitalId !== "string"
      || !hospitalId
      || hospitalId === "temp"
      || (field !== "image" && field !== "logo")
    ) {
      return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(contentType)) {
      return NextResponse.json(
        { error: `Content type '${contentType}' is not allowed` },
        { status: 400 },
      );
    }

    const hospital = await prisma.hospital.findFirst({
      where: org.isSuperadmin
        ? { id: hospitalId }
        : { id: hospitalId, organizationId: org.organizationId },
      select: { id: true },
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    const key = `hospitals/${hospitalId}/${field}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
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
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
