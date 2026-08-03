import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireOrgPermission } from '@/lib/server-auth';

function inviteCodeUnavailable(inviteCode: {
  isActive: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
}) {
  return !inviteCode.isActive
    || (!!inviteCode.expiresAt && new Date() > inviteCode.expiresAt)
    || (!!inviteCode.maxUses && inviteCode.usedCount >= inviteCode.maxUses);
}

export async function GET() {
  try {
    const { org } = await requireOrgPermission(['users:read-org', 'users:manage-roles'], 'any');

    const joinRequests = await prisma.joinRequest.findMany({
      where: { organizationId: org.organizationId },
      include: { user: true, inviteCode: true, reviewedBy: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(joinRequests);
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, inviteCodeId } = await req.json();
    if (!organizationId || !inviteCodeId) {
      return NextResponse.json({ error: 'A valid invite code is required' }, { status: 400 });
    }

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { id: inviteCodeId },
    });

    if (!inviteCode || inviteCode.organizationId !== organizationId || inviteCodeUnavailable(inviteCode)) {
      return NextResponse.json({ error: 'Invite code is invalid or expired' }, { status: 400 });
    }

    // One pending request at a time; denied/approved history does not block re-apply
    const existingPending = await prisma.joinRequest.findFirst({
      where: { userId, status: 'pending' },
    });

    if (existingPending) {
      return NextResponse.json({ error: 'You already have a pending join request' }, { status: 400 });
    }

    // usedCount is incremented only on successful approval, not on submit
    const joinRequest = await prisma.joinRequest.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        organizationId,
        inviteCodeId,
        requestedRole: inviteCode.role,
      },
    });

    return NextResponse.json(joinRequest);
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
