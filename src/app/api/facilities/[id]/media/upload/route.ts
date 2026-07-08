import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getS3Client, getBucketName } from "@/lib/storage";
import { getFacility } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";

const ALLOWED_TYPES: Record<string, readonly string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  gaussian_splat: ["application/octet-stream", "model/ply", "application/x-ply"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

const MAX_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024, // 10 MB
  gaussian_splat: 500 * 1024 * 1024, // 500 MB
  video: 500 * 1024 * 1024, // 500 MB
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { id } = await params;
    const facility = await getFacility(id, org.organizationId, org.role);
    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const body = await req.json();
    const { fileName, contentType, mediaType } = body as {
      fileName: string;
      contentType: string;
      mediaType: "image" | "gaussian_splat" | "video";
    };

    if (!ALLOWED_TYPES[mediaType]?.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type '${contentType}' for media type '${mediaType}'` },
        { status: 400 },
      );
    }

    const maxSize = MAX_SIZES[mediaType];
    const key = `facilities/${id}/${mediaType}/${crypto.randomUUID()}-${fileName}`;

    const client = getS3Client();
    const bucket = getBucketName();

    const { url, fields } = await createPresignedPost(client, {
      Bucket: bucket,
      Key: key,
      Conditions: [
        { bucket },
        ["eq", "$key", key],
        ["eq", "$Content-Type", contentType],
        ["content-length-range", 1, maxSize],
      ],
      Expires: 3600,
    });

    return NextResponse.json({ url, fields, key });
  } catch (error: any) {
    console.error("Error creating presigned upload URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
