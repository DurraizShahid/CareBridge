import { NextResponse } from "next/server";
import { contractContext } from "@/lib/contracts";
import { createDepositIntent, paymentForContract } from "@/lib/payments";
import { referralFailure, ReferralError } from "@/lib/referrals";

export async function GET(_req: Request, {params}: {params:Promise<{id:string}>}) {
  try {
    return NextResponse.json(await paymentForContract((await params).id), {
      headers: {"Cache-Control": "no-store"},
    });
  } catch (e) {
    const err=referralFailure(e);
    return NextResponse.json({error:err.error},{status:err.status});
  }
}
export async function POST(req: Request, {params}: {params:Promise<{id:string}>}) {
  try {
    const origin=req.headers.get("origin");
    if (origin && origin!==new URL(req.url).origin)
      throw new ReferralError(403,"Invalid request origin");
    const {id}=await params;
    const {ctx,contract}=await contractContext(id);
    if (ctx.type!=="hospital") throw new ReferralError(403,"Hospital access required");
    if (contract.status!=="signed" || contract.referral.status!=="accepted")
      throw new ReferralError(409,"Contract must be signed before checkout");
    const result=await createDepositIntent(
      contract.referralId,contract.depositAmountCents,contract.currency,
    );
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  } catch(e) {
    const err=referralFailure(e);
    return NextResponse.json({error:err.error},{status:err.status});
  }
}