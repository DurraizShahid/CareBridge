import { redirect } from "next/navigation";
import { referralContext } from "@/lib/referrals";
import { ReferralList } from "@/components/referrals/referral-list";
export default async function ReferralsPage() {
  const ctx = await referralContext().catch(() => null);
  if (!ctx) redirect("/onboarding");
  return <ReferralList facilityView={ctx.type === "facility"} />;
}