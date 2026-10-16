import { describe, beforeEach, it, expect, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Obviously fake values used only to exercise prefix checks and HMAC signing.
const LIVE_ENV = {
  STRIPE_ENABLE_LIVE_CHARGES: "true",
  STRIPE_SECRET_KEY: "sk_live_unit_0000000000000000",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_unit_0000000000000000",
  STRIPE_WEBHOOK_SECRET: "whsec_unit_0000000000000000",
};

const { db, context, capacityCheck, recalc, intentsCreate } = vi.hoisted(() => ({
  db: {
    contract: { findFirst: vi.fn() },
    payment: { findFirst: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(),
      create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    paymentWebhookEvent: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    bedReservation: { create: vi.fn(), delete: vi.fn() },
    referral: { update: vi.fn() },
    $transaction: vi.fn(), $queryRawUnsafe: vi.fn(),
  },
  context: vi.fn(), capacityCheck: vi.fn(), recalc: vi.fn(), intentsCreate: vi.fn(),
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
// Real Stripe SDK (real webhook signature verification), with network calls mocked.
vi.mock("stripe",async importOriginal=>{
  const Actual=(await importOriginal<typeof import("stripe")>()).default;
  return {default:function(key:string){
    return Object.assign(new Actual(key),{paymentIntents:{create:intentsCreate}});
  }};
});
import Stripe from "stripe";
import { getPaymentMode } from "../payment-mode";
import { createDepositIntent } from "../payments";
import { POST } from "@/app/api/webhooks/stripe/route";

const livePayment = {
  id:"pay_opaque",referralId:"ref_opaque",contractId:"contract_opaque",
  amountCents:5000,currency:"usd",stripePaymentIntentId:"pi_opaque",isDemo:false,
  status:"pending",refundId:null,bedReservation:null,
  referral:{status:"accepted",facilityId:"facility_opaque",facility:{id:"facility_opaque"}},
  contract:{id:"contract_opaque",status:"signed",depositAmountCents:5000,currency:"usd"},
};

function webhook(event:object,secret=LIVE_ENV.STRIPE_WEBHOOK_SECRET){
  const payload=JSON.stringify(event);
  const header=new Stripe(LIVE_ENV.STRIPE_SECRET_KEY).webhooks.generateTestHeaderString({payload,secret});
  return POST(new Request("https://carebridge.test/api/webhooks/stripe",{
    method:"POST",body:payload,headers:{"stripe-signature":header},
  }));
}
const succeeded={id:"evt_success",object:"event",type:"payment_intent.succeeded",
  data:{object:{id:"pi_opaque",object:"payment_intent",amount:5000,currency:"usd",metadata:{paymentId:"pay_opaque"}}}};
const refunded={id:"evt_refund",object:"event",type:"charge.refunded",
  data:{object:{id:"ch_opaque",object:"charge",payment_intent:"pi_opaque",refunded:true,
    refunds:{data:[{id:"re_opaque"}]}}}};

describe("Stripe live mode",()=>{
  beforeEach(()=>{
    vi.resetAllMocks();
    vi.spyOn(console,"error").mockImplementation(()=>{});
    for (const k of [...Object.keys(LIVE_ENV),"MIN_DEPOSIT_CENTS"]) delete process.env[k];
    context.mockResolvedValue({type:"hospital",organizationId:"hospital_org",userId:"user-opaque"});
    db.$transaction.mockImplementation((fn:(tx:typeof db)=>Promise<unknown>)=>fn(db));
    db.$queryRawUnsafe.mockResolvedValue([]);
    db.contract.findFirst.mockResolvedValue({
      id:"contract_opaque",referralId:"ref_opaque",status:"signed",depositAmountCents:5000,currency:"usd",
    });
    db.payment.findFirst.mockResolvedValue(null);
    db.payment.create.mockResolvedValue({...livePayment,stripePaymentIntentId:null});
    db.payment.findUnique.mockResolvedValue(livePayment);
    db.payment.updateMany.mockResolvedValue({count:1});
    db.paymentWebhookEvent.findUnique.mockResolvedValue(null);
    intentsCreate.mockResolvedValue({id:"pi_opaque",client_secret:"pi_opaque_secret_x"});
  });

  it("mode gate: live only with flag + full live keys; otherwise demo or fail closed",()=>{
    const env=(e:object)=>e as unknown as NodeJS.ProcessEnv;
    expect(getPaymentMode(env(LIVE_ENV))).toBe("live");
    expect(getPaymentMode(env({}))).toBe("demo");
    expect(getPaymentMode(env({...LIVE_ENV,STRIPE_ENABLE_LIVE_CHARGES:"false",STRIPE_SECRET_KEY:""}))).toBe("demo");
    expect(()=>getPaymentMode(env({STRIPE_ENABLE_LIVE_CHARGES:"true"}))).toThrow("STRIPE_SECRET_KEY");
    expect(()=>getPaymentMode(env({...LIVE_ENV,STRIPE_SECRET_KEY:"sk_test_unit_0000000000"}))).toThrow("sk_live_");
    expect(()=>getPaymentMode(env({...LIVE_ENV,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:"pk_test_x"}))).toThrow("pk_live_");
    expect(()=>getPaymentMode(env({...LIVE_ENV,STRIPE_WEBHOOK_SECRET:""}))).toThrow("STRIPE_WEBHOOK_SECRET");
  });

  it("creates a real PaymentIntent with idempotency key and opaque metadata only",async()=>{
    Object.assign(process.env,LIVE_ENV);
    const result=await createDepositIntent("ref_opaque",5000,"usd");
    expect(result).toEqual(expect.objectContaining({isDemo:false,mode:"live",clientSecret:"pi_opaque_secret_x"}));
    expect(db.payment.create).toHaveBeenCalledWith({data:expect.objectContaining({isDemo:false})});
    expect(intentsCreate).toHaveBeenCalledTimes(1);
    const [params,options]=intentsCreate.mock.calls[0];
    expect(params.metadata).toEqual({paymentId:"pay_opaque",referralId:"ref_opaque",contractId:"contract_opaque"});
    expect(options).toEqual({idempotencyKey:"carebridge:payment:pay_opaque"});
    expect(db.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({data:{stripePaymentIntentId:"pi_opaque"}}));
  });

  it("live requested without keys fails closed before any DB write or Stripe call",async()=>{
    process.env.STRIPE_ENABLE_LIVE_CHARGES="true";
    await expect(createDepositIntent("ref_opaque",5000,"usd")).rejects.toThrow("STRIPE_SECRET_KEY");
    expect(db.payment.create).not.toHaveBeenCalled();
    expect(intentsCreate).not.toHaveBeenCalled();
  });

  it("demo mode never calls Stripe",async()=>{
    const result=await createDepositIntent("ref_opaque",5000,"usd");
    expect(result.isDemo).toBe(true);
    expect(intentsCreate).not.toHaveBeenCalled();
  });

  it("webhook rejects a bad signature without touching the ledger",async()=>{
    Object.assign(process.env,LIVE_ENV);
    const res=await webhook(succeeded,"whsec_wrong_000000000000");
    expect(res.status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("verified payment_intent.succeeded reserves the bed; a duplicate does not",async()=>{
    Object.assign(process.env,LIVE_ENV);
    expect((await webhook(succeeded)).status).toBe(200);
    expect(db.bedReservation.create).toHaveBeenCalledTimes(1);
    expect(db.payment.update).toHaveBeenCalledWith(expect.objectContaining({data:{status:"paid"}}));
    db.paymentWebhookEvent.findUnique.mockResolvedValue({externalId:"evt_success",paymentId:"pay_opaque",processed:true});
    expect((await webhook(succeeded)).status).toBe(200);
    expect(db.bedReservation.create).toHaveBeenCalledTimes(1);
  });

  it("verified payment_intent.payment_failed marks the payment failed",async()=>{
    Object.assign(process.env,LIVE_ENV);
    const res=await webhook({...succeeded,id:"evt_fail",type:"payment_intent.payment_failed"});
    expect(res.status).toBe(200);
    expect(db.payment.update).toHaveBeenCalledWith({where:{id:"pay_opaque"},data:{status:"failed"}});
    expect(db.bedReservation.create).not.toHaveBeenCalled();
  });

  it("verified charge.refunded releases the bed and flags the referral; a duplicate is a no-op",async()=>{
    Object.assign(process.env,LIVE_ENV);
    db.payment.findUnique.mockResolvedValue({...livePayment,status:"paid",
      bedReservation:{id:"bed_opaque",facilityId:"facility_opaque"}});
    expect((await webhook(refunded)).status).toBe(200);
    expect(db.bedReservation.delete).toHaveBeenCalledWith({where:{id:"bed_opaque"}});
    expect(recalc).toHaveBeenCalledWith(db,["facility_opaque"]);
    expect(db.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "refunded", refundId: "re_opaque", amountRefundedCents: 5000 }),
    }));
    expect(db.referral.update).toHaveBeenCalledWith(expect.objectContaining({data:{depositIssue:"DEPOSIT_REFUNDED"}}));
    db.paymentWebhookEvent.findUnique.mockResolvedValue({externalId:"evt_refund",paymentId:"pay_opaque",processed:true});
    expect((await webhook(refunded)).status).toBe(200);
    expect(db.bedReservation.delete).toHaveBeenCalledTimes(1);
  });

  it("no client component references the Stripe secret key",()=>{
    const walk=(dir:string):string[]=>readdirSync(dir).flatMap(f=>{
      const p=path.join(dir,f);
      return statSync(p).isDirectory() ? (f==="generated"?[]:walk(p)) : /\.tsx?$/.test(f)?[p]:[];
    });
    const leaks=walk(path.resolve("src")).filter(f=>{
      const s=readFileSync(f,"utf8");
      return /^["']use client["']/m.test(s) && /STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET/.test(s);
    });
    expect(leaks).toEqual([]);
  });
});
