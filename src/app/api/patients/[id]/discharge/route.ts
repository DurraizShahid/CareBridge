import { NextResponse } from "next/server";
import { DataAccessError, dischargePatient } from "@/lib/data-access";
import { authErrorResponse, HttpAuthError, requireOrgPermission } from "@/lib/server-auth";
import { AuthorizationError } from "@/lib/server-organization";

/**
 * POST /api/patients/[id]/discharge
 *
 * Closes the patient's confirmed placement, marks them discharged, frees the
 * facility bed, and records a discharge activity event, all in one transaction.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, org } = await requireOrgPermission(["patients:update", "placements:update"]);
    const { id } = await params;
    const result = await dischargePatient(id, org.organizationId, org.role, userId);
    return NextResponse.json({ ...result, status: "discharged" });
  } catch (error: unknown) {
    if (error instanceof HttpAuthError || error instanceof AuthorizationError) {
      return authErrorResponse(error);
    }
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error discharging patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
