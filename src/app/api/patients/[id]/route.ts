import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getPatient, updatePatient, deletePatient } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
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

    const { id } = await params;
    const patient = await getPatient(id, org.organizationId, org.role);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("Error fetching patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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

    if (!roleHasPermission(org.role, "patients:update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const patient = await updatePatient(id, body, org.organizationId, org.role);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("Error updating patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
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

    if (!roleHasPermission(org.role, "patients:delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const result = await deletePatient(id, org.organizationId, org.role);
    if (!result.success) {
      const status = result.error?.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
