import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DataAccessError, getPlacements, createPlacement } from "@/lib/data-access";
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

    const placements = await getPlacements(org.organizationId, org.role);
    return NextResponse.json(placements);
  } catch (error: unknown) {
    console.error("Error fetching placements:", error);
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

    if (!roleHasPermission(org.role, "placements:create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const placement = await createPlacement({ ...body, organizationId: org.organizationId });
    return NextResponse.json(placement, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof DataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error creating placement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
