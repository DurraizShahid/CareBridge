import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  DataAccessError,
  getDocument,
  logDocumentAccess,
} from "@/lib/data-access";
import { requireOrgPermission, authErrorResponse } from "@/lib/server-auth";
import { getS3Client, getBucketName } from "@/lib/storage";

const EXPIRES_IN = 900;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { org } = await requireOrgPermission("documents:read");

    const { id } = await params;
    const doc = await getDocument(id, org.organizationId, org.role);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const client = getS3Client();
    const bucket = getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: doc.storageKey,
    });

    const downloadUrl = await getSignedUrl(client, command, { expiresIn: EXPIRES_IN });

    await logDocumentAccess({
      documentId: id,
      userId: org.userId,
      action: "DOWNLOAD",
    });

    return NextResponse.json({
      downloadUrl,
      expiresIn: EXPIRES_IN,
      fileName: doc.fileName,
    });
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}
