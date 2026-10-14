import { NextResponse } from "next/server";
import { getPaymentMode } from "@/lib/payment-mode";
import { stripeClient, processDepositFailed, processDepositRefunded, processDepositSuccess } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

/** Stripe webhook (test or live): raw bytes + verified Stripe signature. */
export async function POST(req: Request) {
  try {
    if(getPaymentMode()==="demo")
      return NextResponse.json({error:"Stripe webhook disabled in demo mode"},{status:403});
    const signature=req.headers.get("stripe-signature");
    if(!signature) return NextResponse.json({error:"Missing signature"},{status:400});
    const raw=await req.text();
    let event;
    try {
      event=stripeClient().webhooks.constructEvent(raw,signature,process.env.STRIPE_WEBHOOK_SECRET!);
    } catch {
      return NextResponse.json({error:"Invalid Stripe signature"},{status:400});
    }
    if(event.type==="charge.refunded") {
      const charge=event.data.object;
      const intentId=typeof charge.payment_intent==="string"?charge.payment_intent:charge.payment_intent?.id;
      // ponytail: partial refunds are acknowledged but not modeled; the bed stays reserved.
      if(!intentId || !charge.refunded) return NextResponse.json({received:true});
      await processDepositRefunded(event.id,intentId,charge.refunds?.data[0]?.id??null);
      return NextResponse.json({received:true});
    }
    if(event.type!=="payment_intent.succeeded" && event.type!=="payment_intent.payment_failed")
      return NextResponse.json({received:true});
    const intent=event.data.object;
    const paymentId=intent.metadata?.paymentId;
    if(!paymentId || !intent.id) return NextResponse.json({error:"Missing payment reference"},{status:400});
    const payment=await prisma.payment.findUnique({where:{id:paymentId},
      select:{amountCents:true,currency:true,stripePaymentIntentId:true,isDemo:true}});
    if(!payment || payment.isDemo || payment.stripePaymentIntentId!==intent.id ||
      payment.amountCents!==intent.amount || payment.currency!==intent.currency)
      return NextResponse.json({error:"Payment reference mismatch"},{status:409});
    if(event.type==="payment_intent.succeeded") {
      await processDepositSuccess({externalId:event.id,paymentId,paymentIntentId:intent.id,isDemo:false});
    } else {
      await processDepositFailed(event.id,paymentId,intent.id);
    }
    return NextResponse.json({received:true});
  } catch {
    // 500 invites Stripe webhook retry. Do not log webhook bodies or patient data.
    return NextResponse.json({error:"Payment processing failed; retry required"},{status:500});
  }
}
