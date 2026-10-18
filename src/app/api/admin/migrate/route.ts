import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { resolveRole } from "@/lib/permissions";
import {
  authErrorResponse,
  HttpAuthError,
  requireOrgPermission,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MIGRATION_NAME = "20261018000000_add_chat_facility_recommendation";

/**
 * Verifies that the current request is from an administrator.
 *
 * Uses the existing auth helpers (`requireOrgPermission`).
 * When running migrations on a production database where no local user or organization
 * record exists yet, falls back to inspecting the authenticated Clerk user's role.
 */
async function requireAdminRole(): Promise<string> {
  try {
    const { org, userId } = await requireOrgPermission("dashboard:admin");
    if (org.role !== "superadmin" && org.role !== "administrator") {
      throw new HttpAuthError(403, "Forbidden");
    }
    return userId;
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

    return user.id;
  }
}

/**
 * GET /api/admin/migrate
 * POST /api/admin/migrate
 *
 * Protected admin migration endpoint for applying pending Prisma migrations in production.
 * Applies the migration directly using the Prisma client and records it in _prisma_migrations.
 * GET is safe because migration application is idempotent (skips if already recorded).
 */
export async function POST() {
  let userId: string;
  try {
    userId = await requireAdminRole();
  } catch (error: unknown) {
    return authErrorResponse(error);
  }

  console.log(`[Admin Migration] Attempt initiated by admin user: ${userId}`);

  const migrationFilePath = path.join(
    process.cwd(),
    "prisma/migrations/20261018000000_add_chat_facility_recommendation/migration.sql",
  );

  try {
    const migrationSql = fs.readFileSync(migrationFilePath, "utf8");
    const checksum = crypto
      .createHash("sha256")
      .update(migrationSql)
      .digest("hex");

    const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM _prisma_migrations WHERE migration_name = $1 LIMIT 1`,
      MIGRATION_NAME,
    );

    if (existing.length > 0) {
      console.log(
        `[Admin Migration] Migration ${MIGRATION_NAME} is already applied.`,
      );
      return NextResponse.json({
        success: true,
        message: `Migration ${MIGRATION_NAME} is already applied.`,
        details: {
          migrationName: MIGRATION_NAME,
          alreadyApplied: true,
        },
      });
    }

    console.log(
      `[Admin Migration] Executing migration SQL for ${MIGRATION_NAME}...`,
    );
    await prisma.$executeRawUnsafe(migrationSql);

    console.log(
      `[Admin Migration] Recording ${MIGRATION_NAME} in _prisma_migrations...`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, $1, NOW(), $2, NULL, NULL, NOW(), 1)`,
      checksum,
      MIGRATION_NAME,
    );

    console.log(
      `[Admin Migration] Migration ${MIGRATION_NAME} applied successfully for user ${userId}.`,
    );

    return NextResponse.json({
      success: true,
      message: `Migration ${MIGRATION_NAME} applied successfully.`,
      details: {
        migrationName: MIGRATION_NAME,
        checksum,
        applied: true,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Admin Migration] Failed for user ${userId}:`, error);

    return NextResponse.json(
      {
        success: false,
        message: "Migration failed.",
        details: message,
      },
      { status: 500 },
    );
  }
}

export const GET = POST;
