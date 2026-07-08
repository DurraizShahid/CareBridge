// ─── Server-Side Organization Resolver ───
// Used in server components and Server Actions to get the current
// user's organization context from the Clerk session.

import { auth, currentUser } from "@clerk/nextjs/server";
import { resolveRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type OrgType = "hospital" | "facility";

/**
 * Derive the organization type from the user's role.
 */
function orgTypeFromRole(role: string): OrgType {
  if (role === "facility-coordinator") return "facility";
  return "hospital"; // social-worker, discharge-planner, administrator, superadmin, customer
}

export interface ServerOrganization {
  organizationId: string;
  organizationType: OrgType;
  role: string;
  isSuperadmin: boolean;
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
  let role = "";

  // Check DB
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionAuth.userId },
    });
    if (dbUser) {
      organizationId = dbUser.organizationId;
      role = dbUser.role;
    }
  } catch {
    // DB may not be available
  }

  // Fallback to Clerk metadata
  if (!organizationId && clerkUser?.publicMetadata?.organizationId) {
    organizationId = clerkUser.publicMetadata.organizationId as string;
  }

  // Resolve role
  if (!role) {
    role = resolveRole(clerkUser?.publicMetadata?.role, null);
  }

  // Derive org type from role
  let organizationType: OrgType = orgTypeFromRole(role);

  // Override from Clerk metadata if available
  if (clerkUser?.publicMetadata?.organizationType) {
    const metaType = String(clerkUser.publicMetadata.organizationType).toLowerCase();
    if (metaType === "hospital" || metaType === "facility") {
      organizationType = metaType;
    }
  }

  // Final fallback for development
  if (!organizationId) {
    organizationId = "org-001";
  }

  return {
    organizationId,
    organizationType,
    role,
    isSuperadmin: role === "superadmin",
  };
}
