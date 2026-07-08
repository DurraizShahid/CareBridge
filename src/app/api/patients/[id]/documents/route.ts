import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getPatientDocuments,
  createPatientDocument,
} from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const docs = await getPatientDocuments(id);
    return NextResponse.json(docs);
  } catch (error: any) {
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

    const { id } = await params;
    const body = await req.json();

    const doc = await createPatientDocument({
      patientId: id,
      name: body.name,
      key: body.key,
      url: body.url,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      category: body.category ?? "other",
      uploadedById: userId,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error("Error creating patient document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
