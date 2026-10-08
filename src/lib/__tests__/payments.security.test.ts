import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";

const { db, context, capacityCheck, recalc } = vi.hoisted(() => ({
  db: {
    contract: { findFirst: vi.fn() },
    payment: { findFirst: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(),
      create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    paymentWebhookEvent: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    bedReservation: { create: vi.fn(), count: vi.fn() },
    referral: { update: vi.fn() },
    $transaction: vi.fn(), $queryRawUnsafe: vi.fn(),
  },
  context: vi.fn(), capacityCheck: vi.fn(), recalc: vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/prisma",()=>({prisma:db}));
vi.mock("@/lib/referrals",()=>({
  referralContext:context,
  ReferralError:class ReferralError extends Error{
    constructor(public statusCode:number,message:string){super(message)}
  },
}));
vi.mock("@/lib/data-access",()=>({
  assertFacilityCapacityAvailable:capacityCheck,
  recalculateFacilityOccupancy:recalc,
}));
import { getPaymentMode } from "../payment-mode";
import { createDepositIntent, processDepositSuccess, simulateDemoDeposit } from "../payments";

const paymentFixture = {
  id:"pay_opaque",referralId:"ref_opaque",contractId:"contract_opaque",
  amountCents:5000,currency:"usd",stripePaymentIntentId:null,isDemo:true,
  status:"pending",referral:{facilityId:"facility_opaque",sendingOrgId:"hospital_org",
    facility:{id:"facility_opaque"}},
  contract:{id:"contract_opaque",status:"signed",depositAmountCents:5000,currency:"usd"},
};

describe("deposit safety / modes",()=>{
  beforeEach(()=>{
    vi.resetAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_ENABLE_LIVE_CHARGES;
    delete process.env.MIN_DEPOSIT_CENTS;
    context.mockResolvedValue({type:"hospital",organizationId:"hospital_org",userId:"user-opaque"});
    db.$transaction.mockImplementation((fn:(tx:typeof db)=>Promise<unknown>)=>fn(db));
    db.$queryRawUnsafe.mockResolvedValue([]);
    db.contract.findFirst.mockResolvedValue({
      id:"contract_opaque",referralId:"ref_opaque",status:"signed",
      depositAmountCents:5000,currency:"usd",
    });
    db.payment.findFirst.mockResolvedValue(null);
    db.payment.create.mockResolvedValue(paymentFixture);
    db.payment.findUnique.mockResolvedValue(paymentFixture);
    db.payment.findUniqueOrThrow.mockResolvedValue(paymentFixture);
    db.paymentWebhookEvent.findUnique.mockResolvedValue(null);
    db.paymentWebhookEvent.create.mockResolvedValue({});
    db.paymentWebhookEvent.update.mockResolvedValue({});
    db.referral.update.mockResolvedValue({});
    db.bedReservation.create.mockResolvedValue({});
    db.payment.update.mockResolvedValue({});
    db.payment.updateMany.mockResolvedValue({count:1});
    capacityCheck.mockResolvedValue(undefined);
    recalc.mockResolvedValue(undefined);
  });
  afterEach(()=>{
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_ENABLE_LIVE_CHARGES;
  });

  it("missing and placeholder keys enable demo; live key is gated",()=>{
    expect(getPaymentMode()).toBe("demo");
    expect(getPaymentMode({STRIPE_SECRET_KEY:"your_stripe_secret_key"} as unknown as NodeJS.ProcessEnv)).toBe("demo");
    expect(()=>getPaymentMode({STRIPE_SECRET_KEY:"sk_live_12345678901234567890"} as unknown as NodeJS.ProcessEnv))
      .toThrow("disabled");
  });

  it("creates a demo PaymentIntent with no external network calls",async()=>{
    const result=await createDepositIntent("ref_opaque",5000,"usd");
    expect(result).toEqual(expect.objectContaining({paymentId:"pay_opaque",isDemo:true,mode:"demo"}));
    expect(result.clientSecret).toMatch(/^demo_pi_/);
    expect(db.payment.create).toHaveBeenCalledWith({data:expect.objectContaining({
      referralId:"ref_opaque",contractId:"contract_opaque",isDemo:true,status:"pending",
    })});
  });

  it("allows a failed attempt to retry without changing the signed amount",async()=>{
    db.payment.findFirst.mockResolvedValue({...paymentFixture,status:"failed"});
    const result=await createDepositIntent("ref_opaque",5000,"usd");
    expect(result.isDemo).toBe(true);
    expect(db.payment.create).toHaveBeenCalledTimes(1);
  });
  it("rejects a deposit differing from signed contract",async()=>{
    await expect(createDepositIntent("ref_opaque",9000,"usd"))
      .rejects.toMatchObject({statusCode:409});
    expect(db.payment.create).not.toHaveBeenCalled();
  });

  it("deposit success locks capacity, creates reservation, then sets demo_paid",async()=>{
    const result=await processDepositSuccess({
      externalId:"demo:success:pay_opaque",paymentId:"pay_opaque",paymentIntentId:null,isDemo:true,
    });
    expect(result.status).toBe("paid");
    expect(capacityCheck).toHaveBeenCalledWith(db,"facility_opaque",null,"approved");
    expect(db.bedReservation.create).toHaveBeenCalledWith({data:expect.objectContaining({
      referralId:"ref_opaque",paymentId:"pay_opaque",facilityId:"facility_opaque",
    })});
    expect(recalc).toHaveBeenCalledWith(db,["facility_opaque"]);
    expect(db.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data:{status:"demo_paid"},
    }));
    expect(db.paymentWebhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({
      data:expect.objectContaining({processed:true}),
    }));
  });

  it("duplicate processed webhook is idempotent: no extra bed or charge",async()=>{
    db.paymentWebhookEvent.findUnique.mockResolvedValue({
      externalId:"demo:success:pay_opaque",paymentId:"pay_opaque",processed:true,
    });
    const result=await processDepositSuccess({
      externalId:"demo:success:pay_opaque",paymentId:"pay_opaque",paymentIntentId:null,isDemo:true,
    });
    expect(result.status).toBe("duplicate");
    expect(capacityCheck).not.toHaveBeenCalled();
    expect(db.bedReservation.create).not.toHaveBeenCalled();
  });

  it("capacity gone: flags referral, records refund, NEVER reserves bed",async()=>{
    capacityCheck.mockRejectedValue(new Error("Selected facility has no current availability"));
    const result=await processDepositSuccess({
      externalId:"demo:success:pay_opaque",paymentId:"pay_opaque",paymentIntentId:null,isDemo:true,
    });
    expect(result.status).toBe("demo_refunded");
    expect(db.bedReservation.create).not.toHaveBeenCalled();
    expect(db.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data:expect.objectContaining({status:"refund_pending"}),
    }));
    expect(db.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data:expect.objectContaining({status:"demo_refunded",refundId:"demo_refund_pay_opaque"}),
    }));
    expect(db.referral.update).toHaveBeenCalledWith(expect.objectContaining({
      data:{depositIssue:"CAPACITY_LOST_REFUNDED"},
    }));
  });

  it("facility cannot invoke the demo success action",async()=>{
    context.mockResolvedValue({type:"facility",organizationId:"facility_org",userId:"facility_user"});
    await expect(simulateDemoDeposit("pay_opaque")).rejects.toMatchObject({statusCode:403});
    expect(capacityCheck).not.toHaveBeenCalled();
  });

  it("rejects demo event against Stripe payment row",async()=>{
    db.payment.findUnique.mockResolvedValue({...paymentFixture,isDemo:false,stripePaymentIntentId:"pi_opaque"});
    await expect(processDepositSuccess({
      externalId:"demo:event",paymentId:"pay_opaque",paymentIntentId:null,isDemo:true,
    })).rejects.toMatchObject({statusCode:409});
    expect(db.bedReservation.create).not.toHaveBeenCalled();
  });
});