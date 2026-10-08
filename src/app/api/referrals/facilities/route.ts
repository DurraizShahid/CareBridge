import { NextResponse } from "next/server";
import { listReferralCandidates, careLevels, referralFailure } from "@/lib/referrals";
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const level = url.searchParams.get("careLevel") ?? "";
    if (!careLevels.includes(level as typeof careLevels[number]))
      return NextResponse.json({ error: "Invalid care level" }, { status: 400 });
    const services = url.searchParams.getAll("service").map(s => s.trim()).filter(Boolean);
    if (services.length > 20 || services.some(s => s.length > 100))
      return NextResponse.json({ error: "Invalid services" }, { status: 400 });
    return NextResponse.json(
      await listReferralCandidates(level as typeof careLevels[number], services),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) { const err = referralFailure(e); return NextResponse.json({ error: err.error }, { status: err.status }); }
}