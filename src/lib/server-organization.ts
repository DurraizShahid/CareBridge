// ─── Server-Side Organization Resolver ───
// Used in server components and Server Actions to get the current
// user's organization context from the local database.

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveRole } from "@/lib/permissions";
import type { UserRole } from "@/types";
import { prismaRoleToAppRole } from "@/lib/organization-role";

export type OrgType = "hospital" | "facility";

export interface ServerOrganization {
  organizationId: string;
  organizationType: OrgType;
  role: UserRole;
  isSuperadmin: boolean;
  userId: string;
}

export async function getServerOrganization(): Promise<ServerOrganization | null> {
  const sessionAuth = await auth();
  if (!sessionAuth.userId) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionAuth.userId },
  });

  if (!dbUser || !dbUser.organizationId) return null;

  const role = resolveRole(dbUser.role);
  if (!role) return null;

  return {
    userId: sessionAuth.userId,
    organizationId: dbUser.organizationId,
    organizationType: role === "facility-coordinator" ? "facility" : "hospital",
    role,
    isSuperadmin: role === "superadmin",
  };
}
