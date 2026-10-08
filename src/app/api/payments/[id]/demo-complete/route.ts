import { NextResponse } from "next/server";
import { ReferralError, referralFailure } from "@/lib/referrals";
import { simulateDemoDeposit } from "@/lib/payments";
export async function POST(req: Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const origin=req.headers.get("origin");
    if(origin && origin!==new URL(req.url).origin)
      throw new ReferralError(403,"Invalid request origin");
    return NextResponse.json(await simulateDemoDeposit((await params).id),{
      headers:{"Cache-Control":"no-store"},
    });
  } catch(e) {
    const err=referralFailure(e);
    return NextResponse.json({error:err.error},{status:err.status});
  }
}