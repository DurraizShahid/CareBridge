// ─── Server-Side Organization Resolver ───
// Used in server components and Server Actions to get the current
// user's organization context from the Clerk session.

import { auth } from "@clerk/nextjs/server";
import { resolveRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

export type OrgType = "hospital" | "facility";

/**
 * Derive the organization type from the user's role.
 */
function orgTypeFromRole(role: UserRole): OrgType {
  if (role === "facility-coordinator") return "facility";
  return "hospital"; // social-worker, discharge-planner, administrator, superadmin, customer
}

export class AuthorizationError extends Error {
  status: number;
  statusCode: number;

  constructor(message = "Active organization membership required") {
    super(message);
    this.name = "AuthorizationError";
    this.status = 403;
    this.statusCode = 403;
  }
}

export interface ServerOrganization {
  organizationId: string;
  organizationType: OrgType;
  role: UserRole;
  isSuperadmin: boolean;
  userId: string;
}

/**
 * Resolve the organization context for the currently authenticated user.
 *
 * Fails closed: if the database cannot verify an active user record with
 * an active organization membership, throws an AuthorizationError.
 * Clerk identity proves authentication only.
 *
 * Should be called from server components and server actions.
 */
export async function getServerOrganization(): Promise<ServerOrganization | null> {
  const sessionAuth = await auth();
  if (!sessionAuth.userId) return null;

  let dbUser;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: sessionAuth.userId },
      include: { organization: true },
    });
  } catch (err) {
    throw new AuthorizationError(
      err instanceof Error ? err.message : "Database error verifying organization membership"
    );
  }

  if (
    !dbUser ||
    !dbUser.organizationId ||
    !dbUser.organization ||
    dbUser.organization.isActive === false ||
    Boolean(dbUser.organization.deletedAt)
  ) {
    throw new AuthorizationError("Active organization membership required");
  }

  const role = resolveRole(dbUser.role);
  const organizationType: OrgType =
    dbUser.organization.type === "facility" || dbUser.organization.type === "hospital"
      ? dbUser.organization.type
      : orgTypeFromRole(role);

  return {
    userId: sessionAuth.userId,
    organizationId: dbUser.organizationId,
    organizationType,
    role,
    isSuperadmin: role === "superadmin",
  };
}
