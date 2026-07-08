import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getFacility,
  getFacilityMedia,
  createFacilityMedia,
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
    const media = await getFacilityMedia(id);
    return NextResponse.json(media);
  } catch (error: any) {
    console.error("Error fetching facility media:", error);
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
    const facility = await getFacility(id, org.organizationId, org.role);
    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const body = await req.json();
    const media = await createFacilityMedia({
      facilityId: id,
      type: body.type,
      key: body.key,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      width: body.width,
      height: body.height,
      displayOrder: body.displayOrder ?? 0,
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error: any) {
    console.error("Error creating facility media:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
