// ─── Server-Side Organization Resolver ───
// Used in server components and Server Actions to get the current
// user's organization context from the Clerk session.

import { auth, currentUser } from "@clerk/nextjs/server";
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

export interface ServerOrganization {
  organizationId: string;
  organizationType: OrgType;
  role: UserRole;
  isSuperadmin: boolean;
  userId: string;
}

/**
 * Resolve the organization context for the currently authenticated user.
 * Falls back to mock data in development.
 *
 * Should be called from server components and server actions.
 */
export async function getServerOrganization(): Promise<ServerOrganization | null> {
  const sessionAuth = await auth();
  if (!sessionAuth.userId) return null;

  const clerkUser = await currentUser();

  // Try DB first, then Clerk metadata, then mock fallback
  let organizationId = "";
  let roleCandidate: unknown = "";

  // Check DB
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionAuth.userId },
    });
    if (dbUser) {
      organizationId = dbUser.organizationId ?? "";
      roleCandidate = dbUser.role;
    }
  } catch {
    // DB may not be available
  }

  // Fallback to Clerk metadata
  if (!organizationId && clerkUser?.publicMetadata?.organizationId) {
    organizationId = clerkUser.publicMetadata.organizationId as string;
  }

  const role = resolveRole(roleCandidate, clerkUser?.publicMetadata?.role, null);

  // Derive org type from role
  let organizationType: OrgType = orgTypeFromRole(role);

  // Override from Clerk metadata if available
  if (clerkUser?.publicMetadata?.organizationType) {
    const metaType = String(clerkUser.publicMetadata.organizationType).toLowerCase();
    if (metaType === "hospital" || metaType === "facility") {
      organizationType = metaType;
    }
  }

  if (!organizationId) return null;

  return {
    userId: sessionAuth.userId,
    organizationId,
    organizationType,
    role,
    isSuperadmin: role === "superadmin",
  };
}
