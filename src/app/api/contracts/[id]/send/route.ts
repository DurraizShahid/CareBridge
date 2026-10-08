import { NextResponse } from "next/server";
import { sendContract } from "@/lib/contracts";
import { referralFailure } from "@/lib/referrals";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin)
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const body: unknown = await req.json();
    return NextResponse.json(await sendContract((await params).id, body), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    const err = referralFailure(e);
    return NextResponse.json({ error: err.error }, { status: err.status });
  }
}