import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code },
      include: { organization: true },
    });

    if (!inviteCode) {
      return NextResponse.json({ valid: false, reason: 'Invalid invite code' });
    }

    if (!inviteCode.isActive) {
      return NextResponse.json({ valid: false, reason: 'Invite code is inactive' });
    }

    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      return NextResponse.json({ valid: false, reason: 'Invite code has expired' });
    }

    if (inviteCode.maxUses && inviteCode.usedCount >= inviteCode.maxUses) {
      return NextResponse.json({ valid: false, reason: 'Invite code has reached max uses' });
    }

    return NextResponse.json({
      valid: true,
      inviteCode: {
        id: inviteCode.id,
        code: inviteCode.code,
      },
      organization: {
        id: inviteCode.organization.id,
        name: inviteCode.organization.name,
        slug: inviteCode.organization.slug,
        type: inviteCode.organization.type,
      },
    });
  } catch (error: unknown) {
    console.error('Error validating invite code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
