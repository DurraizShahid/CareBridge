import { NextResponse } from "next/server";
import { getReferral, transitionReferral, referralFailure } from "@/lib/referrals";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json(await getReferral((await params).id), { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { const err = referralFailure(e); return NextResponse.json({ error: err.error }, { status: err.status }); }
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload: unknown = await req.json();
    if (!payload || typeof payload !== "object" || !("status" in payload))
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    const status = (payload as { status: unknown }).status;
    if (status !== "sent" && status !== "accepted" && status !== "declined")
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
    return NextResponse.json(await transitionReferral((await params).id, status));
  } catch (e) { const err = referralFailure(e); return NextResponse.json({ error: err.error }, { status: err.status }); }
}