import { NextResponse } from "next/server";
import {
  DataAccessError,
  getDocumentAccessLogs,
} from "@/lib/data-access";
import { requireOrgPermission, authErrorResponse } from "@/lib/server-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { org } = await requireOrgPermission("documents:audit");

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined;

    const logs = await getDocumentAccessLogs(id, org.organizationId, org.role, { page, pageSize });
    return NextResponse.json(logs);
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}
