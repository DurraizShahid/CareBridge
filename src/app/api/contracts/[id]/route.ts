import { NextResponse } from "next/server";
import { getContract } from "@/lib/contracts";
import { referralFailure } from "@/lib/referrals";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await getContract((await params).id), {
      headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
    });
  } catch (e) {
    const err = referralFailure(e);
    return NextResponse.json({ error: err.error }, { status: err.status });
  }
}