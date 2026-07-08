import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole as UserRoleEnum } from '@/generated/prisma/enums';
import { prismaRoleToAppRole } from '@/lib/organization-role';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action, notes } = await req.json();

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id },
      include: { inviteCode: true, organization: true },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Join request already processed' }, { status: 400 });
    }

    if (action === 'approve') {
      // Update user's organization and role
      const role = joinRequest.inviteCode?.role || UserRoleEnum.customer;
      
      await prisma.user.update({
        where: { id: joinRequest.userId },
        data: {
          organizationId: joinRequest.organizationId,
          role,
        },
      });

      await (await clerkClient()).users.updateUserMetadata(joinRequest.userId, {
        publicMetadata: {
          organizationId: joinRequest.organizationId,
          organizationType: joinRequest.organization.type,
          role: prismaRoleToAppRole(role),
        },
      });

      // Update join request
      await prisma.joinRequest.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedById: userId,
          reviewedAt: new Date(),
          notes: notes || null,
        },
      });

      // Increment invite code used count
      if (joinRequest.inviteCodeId) {
        await prisma.inviteCode.update({
          where: { id: joinRequest.inviteCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }
    } else if (action === 'deny') {
      await prisma.joinRequest.update({
        where: { id },
        data: {
          status: 'denied',
          reviewedById: userId,
          reviewedAt: new Date(),
          notes: notes || null,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error processing join request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
