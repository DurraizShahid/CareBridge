import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerOrganization } from "@/lib/server-organization";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { id } = await params;
    const body = await req.json();

    const chat = await prisma.chat.findFirst({
      where: {
        id,
        userId,
        organizationId: org.organizationId,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatId: id,
        role: body.role,
        content: body.content,
      },
    });

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Auto-generate title from first user message
    if (body.role === "user" && chat.title === "New Chat") {
      const messageCount = await prisma.chatMessage.count({
        where: { chatId: id },
      });

      if (messageCount === 1) {
        const title = body.content.slice(0, 80) + (body.content.length > 80 ? "..." : "");
        await prisma.chat.update({
          where: { id },
          data: { title },
        });
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
