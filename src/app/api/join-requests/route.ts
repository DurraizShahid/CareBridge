import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerOrganization } from '@/lib/server-organization';
import { UserRole as UserRoleEnum } from '@/generated/prisma/enums';

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

    const joinRequests = await prisma.joinRequest.findMany({
      where: { organizationId: org.organizationId },
      include: { user: true, inviteCode: true, reviewedBy: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(joinRequests);
  } catch (error: any) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, inviteCodeId } = await req.json();
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.joinRequest.findFirst({
      where: { userId, status: 'pending' },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have a pending join request' }, { status: 400 });
    }

    const joinRequest = await prisma.joinRequest.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        organizationId,
        inviteCodeId: inviteCodeId || null,
      },
    });

    return NextResponse.json(joinRequest);
  } catch (error: any) {
    console.error('Error creating join request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
