import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllowedRoles, normalizeRole } from '@/lib/permissions';
import { appRoleToPrismaRole } from '@/lib/organization-role';
import { authErrorResponse, requireOrgPermission } from '@/lib/server-auth';

function parseMaxUses(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 10000) {
    throw new Error('Max uses must be a whole number between 1 and 10000.');
  }
  return value;
}

function parseExpiresAt(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value !== 'string') throw new Error('Expiration date is invalid.');

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    throw new Error('Expiration date must be in the future.');
  }

  return date;
}

async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) return code;
  }

  throw new Error('Could not generate a unique invite code.');
}

export async function GET() {
  try {
    const { org } = await requireOrgPermission(['users:read-org', 'users:manage-roles'], 'any');

    const inviteCodes = await prisma.inviteCode.findMany({
      where: { organizationId: org.organizationId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: true },
    });

    return NextResponse.json(inviteCodes);
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error fetching invite codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, org } = await requireOrgPermission('users:create');

    const { role, maxUses, expiresAt } = await req.json();
    const selectedRole = role ? normalizeRole(role) : null;
    if (role && !selectedRole) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const allowedRoles = getAllowedRoles(org.role, org.organizationType);
    if (selectedRole && !allowedRoles.includes(selectedRole) && selectedRole !== 'customer') {
      return NextResponse.json({ error: 'Role is not allowed for this organization' }, { status: 403 });
    }

    const code = await generateUniqueInviteCode();

    const inviteCode = await prisma.inviteCode.create({
      data: {
        id: crypto.randomUUID(),
        code,
        organizationId: org.organizationId,
        createdById: userId,
        role: selectedRole ? appRoleToPrismaRole(selectedRole) : null,
        maxUses: parseMaxUses(maxUses),
        expiresAt: parseExpiresAt(expiresAt),
      },
    });

    return NextResponse.json(inviteCode);
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof Error && error.message !== 'Could not generate a unique invite code.') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error creating invite code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
