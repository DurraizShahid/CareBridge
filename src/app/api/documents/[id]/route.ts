import { NextResponse } from "next/server";
import {
  DataAccessError,
  getDocument,
  updateDocument,
  deleteDocument,
  logDocumentAccess,
} from "@/lib/data-access";
import { requireOrgPermission, authErrorResponse } from "@/lib/server-auth";

export async function GET(
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

    await logDocumentAccess({
      documentId: id,
      userId: org.userId,
      action: "VIEW",
    });

    return NextResponse.json(doc);
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { org } = await requireOrgPermission("documents:update");

    const { id } = await params;
    const body = await request.json();
    const { title, description, category, tags, notes, retentionDate, expiresAt, isArchived, isOnLegalHold } = body;

    const doc = await updateDocument(
      id,
      {
        title,
        description,
        category,
        tags,
        notes,
        retentionDate,
        expiresAt,
        isArchived,
        isOnLegalHold,
      },
      org.organizationId,
      org.role,
    );

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await logDocumentAccess({
      documentId: id,
      userId: org.userId,
      action: "UPDATE",
    });

    return NextResponse.json(doc);
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { org } = await requireOrgPermission("documents:delete");

    const { id } = await params;
    const result = await deleteDocument(id, org.organizationId, org.role);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}
