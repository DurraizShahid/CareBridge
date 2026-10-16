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

export const TERMINAL_PAYMENT_STATUSES = [
  "paid",
  "demo_paid",
  "refunded",
  "demo_refunded",
  "partially_refunded",
] as const;

export const RECOVERABLE_PAYMENT_STATUSES = [
  "pending",
  "failed",
] as const;

export function isTerminalPaymentStatus(status: string): boolean {
  return (TERMINAL_PAYMENT_STATUSES as readonly string[]).includes(status);
}

export function isPaymentFullySettled(payment: { status: string; amountRefundedCents?: number }): boolean {
  return (payment.status === "paid" || payment.status === "demo_paid") && (payment.amountRefundedCents ?? 0) === 0;
}

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
    select: { id: true, amountCents: true, amountRefundedCents: true, currency: true, status: true,
      isDemo: true, failureReason: true, refundId: true, attempts: true, createdAt: true },
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
    where: { referralId, status: "signed", referral: { sendingOrgId: ctx.organizationId, status: "accepted" } },
    select: { id: true, referralId: true, depositAmountCents: true, currency: true },
  });
  if (!contract) throw new ReferralError(409, "Signed contract not found");
  if (contract.depositAmountCents !== amountMinor || contract.currency !== currencyCode)
    throw new ReferralError(409, "Deposit does not match signed agreement");
  // Lock the contract to serialize retries of checkout creation.
  let priorStripeIntentToCancel: string | null = null;
  const payment = await prisma.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT "id" FROM "Contract" WHERE "id" = $1 FOR UPDATE', contract.id);
    const existing = await tx.payment.findFirst({
      where: { contractId: contract.id }, orderBy: { createdAt: "desc" },
    });
    if (existing) {
      if (existing.amountCents !== amountMinor || existing.currency !== currencyCode ||
        existing.isDemo !== (mode === "demo"))
        throw new ReferralError(409, "An existing payment uses different terms or mode");
      if (existing.status === "failed") {
        priorStripeIntentToCancel = existing.stripePaymentIntentId;
        // CB-012: Track attempts on existing payment record instead of creating new rows.
        return tx.payment.update({
          where: { id: existing.id },
          data: {
            status: "pending",
            failureReason: null,
            attempts: { increment: 1 },
            stripePaymentIntentId: null,
          },
        });
      }
      if (existing.status !== "pending")
        throw new ReferralError(409, "Payment already finalized or requires reconciliation");
      return existing;
    }
    return tx.payment.create({ data: {
      contractId: contract.id, referralId, amountCents: amountMinor,
      currency: currencyCode, status: "pending", isDemo: mode === "demo", attempts: 1,
    } });
  });
  if (mode === "demo") return {
    paymentId: payment.id, clientSecret: demoClientSecret(payment.id), isDemo: true,
    mode, amountMinor, currency: currencyCode,
  };
  const stripe = stripeClient();

  // CB-012: Explicitly cancel or reconcile any prior Stripe PaymentIntent before issuing a replacement.
  if (priorStripeIntentToCancel && typeof stripe.paymentIntents?.cancel === "function") {
    try {
      await stripe.paymentIntents.cancel(priorStripeIntentToCancel);
    } catch {
      // Prior intent may already be canceled or in a terminal state in Stripe.
    }
  }

  // CB-009: Stable idempotency key derived from payment record ID (and attempt count).
  const idempotencyKey = (payment.attempts && payment.attempts > 1)
    ? "carebridge:payment:" + payment.id + ":attempt-" + payment.attempts
    : "carebridge:payment:" + payment.id;

  let intent: Stripe.PaymentIntent | null = null;

  // CB-009: On any retry or recovery path, look up the existing PaymentIntent by that idempotency key before creating a new one.
  if (payment.stripePaymentIntentId && typeof stripe.paymentIntents?.retrieve === "function") {
    try {
      intent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
    } catch {
      intent = null;
    }
  }
  if (!intent && typeof stripe.paymentIntents?.search === "function") {
    try {
      const searchRes = await stripe.paymentIntents.search({
        query: `metadata['idempotencyKey']:'${idempotencyKey}' OR metadata['paymentId']:'${payment.id}'`,
      });
      if (searchRes.data && searchRes.data.length > 0) {
        intent = searchRes.data[0];
      }
    } catch {
      // Search not available in mock or environment
    }
  }
  if (!intent && typeof stripe.paymentIntents?.list === "function") {
    try {
      const listRes = await stripe.paymentIntents.list({ limit: 10 });
      const found = listRes.data?.find(pi => pi.metadata?.idempotencyKey === idempotencyKey || pi.metadata?.paymentId === payment.id);
      if (found) intent = found;
    } catch {
      // List not available in mock or environment
    }
  }

  if (!intent) {
    // Exactly opaque application identifiers in Stripe. Never send PHI or contract text.
    intent = await stripe.paymentIntents.create({
      amount: amountMinor, currency: currencyCode,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { paymentId: payment.id, referralId, contractId: contract.id },
      description: "CareBridge placement deposit",
    }, { idempotencyKey });
  }

  // CB-009: Persist the intent ID as soon as it is known.
  await prisma.payment.updateMany({
    where: { id: payment.id, status: "pending" },
    data: { stripePaymentIntentId: intent.id },
  });

  if (!intent.client_secret) throw new ReferralError(502, "Stripe did not return a client secret");

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
      // CB-004: Never treat a partially refunded charge as fully settled.
      if ((payment.amountRefundedCents ?? 0) > 0)
        throw new ReferralError(409, "Payment is partially refunded and cannot be settled");
      await tx.paymentWebhookEvent.update({
        where: { externalId: event.externalId }, data: { processed: true, processedAt: new Date() },
      });
      return { kind: "duplicate" as const };
    }
    if (payment.status === "refunded" || payment.status === "demo_refunded" || payment.status === "partially_refunded") {
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
    await prisma.$transaction(async tx => {
      await tx.payment.updateMany({ where: { id: outcome.paymentId, status: "refund_pending" },
        data: { status: "demo_refunded", refundId } });
      await tx.paymentWebhookEvent.update({ where: { externalId: event.externalId },
        data: { processed: true, processedAt: new Date() } });
      await tx.referral.update({
        where: { id: event.paymentId === outcome.paymentId
          ? (await tx.payment.findUniqueOrThrow({ where: { id: outcome.paymentId } })).referralId
          : "" },
        data: { depositIssue: "CAPACITY_LOST_REFUNDED" },
      });
    });
    return { status: "demo_refunded" };
  }

  // CB-010: Live Stripe: persist the Stripe refund ID with a pending state, handle asynchronous
  // refund outcomes via refund webhook events, and reconcile state from verified webhooks instead of assuming immediate success.
  if (!outcome.paymentIntentId) throw new ReferralError(409, "Cannot refund missing PaymentIntent");
  const refund = await stripeClient().refunds.create({
    payment_intent: outcome.paymentIntentId, reason: "requested_by_customer",
  }, { idempotencyKey: "carebridge:capacity-refund:" + outcome.paymentId });

  if (refund.status === "failed")
    throw new ReferralError(502, "Stripe refund failed: " + (refund.failure_reason ?? "unknown error"));

  refundId = refund.id;

  await prisma.$transaction(async tx => {
    await tx.payment.updateMany({ where: { id: outcome.paymentId, status: "refund_pending" },
      data: { refundId } });
    await tx.paymentWebhookEvent.update({ where: { externalId: event.externalId },
      data: { processed: true, processedAt: new Date() } });
  });
  return { status: "refund_pending" };
}

export async function processDepositFailed(externalId: string, paymentId: string, intentId: string) {
  return prisma.$transaction(async tx => {
    // CB-011: Take the same row-level lock as processDepositSuccess to serialize concurrent events.
    await tx.$queryRawUnsafe('SELECT "id" FROM "Payment" WHERE "id" = $1 FOR UPDATE', paymentId);
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.isDemo || payment.stripePaymentIntentId !== intentId)
      throw new ReferralError(409, "Payment intent mismatch");
    const oldEvent = await tx.paymentWebhookEvent.findUnique({ where: { externalId } });
    if (oldEvent?.processed) return { status: "duplicate" };
    if (!oldEvent) await tx.paymentWebhookEvent.create({
      data: { externalId, paymentId, kind: "payment_failed" },
    });
    // CB-011: Terminal statuses (paid, demo_paid, refunded, demo_refunded, partially_refunded)
    // or active refund_pending must never be corrupted by out-of-order failure events.
    if (isTerminalPaymentStatus(payment.status) || payment.status === "refund_pending") {
      await tx.paymentWebhookEvent.update({ where: { externalId },
        data: { processed: true, processedAt: new Date() } });
      return { status: payment.status };
    }
    if (payment.status === "pending")
      await tx.payment.update({ where: { id: paymentId }, data: { status: "failed" } });
    await tx.paymentWebhookEvent.update({ where: { externalId },
      data: { processed: true, processedAt: new Date() } });
    return { status: "failed" };
  });
}

/** Full or partial Stripe refund: release the bed, update cumulative refunded amount, and flag the referral. */
export async function processDepositRefunded(
  externalId: string,
  intentId: string,
  refundId: string | null,
  amountRefunded?: number,
) {
  return prisma.$transaction(async tx => {
    const ref = await tx.payment.findUnique({ where: { stripePaymentIntentId: intentId }, select: { id: true } });
    if (!ref) throw new ReferralError(409, "Payment intent mismatch");
    await tx.$queryRawUnsafe('SELECT "id" FROM "Payment" WHERE "id" = $1 FOR UPDATE', ref.id);
    const payment = await tx.payment.findUnique({
      where: { id: ref.id }, include: { bedReservation: true, referral: true },
    });
    if (!payment || payment.isDemo) throw new ReferralError(409, "Payment intent mismatch");
    const oldEvent = await tx.paymentWebhookEvent.findUnique({ where: { externalId } });
    if (oldEvent && oldEvent.paymentId !== payment.id)
      throw new ReferralError(409, "Conflicting webhook event ID");
    if (oldEvent?.processed) return { status: "duplicate" };
    if (!oldEvent) await tx.paymentWebhookEvent.create({
      data: { externalId, paymentId: payment.id, kind: "refunded" },
    });

    const cumulativeRefunded = typeof amountRefunded === "number"
      ? amountRefunded
      : payment.amountCents;
    const isFull = cumulativeRefunded >= payment.amountCents;
    const nextStatus = isFull ? "refunded" : "partially_refunded";

    if (payment.status === "paid" || payment.status === "refund_pending" || payment.status === "partially_refunded") {
      if (payment.bedReservation) {
        await tx.bedReservation.delete({ where: { id: payment.bedReservation.id } });
        await recalculateFacilityOccupancy(tx, [payment.bedReservation.facilityId]);
      }
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          amountRefundedCents: cumulativeRefunded,
          refundId: refundId ?? payment.refundId,
        },
      });

      // CB-004: Reconcile referral rules against actual payment state.
      if (payment.status === "refund_pending") {
        await tx.referral.update({
          where: { id: payment.referralId },
          data: { depositIssue: isFull ? "CAPACITY_LOST_REFUNDED" : "CAPACITY_LOST_PARTIALLY_REFUNDED" },
        });
      } else {
        const issue = payment.referral.status === "converted"
          ? (isFull ? "DEPOSIT_REFUNDED_AFTER_CONVERSION" : "DEPOSIT_PARTIALLY_REFUNDED_AFTER_CONVERSION")
          : (isFull ? "DEPOSIT_REFUNDED" : "DEPOSIT_PARTIALLY_REFUNDED");
        await tx.referral.update({
          where: { id: payment.referralId },
          data: { depositIssue: issue },
        });
      }
    }
    await tx.paymentWebhookEvent.update({
      where: { externalId },
      data: { processed: true, processedAt: new Date() },
    });
    return { status: nextStatus };
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