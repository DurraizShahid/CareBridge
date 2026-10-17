import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveRole } from "@/lib/permissions";
import {
  authErrorResponse,
  HttpAuthError,
  requireOrgPermission,
} from "@/lib/server-auth";
import { seed } from "../../../../../prisma/seed";
import { seedAmple } from "../../../../../prisma/seed-ample";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Verifies that the current request is from an administrator.
 *
 * Uses the existing auth helpers (`requireOrgPermission`).
 * When seeding a fresh production database where no local user or organization
 * record exists yet, falls back to inspecting the authenticated Clerk user's role.
 */
async function requireAdminRole(): Promise<void> {
  try {
    const { org } = await requireOrgPermission("dashboard:admin");
    if (org.role !== "superadmin" && org.role !== "administrator") {
      throw new HttpAuthError(403, "Forbidden");
    }
  } catch (error) {
    if (error instanceof HttpAuthError && error.status === 401) {
      throw error;
    }

    // Fallback: If DB organization lookup fails (e.g. before initial production seed),
    // verify the authenticated Clerk user's metadata role.
    const user = await currentUser();
    if (!user) {
      throw error instanceof HttpAuthError
        ? error
        : new HttpAuthError(401, "Unauthorized");
    }

    const role = resolveRole(user.publicMetadata?.role);
    if (role !== "superadmin" && role !== "administrator") {
      throw new HttpAuthError(403, "Forbidden");
    }
  }
}

/**
 * POST /api/admin/seed
 *
 * Protected admin seed endpoint for populating production database.
 * Executes both base and ample seed suites idempotently via upserts.
 */
export async function POST() {
  try {
    await requireAdminRole();

    // Deterministic, idempotent seed suites
    await seed(prisma);
    await seedAmple(prisma);

    // Query record counts after seeding
    const [
      organizations,
      hospitals,
      users,
      facilities,
      facilityMedia,
      patients,
      placements,
      referrals,
      contracts,
      signatures,
      payments,
      bedReservations,
      documents,
      documentVersions,
      documentAccessLogs,
      activityEvents,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.hospital.count(),
      prisma.user.count(),
      prisma.facility.count(),
      prisma.facilityMedia.count(),
      prisma.patient.count(),
      prisma.placement.count(),
      prisma.referral.count(),
      prisma.contract.count(),
      prisma.contractSignature.count(),
      prisma.payment.count(),
      prisma.bedReservation.count(),
      prisma.document.count(),
      prisma.documentVersion.count(),
      prisma.documentAccessLog.count(),
      prisma.activityEvent.count(),
    ]);

    const counts = {
      organizations,
      hospitals,
      users,
      facilities,
      facilityMedia,
      patients,
      placements,
      referrals,
      contracts,
      signatures,
      payments,
      bedReservations,
      documents,
      documentVersions,
      documentAccessLogs,
      activityEvents,
    };

    const totalRecords = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0,
    );

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts,
      totalRecords,
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
