import { redirect } from "next/navigation";
import { getReferral } from "@/lib/referrals";
import { ReferralDetail } from "@/components/referrals/referral-detail";
export default async function ReferralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const referral = await getReferral(id).catch(() => null);
  if (!referral) redirect("/referrals");
  return <ReferralDetail id={id} />;
}