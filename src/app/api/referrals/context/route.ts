import { NextResponse } from "next/server";
import { referralContext, referralFailure } from "@/lib/referrals";
export async function GET() {
 try { const ctx=await referralContext();return NextResponse.json({type:ctx.type},{headers:{"Cache-Control":"no-store"}}); }
 catch(e){ const err=referralFailure(e);return NextResponse.json({error:err.error},{status:err.status}); }
}