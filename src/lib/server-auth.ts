import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServerOrganization } from "@/lib/server-organization";
import {
  roleHasAnyPermission,
  roleHasPermission,
} from "@/lib/permissions";
import type { Permission } from "@/types/permissions";

export class HttpAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpAuthError";
    this.status = status;
  }
}

export async function requireAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new HttpAuthError(401, "Unauthorized");
  }
  return userId;
}

export async function requireOrgPermission(
  permission: Permission | Permission[],
  mode: "all" | "any" = "all",
) {
  const userId = await requireAuthenticatedUser();
  const org = await getServerOrganization();

  if (!org) {
    throw new HttpAuthError(400, "No organization context");
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const allowed = mode === "any"
    ? roleHasAnyPermission(org.role, permissions)
    : permissions.every((p) => roleHasPermission(org.role, p));

  if (!allowed) {
    throw new HttpAuthError(403, "Forbidden");
  }

  return { userId, org };
}

export function authErrorResponse(error: unknown) {
  if (error instanceof HttpAuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  return null;
}
