import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRole } from "@/lib/permissions";

/**
 * GET /api/me
 *
 * Returns the current authenticated user's profile including their role.
 * Used by the sidebar to display the user's role badge.
 *
 * Falls back gracefully when Clerk is not configured in dev.
 */
export async function GET() {
  try {
    const authObj = await auth();
    if (!authObj.userId) {
      // Not authenticated — return empty in dev
      return NextResponse.json(null);
    }

    // Try to get from Clerk's API first (includes publicMetadata)
    const clerkUser = await currentUser();

    // Optionally hydrate from local DB for additional profile info
    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({ where: { id: authObj.userId } });
    } catch {
      // DB may not be available
    }

    const role = resolveRole(clerkUser?.publicMetadata?.role, dbUser?.role);

    return NextResponse.json({
    id: authObj.userId,
    role,
    organizationId: dbUser?.organizationId ?? null,
    firstName: dbUser?.firstName ?? clerkUser?.firstName ?? "",
    lastName: dbUser?.lastName ?? clerkUser?.lastName ?? "",
    email: dbUser?.email ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? "",
    imageUrl: clerkUser?.imageUrl ?? null,
  });
  } catch {
    // If Clerk is not configured, return null
    return NextResponse.json(null);
  }
}
