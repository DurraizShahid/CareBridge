import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getS3Client, getBucketName } from "@/lib/storage";
import { getPatient } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";

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

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }
    if (!roleHasPermission(org.role, "patients:update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const patient = await getPatient(id, org.organizationId, org.role);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await req.json();
    const { fileName, contentType } = body as {
      fileName: string;
      contentType: string;
    };
    if (!fileName || !contentType) {
      return NextResponse.json({ error: "File name and content type are required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(contentType)) {
      return NextResponse.json(
        { error: `Content type '${contentType}' is not allowed` },
        { status: 400 },
      );
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const key = `patients/${id}/documents/${crypto.randomUUID()}-${safeFileName}`;
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
    console.error("Error creating presigned upload URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
