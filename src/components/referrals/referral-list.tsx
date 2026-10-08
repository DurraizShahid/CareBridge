"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, ClipboardList, Plus } from "lucide-react";

type Row = {
 id: string; patientName: string; careLevel: string; status: string; createdAt: string;
 facility: { name: string }; sendingOrganization: { name: string };
};
const label = (s: string) => s.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

export function ReferralList({ facilityView }: { facilityView: boolean }) {
 const [rows, setRows] = useState<Row[]>([]);
 const [busy, setBusy] = useState(true);
 const [error, setError] = useState("");
 useEffect(() => {
   fetch("/api/referrals", { cache: "no-store" })
     .then(async r => { if (!r.ok) throw new Error("Unable to load referrals"); return r.json(); })
     .then((data: Row[]) => setRows(data))
     .catch(() => setError("Referrals could not be loaded. Please retry."))
     .finally(() => setBusy(false));
 }, []);
 return (
  <main className="min-h-screen bg-[#F7F7F5] px-5 py-10 text-[#1A1A1A] dark:bg-[#0E0E10] dark:text-white md:px-10">
   <div className="mx-auto max-w-6xl">
    <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
     <div><span className="rounded-full bg-[#EAF6C2] px-4 py-1.5 text-xs font-semibold text-[#334400]">{facilityView ? "FACILITY INBOX" : "HOSPITAL REFERRALS"}</span>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight">{facilityView ? "Incoming referrals" : "Your referrals"}</h1>
      <p className="mt-2 text-sm text-[#767676]">{facilityView ? "Review placements requested by hospitals." : "Track requests and care-home responses in one place."}</p>
     </div>
     {!facilityView && <Link href="/referrals/new" className="inline-flex items-center gap-2 rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#222] shadow-sm hover:bg-[#CCEB5C]"><Plus size={17}/> New referral</Link>}
    </div>
    {error && <p role="alert" className="mb-6 text-sm text-red-700">{error}</p>}
    <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_50px_rgba(0,0,0,0.035)] dark:bg-[#1D1D20]">
     {busy ? <p className="p-10 text-[#888]">Loading referrals...</p> :
      rows.length === 0 ? <div className="flex flex-col items-center gap-3 p-16 text-center"><ClipboardList className="text-[#9B9B9B]" size={32}/><h2 className="font-semibold">No referrals yet</h2><p className="text-sm text-[#888]">{facilityView ? "New hospital requests will appear here." : "Create your first referral to get started."}</p></div>
      : rows.map((row, index) =>
       <Link key={row.id} href={"/referrals/" + row.id} className={"flex flex-wrap items-center gap-4 p-6 transition-colors hover:bg-[#F8FAF2] dark:hover:bg-white/5 " + (index > 0 ? "border-t border-black/5 dark:border-white/5" : "")}>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#F1F3EB] text-[#777]"><ClipboardList size={19}/></span>
        <div className="min-w-0 flex-1"><p className="font-semibold">{row.patientName}</p><p className="mt-1 text-xs text-[#828282]">{facilityView ? row.sendingOrganization.name : row.facility.name} · {label(row.careLevel)}</p></div>
        <span className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (row.status === "accepted" ? "bg-[#EAF6C2] text-[#345000]" : "bg-[#F1F1EF] text-[#696969]")}>{label(row.status)}</span>
        <span className="text-xs text-[#999]">{new Date(row.createdAt).toLocaleDateString()}</span>
        <ArrowUpRight size={18} className="text-[#777]"/>
       </Link>)
     }
    </div>
   </div>
  </main>
 );
}