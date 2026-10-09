import "server-only";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { referralContext, ReferralError } from "@/lib/referrals";
import { getPaymentMode, demoClientSecret } from "@/lib/payment-mode";
import { assertFacilityCapacityAvailable, recalculateFacilityOccupancy } from "@/lib/data-access";

export function stripeClient() {
  if (getPaymentMode() === "demo") throw new Error("Stripe is not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}
export type DepositSuccess = {
  externalId: string;
  paymentId: string;
  paymentIntentId: string | null;
  isDemo: boolean;
};

export async function paymentForContract(contractId: string) {
  const ctx = await referralContext();
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, referral: ctx.type === "hospital"
      ? { sendingOrgId: ctx.organizationId }
      : { facility: { organizationId: ctx.organizationId } } },
    select: { id: true, referralId: true, status: true, depositAmountCents: true, currency: true },
  });
  if (!contract) throw new ReferralError(404, "Contract not found");
  const payment = await prisma.payment.findFirst({
    where: { contractId },
    orderBy: { createdAt: "desc" },
    select: { id: true, amountCents: true, currency: true, status: true,
      isDemo: true, failureReason: true, refundId: true, createdAt: true },
  });
  return { contract, payment, mode: getPaymentMode(), canPay: ctx.type === "hospital" };
}

export async function createDepositIntent(referralId: string, amountMinor: number, currency: string) {
  const ctx = await referralContext();
  if (ctx.type !== "hospital") throw new ReferralError(403, "Only sending hospital can initiate deposit");
  const mode = getPaymentMode();
  const currencyCode = currency.toLowerCase();
  if (currencyCode !== "usd") throw new ReferralError(400, "Only USD is supported in this slice");
  const minimumDeposit = Number(process.env.MIN_DEPOSIT_CENTS ?? "50");
  if (!Number.isSafeInteger(minimumDeposit) || minimumDeposit < 50 || minimumDeposit > 100_000_000)
    throw new ReferralError(500, "MIN_DEPOSIT_CENTS is invalid");
  if (!Number.isSafeInteger(amountMinor) || amountMinor < minimumDeposit)
    throw new ReferralError(400, "Deposit must be at least 50 cents");
  const contract = await prisma.contract.findFirst({
    where: { referralId, status: "signed", referral: { sendingOrgId: ctx.organizationId, status: { in: ["accepted", "converted"] } } },
    select: { id: true, referralId: true, depositAmountCents: true, currency: true },
  });
  if (!contract) throw new ReferralError(409, "Signed contract not found");
  if (contract.depositAmountCents !== amountMinor || contract.currency !== currencyCode)
    throw new ReferralError(409, "Deposit does not match signed agreement");
  // Lock the contract to serialize retries of checkout creation.
  const payment = await prisma.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT "id" FROM "Contract" WHERE "id" = $1 FOR UPDATE', contract.id);
    const existing = await tx.payment.findFirst({
      where: { contractId: contract.id }, orderBy: { createdAt: "desc" },
    });
    if (existing) {
      if (existing.amountCents !== amountMinor || existing.currency !== currencyCode ||
        existing.isDemo !== (mode === "demo"))
        throw new ReferralError(409, "An existing payment uses different terms or mode");
      if (existing.status === "failed") return tx.payment.create({ data: {
        contractId: contract.id, referralId, amountCents: amountMinor,
        currency: currencyCode, status: "pending", isDemo: mode === "demo",
      } });
      if (existing.status !== "pending")
        throw new ReferralError(409, "Payment already finalized or requires reconciliation");
      return existing;
    }
    return tx.payment.create({ data: {
      contractId: contract.id, referralId, amountCents: amountMinor,
      currency: currencyCode, status: "pending", isDemo: mode === "demo",
    } });
  });
  if (mode === "demo") return {
    paymentId: payment.id, clientSecret: demoClientSecret(payment.id), isDemo: true,
    mode, amountMinor, currency: currencyCode,
  };
  const stripe = stripeClient();
  // Exactly opaque application identifiers in Stripe. Never send PHI or contract text.
  const intent = await stripe.paymentIntents.create({
    amount: amountMinor, currency: currencyCode,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { paymentId: payment.id, referralId, contractId: contract.id },
    description: "CareBridge placement deposit",
  }, { idempotencyKey: "carebridge:payment:" + payment.id });
  if (!intent.client_secret) throw new ReferralError(502, "Stripe did not return a client secret");
  await prisma.payment.updateMany({
    where: { id: payment.id, status: "pending" },
    data: { stripePaymentIntentId: intent.id },
  });
  return { paymentId: payment.id, clientSecret: intent.client_secret, isDemo: false,
    mode, amountMinor, currency: currencyCode };
}

/** Atomic ledger and row-locked capacity reservation, shared with Phase 1. */
export async function processDepositSuccess(event: DepositSuccess) {
  const outcome = await prisma.$transaction(async tx => {
    // Payment first, then Facility: distinct webhooks serialize before the bed check.
    await tx.$queryRawUnsafe('SELECT "id" FROM "Payment" WHERE "id" = $1 FOR UPDATE', event.paymentId);
    const payment = await tx.payment.findUnique({
      where: { id: event.paymentId },
      include: { referral: { include: { facility: true } }, contract: true },
    });
    if (!payment || !payment.contract || payment.contract.status !== "signed")
      throw new ReferralError(409, "Signed payment not found");
    if (payment.isDemo !== event.isDemo) throw new ReferralError(409, "Payment mode mismatch");
    if (!event.isDemo && payment.stripePaymentIntentId !== event.paymentIntentId)
      throw new ReferralError(409, "PaymentIntent mismatch");
    const oldEvent = await tx.paymentWebhookEvent.findUnique({ where: { externalId: event.externalId } });
    if (oldEvent && oldEvent.paymentId !== payment.id)
      throw new ReferralError(409, "Conflicting webhook event ID");
    if (oldEvent?.processed) return { kind: "duplicate" as const };
    if (!oldEvent) await tx.paymentWebhookEvent.create({ data: {
      externalId: event.externalId, paymentId: payment.id, kind: "payment_succeeded",
    } });
    if (payment.status === "paid" || payment.status === "demo_paid") {
      await tx.paymentWebhookEvent.update({
        where: { externalId: event.externalId }, data: { processed: true, processedAt: new Date() },
      });
      return { kind: "duplicate" as const };
    }
    if (payment.status === "refunded" || payment.status === "demo_refunded") {
      await tx.paymentWebhookEvent.update({
        where: { externalId: event.externalId }, data: { processed: true, processedAt: new Date() },
      });
      return { kind: "duplicate" as const };
    }
    if (payment.status === "refund_pending") return { kind: "refund" as const, paymentId: payment.id,
      paymentIntentId: payment.stripePaymentIntentId, isDemo: payment.isDemo };
    if (payment.status !== "pending") throw new ReferralError(409, "Payment is not pending");
    if (payment.amountCents !== payment.contract.depositAmountCents ||
      payment.currency !== payment.contract.currency)
      throw new ReferralError(409, "Payment amount mismatch");
    // The existing Phase-1 helper locks Facility FOR UPDATE and counts both
    // approved/in_progress placements and existing deposit bed reservations.
    try {
      await assertFacilityCapacityAvailable(tx, payment.referral.facilityId, null, "approved");
    } catch (err) {
      if (!(err instanceof Error) || !/availability|capacity/i.test(err.message)) throw err;
      await tx.payment.update({ where: { id: payment.id },
        data: { status: "refund_pending", failureReason: "Facility has no capacity at payment confirmation" } });
      await tx.referral.update({ where: { id: payment.referralId },
        data: { depositIssue: "CAPACITY_LOST_REFUND_REQUIRED" } });
      return { kind: "refund" as const, paymentId: payment.id,
        paymentIntentId: payment.stripePaymentIntentId, isDemo: payment.isDemo };
    }
    await tx.bedReservation.create({ data: {
      referralId: payment.referralId, paymentId: payment.id, facilityId: payment.referral.facilityId,
    } });
    await recalculateFacilityOccupancy(tx, [payment.referral.facilityId]);
    await tx.payment.update({ where: { id: payment.id },
      data: { status: payment.isDemo ? "demo_paid" : "paid" } });
    await tx.paymentWebhookEvent.update({
      where: { externalId: event.externalId }, data: { processed: true, processedAt: new Date() },
    });
    return { kind: "paid" as const };
  });
  if (outcome.kind !== "refund") return { status: outcome.kind };
  // Stripe refund is performed OUTSIDE the DB transaction. Failed refund leaves
  // refund_pending + unprocessed event to be retried (no false "paid" state).
  let refundId: string;
  if (outcome.isDemo) {
    refundId = "demo_refund_" + outcome.paymentId;
  } else {
    if (!outcome.paymentIntentId) throw new ReferralError(409, "Cannot refund missing PaymentIntent");
    const refund = await stripeClient().refunds.create({
      payment_intent: outcome.paymentIntentId, reason: "requested_by_customer",
    }, { idempotencyKey: "carebridge:capacity-refund:" + outcome.paymentId });
    if (refund.status !== "succeeded")
      throw new ReferralError(503, "Refund requested but not yet settled; retry required");
    refundId = refund.id;
  }
  await prisma.$transaction(async tx => {
    await tx.payment.updateMany({ where: { id: outcome.paymentId, status: "refund_pending" },
      data: { status: outcome.isDemo ? "demo_refunded" : "refunded", refundId } });
    await tx.paymentWebhookEvent.update({ where: { externalId: event.externalId },
      data: { processed: true, processedAt: new Date() } });
    await tx.referral.update({
      where: { id: event.paymentId === outcome.paymentId
        ? (await tx.payment.findUniqueOrThrow({ where: { id: outcome.paymentId } })).referralId
        : "" },
      data: { depositIssue: "CAPACITY_LOST_REFUNDED" },
    });
  });
  return { status: outcome.isDemo ? "demo_refunded" : "refunded" };
}

export async function processDepositFailed(externalId: string, paymentId: string, intentId: string) {
  return prisma.$transaction(async tx => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.isDemo || payment.stripePaymentIntentId !== intentId)
      throw new ReferralError(409, "Payment intent mismatch");
    const oldEvent = await tx.paymentWebhookEvent.findUnique({ where: { externalId } });
    if (oldEvent?.processed) return { status: "duplicate" };
    if (!oldEvent) await tx.paymentWebhookEvent.create({
      data: { externalId, paymentId, kind: "payment_failed" },
    });
    if (payment.status === "pending")
      await tx.payment.update({ where: { id: paymentId }, data: { status: "failed" } });
    await tx.paymentWebhookEvent.update({ where: { externalId },
      data: { processed: true, processedAt: new Date() } });
    return { status: "failed" };
  });
}

export async function simulateDemoDeposit(paymentId: string) {
  const ctx = await referralContext();
  if (ctx.type !== "hospital") throw new ReferralError(403, "Hospital access required");
  if (getPaymentMode() !== "demo") throw new ReferralError(403, "Demo payment endpoint disabled");
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, isDemo: true, contract: { status: "signed" },
      referral: { sendingOrgId: ctx.organizationId, status: { in: ["accepted", "converted"] } } },
  });
  if (!payment) throw new ReferralError(404, "Demo payment not found");
  return processDepositSuccess({
    externalId: "demo:success:" + payment.id, paymentId: payment.id,
    paymentIntentId: null, isDemo: true,
  });
}