import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthenticatedUser } from "@/lib/server-auth";
import {
  getHighestRoleForOrganizationType,
  normalizeOrganizationType,
  prismaRoleToAppRole,
} from "@/lib/organization-role";

export async function POST(req: Request) {
  try {
    // Exemption: users creating an organization do not belong to one yet,
    // so we only verify the Clerk session is valid rather than requiring an existing org membership.
    const userId = await requireAuthenticatedUser();

    const { name, slug, type } = await req.json();
    const organizationType = normalizeOrganizationType(type);
    if (!name || !slug || !organizationType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if slug is already taken
    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      return NextResponse.json({ error: "Organization slug already taken" }, { status: 400 });
    }

    // Create the organization
    const org = await prisma.organization.create({
      data: {
        id: crypto.randomUUID(),
        name,
        slug,
        type: organizationType,
      },
    });

    const ownerRole = getHighestRoleForOrganizationType(organizationType);

    // Update the user's organization and assign the top role for the selected org type.
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "unknown@email.com";

    await prisma.user.upsert({
      where: { id: userId },
      update: {
        organizationId: org.id,
        role: ownerRole,
      },
      create: {
        id: userId,
        email,
        firstName: clerkUser?.firstName ?? "",
        lastName: clerkUser?.lastName ?? "",
        role: ownerRole,
        title: "",
        department: "",
        hospitalId: "",
        phone: "",
        avatarUrl: clerkUser?.imageUrl ?? null,
        organizationId: org.id,
      },
    });

    await (await clerkClient()).users.updateUserMetadata(userId, {
      publicMetadata: {
        organizationId: org.id,
        organizationType,
        role: prismaRoleToAppRole(ownerRole),
      },
    });

    return NextResponse.json({ success: true, organization: org });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
