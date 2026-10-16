import { NextResponse } from "next/server";
import { createReferral, listReferrals, referralFailure } from "@/lib/referrals";
import type { ReferralStatus } from "@/generated/prisma/client";
export async function GET(req?: Request) {
  try {
    const url = req?.url ? new URL(req.url) : null;
    const status = (url?.searchParams.get("status") ?? undefined) as ReferralStatus | undefined;
    const cursor = url?.searchParams.get("cursor") ?? undefined;
    const takeParam = url?.searchParams.get("take");
    const take = takeParam ? Number.parseInt(takeParam, 10) : undefined;
    const startDate = url?.searchParams.get("startDate") ?? url?.searchParams.get("from") ?? undefined;
    const endDate = url?.searchParams.get("endDate") ?? url?.searchParams.get("to") ?? undefined;
    const patient = url?.searchParams.get("patient") ?? url?.searchParams.get("patientMrn") ?? undefined;
    const facility = url?.searchParams.get("facility") ?? url?.searchParams.get("facilityId") ?? undefined;

    return NextResponse.json(
      await listReferrals({
        status,
        cursor,
        take: take && !Number.isNaN(take) ? take : undefined,
        startDate,
        endDate,
        patient,
        facility,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) { const err = referralFailure(e); return NextResponse.json({ error: err.error }, { status: err.status }); }
}
export async function POST(req: Request) {
  try { return NextResponse.json(await createReferral(await req.json()), { status: 201 }); }
  catch (e) { const err = referralFailure(e); return NextResponse.json({ error: err.error }, { status: err.status }); }
}