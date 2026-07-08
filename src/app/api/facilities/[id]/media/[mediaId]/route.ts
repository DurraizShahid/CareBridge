import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client, getBucketName } from "@/lib/storage";
import { deleteFacilityMedia } from "@/lib/data-access";
import { prisma } from "@/lib/prisma";
import { getServerOrganization } from "@/lib/server-organization";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> },
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

    const { id, mediaId } = await params;

    const media = await prisma.facilityMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media || media.facilityId !== id) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const client = getS3Client();
    const bucket = getBucketName();

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: media.key }));
    await deleteFacilityMedia(mediaId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting facility media:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
