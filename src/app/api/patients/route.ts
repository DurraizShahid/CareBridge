import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getPatients, createPatient } from "@/lib/data-access";
import { AuthorizationError, getServerOrganization } from "@/lib/server-organization";
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
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
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

    const rawName =
      typeof body.name === "string"
        ? body.name
        : typeof body.firstName === "string" || typeof body.lastName === "string"
        ? `${body.firstName ?? ""} ${body.lastName ?? ""}`
        : "";
    if (!rawName.trim()) {
      return NextResponse.json(
        { error: "Patient name cannot be empty" },
        { status: 400 },
      );
    }

    const dobValue = body.dateOfBirth ?? body.birthDate;
    if (dobValue) {
      const dob = new Date(dobValue);
      if (!isNaN(dob.getTime()) && dob.getTime() > Date.now()) {
        return NextResponse.json(
          { error: "Birth date cannot be in the future" },
          { status: 400 },
        );
      }
    }

    const admissionVal = body.admissionDate;
    const dischargeVal = body.dischargeDate ?? body.estimatedDischargeDate;
    if (admissionVal && dischargeVal) {
      const admission = new Date(admissionVal);
      const discharge = new Date(dischargeVal);
      if (
        !isNaN(admission.getTime()) &&
        !isNaN(discharge.getTime()) &&
        discharge.getTime() < admission.getTime()
      ) {
        return NextResponse.json(
          { error: "Discharge date cannot be before admission date" },
          { status: 400 },
        );
      }
    }

    const patient = await createPatient({ ...body, organizationId: org.organizationId });
    return NextResponse.json(patient, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
