import { NextResponse } from "next/server";
import {
  DataAccessError,
  getDocumentStats,
} from "@/lib/data-access";
import { requireOrgPermission, authErrorResponse } from "@/lib/server-auth";

export async function GET() {
  try {
    const { org } = await requireOrgPermission("documents:read");

    const stats = await getDocumentStats(org.organizationId, org.role);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return authErrorResponse(error);
  }
}
