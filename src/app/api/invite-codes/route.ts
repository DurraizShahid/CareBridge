import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerOrganization } from '@/lib/server-organization';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const inviteCodes = await prisma.inviteCode.findMany({
      where: { organizationId: org.organizationId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: true },
    });

    return NextResponse.json(inviteCodes);
  } catch (error: unknown) {
    console.error('Error fetching invite codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { role, maxUses, expiresAt } = await req.json();

    // Generate random invite code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const inviteCode = await prisma.inviteCode.create({
      data: {
        id: crypto.randomUUID(),
        code,
        organizationId: org.organizationId,
        createdById: userId,
        role: role ? role.replace(/-/g, '_') : null,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(inviteCode);
  } catch (error: unknown) {
    console.error('Error creating invite code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
