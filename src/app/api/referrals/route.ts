import { NextResponse } from "next/server";
import { createReferral, listReferrals, referralFailure } from "@/lib/referrals";
export async function GET() {
  try { return NextResponse.json(await listReferrals(), { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { const err = referralFailure(e); return NextResponse.json({ error: err.error }, { status: err.status }); }
}
export async function POST(req: Request) {
  try { return NextResponse.json(await createReferral(await req.json()), { status: 201 }); }
  catch (e) { const err = referralFailure(e); return NextResponse.json({ error: err.error }, { status: err.status }); }
}