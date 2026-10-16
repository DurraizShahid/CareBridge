import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";

const LIVE_ENV = {
  STRIPE_ENABLE_LIVE_CHARGES: "true",
  STRIPE_SECRET_KEY: "sk_live_unit_0000000000000000",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_unit_0000000000000000",
  STRIPE_WEBHOOK_SECRET: "whsec_unit_0000000000000000",
};

const { db, context, capacityCheck, recalc, stripeMocks } = vi.hoisted(() => ({
  db: {
    contract: { findFirst: vi.fn() },
    payment: { findFirst: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(),
      create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    paymentWebhookEvent: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    bedReservation: { create: vi.fn(), delete: vi.fn() },
    referral: { update: vi.fn() },
    $transaction: vi.fn(), $queryRawUnsafe: vi.fn(),
  },
  context: vi.fn(), capacityCheck: vi.fn(), recalc: vi.fn(),
  stripeMocks: {
    intentsCreate: vi.fn(),
    intentsRetrieve: vi.fn(),
    intentsSearch: vi.fn(),
    intentsCancel: vi.fn(),
    refundsCreate: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/referrals", () => ({
  referralContext: context,
  ReferralError: class ReferralError extends Error {
    constructor(public statusCode: number, message: string) { super(message); }
  },
}));
vi.mock("@/lib/data-access", () => ({
  assertFacilityCapacityAvailable: capacityCheck,
  recalculateFacilityOccupancy: recalc,
}));
vi.mock("stripe", async importOriginal => {
  const Actual = (await importOriginal<typeof import("stripe")>()).default;
  return {
    default: function (key: string) {
      return Object.assign(new Actual(key), {
        paymentIntents: {
          create: stripeMocks.intentsCreate,
          retrieve: stripeMocks.intentsRetrieve,
          search: stripeMocks.intentsSearch,
          cancel: stripeMocks.intentsCancel,
        },
        refunds: {
          create: stripeMocks.refundsCreate,
        },
      });
    },
  };
});

import Stripe from "stripe";
import {
  createDepositIntent,
  processDepositSuccess,
  processDepositFailed,
  processDepositRefunded,
  isTerminalPaymentStatus,
  isPaymentFullySettled,
} from "../payments";
import { POST } from "@/app/api/webhooks/stripe/route";

const samplePayment = {
  id: "pay_123",
  referralId: "ref_123",
  contractId: "contract_123",
  amountCents: 5000,
  amountRefundedCents: 0,
  currency: "usd",
  stripePaymentIntentId: "pi_123",
  isDemo: false,
  status: "pending",
  refundId: null,
  failureReason: null,
  attempts: 1,
  bedReservation: null,
  referral: { id: "ref_123", status: "accepted", facilityId: "fac_123", facility: { id: "fac_123" } },
  contract: { id: "contract_123", status: "signed", depositAmountCents: 5000, currency: "usd" },
};

function sendWebhook(event: object, secret = LIVE_ENV.STRIPE_WEBHOOK_SECRET) {
  const payload = JSON.stringify(event);
  const header = new Stripe(LIVE_ENV.STRIPE_SECRET_KEY).webhooks.generateTestHeaderString({ payload, secret });
  return POST(new Request("https://carebridge.test/api/webhooks/stripe", {
    method: "POST",
    body: payload,
    headers: { "stripe-signature": header },
  }));
}

describe("Payment integrity wave 2 hardening", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.assign(process.env, LIVE_ENV);
    context.mockResolvedValue({ type: "hospital", organizationId: "hospital_org", userId: "user-123" });
    db.$transaction.mockImplementation((fn: (tx: typeof db) => Promise<unknown>) => fn(db));
    db.$queryRawUnsafe.mockResolvedValue([]);
    db.contract.findFirst.mockResolvedValue({
      id: "contract_123", referralId: "ref_123", status: "signed",
      depositAmountCents: 5000, currency: "usd",
    });
    db.payment.findFirst.mockResolvedValue(null);
    db.payment.create.mockResolvedValue({ ...samplePayment, stripePaymentIntentId: null });
    db.payment.findUnique.mockResolvedValue(samplePayment);
    db.payment.update.mockResolvedValue(samplePayment);
    db.payment.updateMany.mockResolvedValue({ count: 1 });
    db.paymentWebhookEvent.findUnique.mockResolvedValue(null);
    stripeMocks.intentsCreate.mockResolvedValue({ id: "pi_123", client_secret: "secret_123" });
    stripeMocks.intentsSearch.mockResolvedValue({ data: [] });
    stripeMocks.intentsRetrieve.mockResolvedValue({ id: "pi_123", client_secret: "secret_123" });
    stripeMocks.intentsCancel.mockResolvedValue({ id: "pi_123", status: "canceled" });
    stripeMocks.refundsCreate.mockResolvedValue({ id: "re_123", status: "pending" });
    capacityCheck.mockResolvedValue(undefined);
    recalc.mockResolvedValue(undefined);
  });

  afterEach(() => {
    for (const k of Object.keys(LIVE_ENV)) delete process.env[k];
  });

  describe("CB-004: partial refunds and settlement state", () => {
    it("partial refund webhook updates cumulative refunded amount, releases bed, and flags referral", async () => {
      db.payment.findUnique.mockResolvedValue({
        ...samplePayment,
        status: "paid",
        bedReservation: { id: "bed_123", facilityId: "fac_123" },
      });

      const partialRefundEvent = {
        id: "evt_partial_refund",
        object: "event",
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_123",
            object: "charge",
            payment_intent: "pi_123",
            refunded: false,
            amount_refunded: 2000,
            refunds: { data: [{ id: "re_part_1" }] },
          },
        },
      };

      const res = await sendWebhook(partialRefundEvent);
      expect(res.status).toBe(200);

      // Bed reservation must be released even on partial refund
      expect(db.bedReservation.delete).toHaveBeenCalledWith({ where: { id: "bed_123" } });
      expect(recalc).toHaveBeenCalledWith(db, ["fac_123"]);

      // Payment record updated with partially_refunded and cumulative amount
      expect(db.payment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: "partially_refunded",
          amountRefundedCents: 2000,
          refundId: "re_part_1",
        }),
      }));

      // Referral flagged with DEPOSIT_PARTIALLY_REFUNDED
      expect(db.referral.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { depositIssue: "DEPOSIT_PARTIALLY_REFUNDED" },
      }));
    });

    it("partially refunded charge is never treated as fully settled", async () => {
      expect(isPaymentFullySettled({ status: "paid", amountRefundedCents: 100 })).toBe(false);
      expect(isPaymentFullySettled({ status: "partially_refunded", amountRefundedCents: 2000 })).toBe(false);
      expect(isPaymentFullySettled({ status: "paid", amountRefundedCents: 0 })).toBe(true);

      // Succeeded event against a partially refunded payment must reject
      db.payment.findUnique.mockResolvedValue({
        ...samplePayment,
        status: "paid",
        amountRefundedCents: 1500,
      });

      await expect(processDepositSuccess({
        externalId: "evt_late_success",
        paymentId: "pay_123",
        paymentIntentId: "pi_123",
        isDemo: false,
      })).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("CB-009: PaymentIntent crash recovery gap", () => {
    it("recovers orphaned pending payment by looking up intent with stable idempotency key", async () => {
      // Pending row exists in DB without stripePaymentIntentId (crash right after Stripe creation)
      db.payment.findFirst.mockResolvedValue({
        ...samplePayment,
        status: "pending",
        stripePaymentIntentId: null,
      });

      // Stripe search finds the previously created intent
      stripeMocks.intentsSearch.mockResolvedValue({
        data: [{
          id: "pi_found_in_stripe",
          client_secret: "secret_found",
          metadata: { paymentId: "pay_123" },
        }],
      });

      const result = await createDepositIntent("ref_123", 5000, "usd");
      expect(result.clientSecret).toBe("secret_found");

      // Did not create a redundant PaymentIntent
      expect(stripeMocks.intentsCreate).not.toHaveBeenCalled();

      // Persisted the discovered intent ID immediately
      expect(db.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "pay_123", status: "pending" },
        data: { stripePaymentIntentId: "pi_found_in_stripe" },
      }));
    });
  });

  describe("CB-010: asynchronous refund handling", () => {
    it("handles pending Stripe refund on capacity loss and waits for webhook to finalize", async () => {
      capacityCheck.mockRejectedValue(new Error("Selected facility has no current availability"));
      stripeMocks.refundsCreate.mockResolvedValue({ id: "re_async_123", status: "pending" });

      db.payment.findUnique.mockResolvedValue({
        ...samplePayment,
        status: "pending",
      });

      const outcome = await processDepositSuccess({
        externalId: "evt_succ_cap_loss",
        paymentId: "pay_123",
        paymentIntentId: "pi_123",
        isDemo: false,
      });

      // Does not throw 503; returns refund_pending with refundId persisted
      expect(outcome.status).toBe("refund_pending");
      expect(db.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "pay_123", status: "refund_pending" },
        data: { refundId: "re_async_123" },
      }));

      // Webhook event marked processed so retry isn't stuck
      expect(db.paymentWebhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { externalId: "evt_succ_cap_loss" },
        data: expect.objectContaining({ processed: true }),
      }));

      // Later verified refund webhook settles the refund
      db.payment.findUnique.mockResolvedValue({
        ...samplePayment,
        status: "refund_pending",
        refundId: "re_async_123",
      });

      const settleRes = await processDepositRefunded("evt_charge_refunded", "pi_123", "re_async_123", 5000);
      expect(settleRes.status).toBe("refunded");
      expect(db.referral.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { depositIssue: "CAPACITY_LOST_REFUNDED" },
      }));
    });
  });

  describe("CB-011: payment event serialization and row locking", () => {
    it("failure handler locks payment row and protects terminal statuses", async () => {
      db.payment.findUnique.mockResolvedValue({
        ...samplePayment,
        status: "paid",
      });

      const result = await processDepositFailed("evt_out_of_order_fail", "pay_123", "pi_123");

      // Row level lock must be acquired
      expect(db.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT "id" FROM "Payment" WHERE "id" = $1 FOR UPDATE',
        "pay_123",
      );

      // Terminal status is preserved; payment not marked failed
      expect(result.status).toBe("paid");
      expect(db.payment.update).not.toHaveBeenCalledWith(expect.objectContaining({
        data: { status: "failed" },
      }));
    });

    it("verifies terminal and recoverable statuses definition", () => {
      expect(isTerminalPaymentStatus("paid")).toBe(true);
      expect(isTerminalPaymentStatus("demo_paid")).toBe(true);
      expect(isTerminalPaymentStatus("refunded")).toBe(true);
      expect(isTerminalPaymentStatus("demo_refunded")).toBe(true);
      expect(isTerminalPaymentStatus("partially_refunded")).toBe(true);
      expect(isTerminalPaymentStatus("pending")).toBe(false);
      expect(isTerminalPaymentStatus("failed")).toBe(false);
    });
  });

  describe("CB-012: failed payment retries", () => {
    it("retrying failed payment cancels prior intent and updates attempts on existing record", async () => {
      db.payment.findFirst.mockResolvedValue({
        ...samplePayment,
        status: "failed",
        stripePaymentIntentId: "pi_failed_old",
        attempts: 1,
      });

      db.payment.update.mockResolvedValue({
        ...samplePayment,
        status: "pending",
        stripePaymentIntentId: null,
        attempts: 2,
      });

      const result = await createDepositIntent("ref_123", 5000, "usd");
      expect(result.isDemo).toBe(false);

      // Prior PaymentIntent was cancelled
      expect(stripeMocks.intentsCancel).toHaveBeenCalledWith("pi_failed_old");

      // Existing record updated with incremented attempt; no new row created
      expect(db.payment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "pay_123" },
        data: expect.objectContaining({
          status: "pending",
          attempts: { increment: 1 },
          stripePaymentIntentId: null,
        }),
      }));
      expect(db.payment.create).not.toHaveBeenCalled();

      // New intent created with idempotency key reflecting attempt 2
      expect(stripeMocks.intentsCreate).toHaveBeenCalledWith(
        expect.anything(),
        { idempotencyKey: "carebridge:payment:pay_123:attempt-2" },
      );
    });
  });
});
