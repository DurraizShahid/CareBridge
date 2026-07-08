import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client, getBucketName } from "@/lib/storage";
import { DataAccessError, deletePatientDocument } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
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
    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }
    if (!roleHasPermission(org.role, "patients:update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const doc = await prisma.patientDocument.findFirst({
      where: {
        id: documentId,
        patientId: id,
        patient: org.isSuperadmin ? undefined : { organizationId: org.organizationId },
      },
    });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const client = getS3Client();
    const bucket = getBucketName();

    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: doc.key }),
    );
    await deletePatientDocument(documentId, id, org.organizationId, org.role);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error deleting patient document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
