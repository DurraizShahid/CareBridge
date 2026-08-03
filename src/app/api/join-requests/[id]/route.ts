import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { UserRole as UserRoleEnum } from '@/generated/prisma/enums';
import { consumeInviteCodeUse } from '@/lib/invite-codes';
import { prisma } from '@/lib/prisma';
import { prismaRoleToAppRole } from '@/lib/organization-role';
import { getAllowedRoles } from '@/lib/permissions';
import { authErrorResponse, HttpAuthError, requireOrgPermission } from '@/lib/server-auth';

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
      const role = joinRequest.inviteCode?.role || UserRoleEnum.customer;
      const appRole = prismaRoleToAppRole(role);
      const allowedRoles = getAllowedRoles(org.role, org.organizationType);

      if (appRole !== 'customer' && !allowedRoles.includes(appRole)) {
        return NextResponse.json({ error: 'Requested role is not allowed' }, { status: 403 });
      }

      await prisma.$transaction(
        async (tx) => {
          const pending = await tx.joinRequest.findFirst({
            where: org.isSuperadmin
              ? { id, status: 'pending' }
              : { id, organizationId: org.organizationId, status: 'pending' },
          });

          if (!pending) {
            throw new HttpAuthError(400, 'Join request already processed');
          }

          if (pending.inviteCodeId) {
            const consumed = await consumeInviteCodeUse(tx, pending.inviteCodeId);
            if (!consumed) {
              throw new HttpAuthError(400, 'Invite code is invalid or expired');
            }
          }

          await tx.user.update({
            where: { id: pending.userId },
            data: {
              organizationId: pending.organizationId,
              role,
            },
          });

          await tx.joinRequest.update({
            where: { id },
            data: {
              status: 'approved',
              reviewedById: userId,
              reviewedAt: new Date(),
              notes: notes || null,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      await (await clerkClient()).users.updateUserMetadata(joinRequest.userId, {
        publicMetadata: {
          organizationId: joinRequest.organizationId,
          organizationType: joinRequest.organization.type,
          role: appRole,
        },
      });
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
