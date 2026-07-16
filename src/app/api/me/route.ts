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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
    }

    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({ where: { id: authObj.userId } });
    } catch {
      // DB may not be available
    }

    const role = resolveRole(dbUser?.role, clerkUser?.publicMetadata?.role);

    return NextResponse.json({
      id: authObj.userId,
      role,
      organizationId: dbUser?.organizationId ?? null,
      firstName: dbUser?.firstName ?? clerkUser?.firstName ?? "",
      lastName: dbUser?.lastName ?? clerkUser?.lastName ?? "",
      email: dbUser?.email ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? "",
      imageUrl: clerkUser?.imageUrl ?? null,
    });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
