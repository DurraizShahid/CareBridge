import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole as UserRoleEnum } from '@/generated/prisma/enums';
import { prismaRoleToAppRole } from '@/lib/organization-role';
import { getAllowedRoles } from '@/lib/permissions';
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, org } = await requireOrgPermission('users:create');

    const { id } = await params;
    const { action, notes } = await req.json();

    const joinRequest = await prisma.joinRequest.findFirst({
      where: org.isSuperadmin ? { id } : { id, organizationId: org.organizationId },
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
      const appRole = prismaRoleToAppRole(role);
      const allowedRoles = getAllowedRoles(org.role, org.organizationType);

      if (appRole !== 'customer' && !allowedRoles.includes(appRole)) {
        return NextResponse.json({ error: 'Requested role is not allowed' }, { status: 403 });
      }

      if (joinRequest.inviteCode && inviteCodeUnavailable(joinRequest.inviteCode)) {
        return NextResponse.json({ error: 'Invite code is invalid or expired' }, { status: 400 });
      }
      
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
          role: appRole,
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
    return authErrorResponse(error);
  }
}
