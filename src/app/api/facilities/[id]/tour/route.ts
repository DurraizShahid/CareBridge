import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFacility, getFacilityById, updateFacilityTourConfig } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { validateTourConfig } from "@/lib/facility-tour";

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
    const facility =
      (await getFacility(id, org.organizationId, org.role)) ??
      (org.organizationType === "hospital" ? await getFacilityById(id) : null);
    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    return NextResponse.json(facility.tourConfig ?? null);
  } catch (error: unknown) {
    console.error("Error fetching facility tour config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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

    if (!roleHasPermission(org.role, "facilities:update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const facility = await getFacility(id, org.organizationId, org.role);
    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const body = await req.json();
    const configToValidate = body && typeof body === "object" && "tourConfig" in body ? body.tourConfig : body;
    const validation = validateTourConfig(configToValidate);
    if (!validation.valid || !validation.config) {
      return NextResponse.json(
        { error: validation.error ?? "Invalid tour configuration" },
        { status: 400 },
      );
    }

    const updated = await updateFacilityTourConfig(
      id,
      validation.config,
      org.organizationId,
      org.role,
    );

    if (!updated) {
      return NextResponse.json({ error: "Failed to update tour configuration" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating facility tour config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
