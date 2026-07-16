import { NextResponse } from "next/server";
import {
  DataAccessError,
  getDocumentVersions,
} from "@/lib/data-access";
import { requireOrgPermission, authErrorResponse } from "@/lib/server-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { org } = await requireOrgPermission("documents:read");

    const { id } = await params;
    const versions = await getDocumentVersions(id, org.organizationId, org.role);
    return NextResponse.json(versions);
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}
