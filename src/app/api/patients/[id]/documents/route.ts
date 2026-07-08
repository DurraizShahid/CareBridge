import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  DataAccessError,
  getPatientDocuments,
  createPatientDocument,
} from "@/lib/data-access";
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
    if (!roleHasPermission(org.role, "patients:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const docs = await getPatientDocuments(id, org.organizationId, org.role);
    return NextResponse.json(docs);
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching patient documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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
    if (!body.name || !body.key || !body.url) {
      return NextResponse.json({ error: "Document name, key, and URL are required" }, { status: 400 });
    }

    const doc = await createPatientDocument({
      patientId: id,
      name: body.name,
      key: body.key,
      url: body.url,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      category: body.category ?? "other",
      uploadedById: userId,
    }, org.organizationId, org.role);

    return NextResponse.json(doc, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error creating patient document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
