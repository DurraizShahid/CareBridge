import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client, getBucketName } from "@/lib/storage";
import { deletePatientDocument } from "@/lib/data-access";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, documentId } = await params;

    const doc = await prisma.patientDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc || doc.patientId !== id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const client = getS3Client();
    const bucket = getBucketName();

    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: doc.key }),
    );
    await deletePatientDocument(documentId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting patient document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
