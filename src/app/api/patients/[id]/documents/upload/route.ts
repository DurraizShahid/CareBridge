import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getS3Client, getBucketName } from "@/lib/storage";

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
    const body = await req.json();
    const { fileName, contentType } = body as {
      fileName: string;
      contentType: string;
    };

    if (!ALLOWED_MIME.includes(contentType)) {
      return NextResponse.json(
        { error: `Content type '${contentType}' is not allowed` },
        { status: 400 },
      );
    }

    const key = `patients/${id}/documents/${crypto.randomUUID()}-${fileName}`;
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
