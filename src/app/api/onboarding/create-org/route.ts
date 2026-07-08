import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole as UserRoleEnum } from "@/generated/prisma/enums";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, type } = await req.json();
    if (!name || !slug || !type) {
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
        type: (type === "hospital" ? "hospital" : "facility") as any,
      },
    });

    // Update the user's organization and set role to administrator
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "unknown@email.com";

    await prisma.user.upsert({
      where: { id: userId },
      update: {
        organizationId: org.id,
        role: UserRoleEnum.administrator,
      },
      create: {
        id: userId,
        email,
        firstName: clerkUser?.firstName ?? "",
        lastName: clerkUser?.lastName ?? "",
        role: UserRoleEnum.administrator,
        title: "",
        department: "",
        hospitalId: "",
        phone: "",
        avatarUrl: clerkUser?.imageUrl ?? null,
        organizationId: org.id,
      },
    });

    return NextResponse.json({ success: true, organization: org });
  } catch (error: any) {
    console.error("Error creating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
