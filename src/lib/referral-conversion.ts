import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { assertFacilityCapacityAvailable, recalculateFacilityOccupancy } from "@/lib/data-access";
import { referralContext, ReferralError } from "@/lib/referrals";

/**
 * Release one paid referral reservation and create the corresponding approved
 * placement under the same facility row lock and Prisma transaction.
 * Never synthesize missing clinical information into a Patient record.
 */
export async function convertPaidReferral(referralId: string) {
  const actor = await referralContext();
  if (actor.type !== "facility")
    throw new ReferralError(403, "Only the receiving facility may convert referrals");
  return prisma.$transaction(async tx => {
    // Serializes conversion retries and maintains a single conversion identity.
    await tx.$queryRawUnsafe('SELECT "id" FROM "Referral" WHERE "id" = $1 FOR UPDATE', referralId);
    const referral = await tx.referral.findFirst({
      where: { id: referralId, facility: { organizationId: actor.organizationId } },
      include: {
        bedReservation: true,
        contract: { include: { payments: true } },
      },
    });
    if (!referral) throw new ReferralError(404, "Referral not found");
    if (referral.status === "converted") {
      if (referral.convertedPlacementId)
        return { referralId, placementId: referral.convertedPlacementId, status: "converted" as const, alreadyConverted: true };
      throw new ReferralError(409, "Converted referral has no recorded placement");
    }
    if (referral.status !== "accepted" || referral.depositIssue)
      throw new ReferralError(409, "Referral is not ready for conversion");
    if (!referral.contract || referral.contract.status !== "signed")
      throw new ReferralError(409, "Contract must be signed");
    const reservation = referral.bedReservation;
    if (!reservation) throw new ReferralError(409, "No deposit-backed bed reservation");
    const paid = referral.contract.payments.find(p =>
      p.id === reservation.paymentId && p.referralId === referral.id &&
      (p.status === "paid" || p.status === "demo_paid"));
    if (!paid) throw new ReferralError(409, "Confirmed deposit required");
    // Existing patient intake is authoritative. Do not invent gender,
    // diagnosis, contact, insurance, or other medical values from a referral.
    const patient = await tx.patient.findFirst({
      where: { mrn: referral.patientMrn, organizationId: referral.sendingOrgId },
      select: { id: true, dateOfBirth: true, socialWorkerId: true, careLevelRequired: true },
    });
    if (!patient || patient.dateOfBirth.toISOString().slice(0, 10) !==
        referral.patientDateOfBirth.toISOString().slice(0, 10))
      throw new ReferralError(409, "Matching hospital patient intake is required before conversion");
    const socialWorker = await tx.user.findFirst({
      where: { id: patient.socialWorkerId, organizationId: referral.sendingOrgId },
      select: { id: true },
    });
    if (!socialWorker) throw new ReferralError(409, "Patient needs an assigned hospital social worker");

    // Same facility lock used by the Phase-1 admission/capacity path.
    await tx.$queryRawUnsafe('SELECT "id" FROM "Facility" WHERE "id" = $1 FOR UPDATE', referral.facilityId);
    const existingPlacement = await tx.placement.findFirst({
      where: { patientId: patient.id, facilityId: referral.facilityId,
        status: { in: ["approved", "in_progress"] } },
      select: { id: true },
    });
    if (existingPlacement)
      throw new ReferralError(409, "Patient already has an active placement at this facility");

    const placementId = randomUUID();
    // Removing the reservation and creating the placement is atomic: rollback
    // restores the reservation if any subsequent validation or write fails.
    const released = await tx.bedReservation.deleteMany({
      where: { id: reservation.id, referralId, paymentId: paid.id, facilityId: referral.facilityId },
    });
    if (released.count !== 1)
      throw new ReferralError(409, "Bed reservation was already released");

    // Recompute availability without the released reservation before running
    // the existing Phase-1 capacity assertion (which also checks availability).
    await recalculateFacilityOccupancy(tx, [referral.facilityId]);
    await assertFacilityCapacityAvailable(tx, referral.facilityId, null, "approved");
    await tx.placement.create({ data: {
      id: placementId,
      patientId: patient.id,
      facilityId: referral.facilityId,
      selectedFacilityId: referral.facilityId,
      socialWorkerId: socialWorker.id,
      status: "approved",
      careLevel: referral.careLevel,
      priority: "medium",
      matchedFacilities: [referral.facilityId],
      insurancePreAuthorized: false,
      notes: "Converted from accepted, deposit-paid referral.",
      organizationId: referral.sendingOrgId,
      approvalDate: new Date(),
    } });
    await tx.referral.update({
      where: { id: referralId },
      data: { status: "converted", convertedPlacementId: placementId },
    });
    await recalculateFacilityOccupancy(tx, [referral.facilityId]);
    return { referralId, placementId, status: "converted" as const, alreadyConverted: false };
  });
}