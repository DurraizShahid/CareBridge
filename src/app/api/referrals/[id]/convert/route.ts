import { NextResponse } from "next/server";
import { convertPaidReferral } from "@/lib/referral-conversion";
import { ReferralError, referralFailure } from "@/lib/referrals";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) throw new ReferralError(403, "Invalid request origin");
    return NextResponse.json(await convertPaidReferral((await params).id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const { error: message, status } = referralFailure(error);
    return NextResponse.json({ error: message }, { status });
  }
}