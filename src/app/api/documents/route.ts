import { NextResponse } from "next/server";
import {
  DataAccessError,
  getDocuments,
  createDocument,
  logDocumentAccess,
} from "@/lib/data-access";
import { requireOrgPermission, authErrorResponse } from "@/lib/server-auth";
import { getBucketName, getEndpoint } from "@/lib/storage";

function safeS3Bucket() {
  try { return getBucketName(); } catch { return "local"; }
}

function safeS3Endpoint() {
  try { return getEndpoint(); } catch { return ""; }
}
import type { DocumentCategory } from "@/types";

export async function GET(request: Request) {
  try {
    const { org } = await requireOrgPermission("documents:read");

    const { searchParams } = new URL(request.url);
    const params = {
      query: searchParams.get("q") ?? undefined,
      category: (searchParams.get("category") ?? undefined) as DocumentCategory | undefined,
      tags: searchParams.get("tags")?.split(",").filter(Boolean) ?? undefined,
      uploadedById: searchParams.get("uploadedById") ?? undefined,
      isArchived: searchParams.has("isArchived")
        ? searchParams.get("isArchived") === "true"
        : undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") as "asc" | "desc" | undefined,
    };

    const result = await getDocuments(org.organizationId, org.role, params);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { org } = await requireOrgPermission("documents:create");

    const body = await request.json();
    const { title, description, category, tags, fileName, fileType, fileSize, mimeType, storageKey, retentionDate, notes, expiresAt } = body;

    if (!title || !fileName || !fileType || !fileSize || !mimeType || !storageKey) {
      return NextResponse.json(
        { error: "Title, file name, file type, file size, MIME type, and storage key are required" },
        { status: 400 },
      );
    }

    const doc = await createDocument({
      title,
      description: description ?? undefined,
      category: category ?? "other",
      tags: tags ?? [],
      fileName,
      fileType,
      fileSize,
      mimeType,
      storageKey,
      storageBucket: safeS3Bucket(),
      storageEndpoint: safeS3Endpoint(),
      retentionDate: retentionDate ?? undefined,
      notes: notes ?? undefined,
      expiresAt: expiresAt ?? undefined,
      organizationId: org.organizationId,
      uploadedById: org.userId,
    });

    await logDocumentAccess({
      documentId: doc.id,
      userId: org.userId,
      action: "UPLOAD",
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}
