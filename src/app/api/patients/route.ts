import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getPatients, createPatient } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const patients = await getPatients(org.organizationId, org.role);
    return NextResponse.json(patients);
  } catch (error: any) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    if (!roleHasPermission(org.role, "patients:create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const patient = await createPatient({ ...body, organizationId: org.organizationId });
    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
