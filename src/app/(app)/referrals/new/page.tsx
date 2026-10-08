import { redirect } from "next/navigation";
import { referralContext } from "@/lib/referrals";
import { NewReferralForm } from "@/components/referrals/new-referral-form";
export default async function NewReferralPage() {
  const ctx = await referralContext().catch(() => null);
  if (!ctx) redirect("/onboarding");
  if (ctx.type !== "hospital") redirect("/referrals");
  return <NewReferralForm />;
}