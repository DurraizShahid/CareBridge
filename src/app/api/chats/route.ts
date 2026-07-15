import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerOrganization } from "@/lib/server-organization";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId,
        organizationId: org.organizationId,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json(chats);
  } catch (error: unknown) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body = await req.json();
    const title = body.title || "New Chat";

    const chat = await prisma.chat.create({
      data: {
        title,
        userId,
        organizationId: org.organizationId,
      },
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
