import type { Prisma } from "@/generated/prisma/client";

/**
 * Atomically consume one use of an invite code inside an existing
 * transaction. Returns true when the use was granted (the code is active,
 * not expired, and under its maxUses), false otherwise.
 *
 * Must be called from within a transaction (e.g. the join-request approval
 * flow) so the use is only counted if the whole approval succeeds.
 */
export async function consumeInviteCodeUse(
  tx: Prisma.TransactionClient,
  inviteCodeId: string,
): Promise<boolean> {
  const code = await tx.inviteCode.findUnique({
    where: { id: inviteCodeId },
    select: {
      isActive: true,
      expiresAt: true,
      maxUses: true,
      usedCount: true,
    },
  });

  if (!code || !code.isActive) return false;
  if (code.expiresAt && code.expiresAt.getTime() < Date.now()) return false;
  if (code.maxUses !== null && (code.usedCount ?? 0) >= code.maxUses) return false;

  const result = await tx.inviteCode.updateMany({
    where: {
      id: inviteCodeId,
      usedCount: { lt: code.maxUses ?? Number.MAX_SAFE_INTEGER },
    },
    data: { usedCount: { increment: 1 } },
  });
  return result.count > 0;
}
