import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFacilities, createFacility } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import type { FacilityType, CareLevel } from "@/types";

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

    const facilities = await getFacilities(org.organizationId, org.role);
    return NextResponse.json(facilities);
  } catch (error: any) {
    console.error("Error fetching facilities:", error);
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

    if (!roleHasPermission(org.role, "facilities:create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const facility = await createFacility({
      name: body.name,
      type: body.type as FacilityType,
      address: body.address,
      phone: body.phone,
      email: body.email,
      website: body.website,
      contacts: body.contacts ?? [],
      licensure: body.licensure ?? [],
      accreditations: body.accreditations ?? [],
      capacity: body.capacity,
      currentOccupancy: body.currentOccupancy ?? 0,
      insuranceAccepted: body.insuranceAccepted ?? [],
      careLevelsOffered: (body.careLevelsOffered ?? []) as CareLevel[],
      specialties: body.specialties ?? [],
      rating: body.rating ?? 0,
      reviewsCount: body.reviewsCount ?? 0,
      hasAvailability: body.hasAvailability ?? true,
      waitlistDays: body.waitlistDays,
      acceptsMedicare: body.acceptsMedicare ?? true,
      acceptsMedicaid: body.acceptsMedicaid ?? false,
      organizationId: org.organizationId,
    });

    return NextResponse.json(facility, { status: 201 });
  } catch (error: any) {
    console.error("Error creating facility:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
