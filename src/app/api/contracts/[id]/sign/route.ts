import { NextResponse } from "next/server";
import { signContract } from "@/lib/contracts";
import { referralFailure } from "@/lib/referrals";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin)
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const body: unknown = await req.json();
    const typedName = body && typeof body === "object" && "typedName" in body
      ? (body as { typedName: unknown }).typedName : null;
    // x-forwarded-for MUST be set/overwritten by a trusted reverse proxy.
    // Never store the raw IP; only a secret-peppered hash leaves this handler.
    const consented = Boolean(body && typeof body === "object" && "consent" in body && (body as { consent: unknown }).consent === true);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip") ?? "unavailable";
    return NextResponse.json(await signContract((await params).id, typedName, ip, consented), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    const err = referralFailure(e);
    return NextResponse.json({ error: err.error }, { status: err.status });
  }
}