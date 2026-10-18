import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { resolveRole } from "@/lib/permissions";
import {
  authErrorResponse,
  HttpAuthError,
  requireOrgPermission,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const execFileAsync = promisify(execFile);

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
 * Executes `prisma migrate deploy` using `npx` with a 120s timeout.
 * GET is safe because prisma migrate deploy is idempotent.
 */
export async function POST() {
  let userId: string;
  try {
    userId = await requireAdminRole();
  } catch (error: unknown) {
    return authErrorResponse(error);
  }

  console.log(`[Admin Migration] Attempt initiated by admin user: ${userId}`);

  try {
    const { stdout, stderr } = await execFileAsync(
      "npx",
      ["prisma", "migrate", "deploy"],
      {
        timeout: 120_000,
        shell: process.platform === "win32",
      },
    );

    console.log(`[Admin Migration] Succeeded for user ${userId}. Output:\n${stdout}`);

    return NextResponse.json({
      success: true,
      stdout: String(stdout),
      stderr: String(stderr),
    });
  } catch (execError: unknown) {
    const err = execError as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message?: string;
    };
    const stdout =
      typeof err?.stdout === "string"
        ? err.stdout
        : err?.stdout?.toString("utf8") ?? "";
    const stderr =
      typeof err?.stderr === "string"
        ? err.stderr
        : err?.stderr?.toString("utf8") ?? (err?.message ?? String(execError));

    console.error(`[Admin Migration] Failed for user ${userId}:`, stderr);

    return NextResponse.json(
      {
        success: false,
        stdout,
        stderr,
      },
      { status: 500 },
    );
  }
}

export const GET = POST;
