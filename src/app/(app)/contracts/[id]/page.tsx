import { redirect } from "next/navigation";
import { contractContext } from "@/lib/contracts";
import { ContractView } from "@/components/contracts/contract-view";
export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const allowed = await contractContext(id).then(() => true).catch(() => false);
  if (!allowed) redirect("/referrals");
  return <ContractView id={id} />;
}