"use client";
import { DepositCheckout } from "@/components/payments/deposit-checkout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, FileText, LockKeyhole, Send, ShieldCheck } from "lucide-react";
type Detail = {
 id:string; referralId:string; status:"draft"|"sent"|"signed"; documentText:string|null;
 documentHash:string|null; myParty:"hospital"|"facility"; canPrepare:boolean;
 hospitalName:string; facilityName:string; currency:string; depositAmountCents:number;
 signatures:{party:"hospital"|"facility";typedName:string;signedAt:string;documentHash:string}[];
};
export function ContractView({id}:{id:string}){
 const [data,setData]=useState<Detail|null>(null);
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 const [deposit,setDeposit]=useState("0.00");const [terms,setTerms]=useState("");
 const [name,setName]=useState("");const [consent,setConsent]=useState(false);
 async function reload(){
  const r=await fetch("/api/contracts/"+encodeURIComponent(id),{cache:"no-store"});
  const x=await r.json();if(!r.ok)throw new Error(x.error||"Unable to read agreement");setData(x);
 }
 useEffect(()=>{void reload().catch(()=>setError("Contract unavailable"))},[id]);
 async function send(){
  if(!/^\d+(\.\d{1,2})?$/.test(deposit)){setError("Enter a valid USD deposit (up to two decimals)");return}
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/contracts/"+encodeURIComponent(id)+"/send",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({depositAmountCents:Math.round(Number(deposit)*100),facilityTerms:terms})});
   const x=await r.json();if(!r.ok)throw new Error(x.error||"Unable to send");await reload();
  }catch(e){setError(e instanceof Error?e.message:"Unable to send")}finally{setBusy(false)}
 }
 async function sign(){
  if(!consent){setError("Consent is required");return}
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/contracts/"+encodeURIComponent(id)+"/sign",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({typedName:name,consent:true})});
   const x=await r.json();if(!r.ok)throw new Error(x.error||"Unable to sign");
   setName("");setConsent(false);await reload();
  }catch(e){setError(e instanceof Error?e.message:"Unable to sign")}finally{setBusy(false)}
 }
 const mine=data?.signatures.find(s=>s.party===data.myParty);
 const field="mt-2 w-full rounded-2xl bg-[#F7F7F5] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#D9F477] dark:bg-white/10";
 return <main className="min-h-screen bg-[#F7F7F5] px-5 py-10 text-[#102B4E] dark:bg-[#0E0E10] dark:text-white md:px-10">
  <div className="mx-auto max-w-5xl">
   <Link href={data?"/referrals/"+data.referralId:"/referrals"} className="inline-flex items-center gap-2 text-sm text-[#74859A]"><ArrowLeft size={16}/> Back to referral</Link>
   <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
    <div><span className="rounded-full bg-[#EAF6C2] px-4 py-1.5 text-xs font-semibold text-[#344600]">{data?.status.toUpperCase()??"CONTRACT"}</span>
    <h1 className="mt-5 text-4xl font-semibold tracking-tight">Placement agreement</h1>
    <p className="mt-2 text-sm text-[#8291A4]">{data?data.hospitalName+" · "+data.facilityName:"Loading agreement..."}</p></div>
    <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs text-[#666] shadow-sm dark:bg-white/10"><LockKeyhole size={14}/> Immutable after sending</span>
   </div>
   {error&&<p role="alert" className="mt-6 text-sm font-semibold text-red-700">{error}</p>}
   {!data?<p className="mt-8 text-sm text-[#8291A4]">Loading document…</p>:<div className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
    <section className="rounded-[30px] bg-white p-7 shadow-[0_20px_60px_rgba(16,43,78,0.055)] dark:bg-[#1D1D20] md:p-9">
     <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold"><FileText size={18} className="text-[#255DCE]"/> Agreement document</h2>
     <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#444] dark:text-[#DDD]">{data.documentText}</pre>
     {data.documentHash&&<div className="mt-8 rounded-2xl bg-[#F7F7F5] p-4 text-xs text-[#74859A] dark:bg-white/5">
      <p className="mb-1 font-semibold">SHA-256 document fingerprint</p><code className="break-all font-mono">{data.documentHash}</code>
     </div>}
    </section>
    <aside className="space-y-5">
     <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(16,43,78,0.055)] dark:bg-[#1D1D20]">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#8291A4]">Signature progress</h2>
      {(["hospital","facility"] as const).map(p=>{
       const s=data.signatures.find(x=>x.party===p);
       return <div key={p} className="mt-5 flex items-start gap-3">
        <span className={"flex size-9 shrink-0 items-center justify-center rounded-full "+(s?"bg-[#EAF6C2] text-[#536F10]":"bg-[#F1F1EF] text-[#999]")}>
         {s?<CheckCircle2 size={18}/>:<ShieldCheck size={18}/>}</span>
        <div><p className="text-sm font-semibold capitalize">{p} signature</p>
        <p className="mt-1 text-xs leading-5 text-[#8291A4]">{s?"Signed by "+s.typedName+" · "+new Date(s.signedAt).toLocaleString():"Awaiting signature"}</p></div>
       </div>
      })}
      {data.status==="signed"&&<p className="mt-6 rounded-2xl bg-[#EAF6C2] p-4 text-sm font-semibold text-[#3E5904]">Both parties signed this exact document.</p>}
     </section>
     {data.canPrepare&&<section className="rounded-[28px] bg-white p-6 dark:bg-[#1D1D20]">
      <h2 className="text-lg font-semibold">Prepare & send</h2>
      <p className="mt-2 text-xs leading-5 text-[#8291A4]">This document is a draft. Sending locks your deposit and terms. Do not include patient names, MRNs, dates of birth, or diagnoses. Sign only after reviewing the sent version.</p>
      <label className="mt-5 block text-xs font-semibold text-[#74859A]">Deposit (USD)<input aria-label="Deposit in USD" inputMode="decimal" value={deposit} onChange={e=>setDeposit(e.target.value)} className={field}/></label>
      <label className="mt-4 block text-xs font-semibold text-[#74859A]">Facility terms<textarea value={terms} onChange={e=>setTerms(e.target.value)} maxLength={8000} rows={7}
       placeholder="Describe stay, services, refund and cancellation terms." className={field}/></label>
      <button type="button" onClick={()=>void send()} disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D9F477] px-5 py-3 text-sm font-semibold text-[#26390A] disabled:opacity-50"><Send size={16}/> Send for signatures</button>
     </section>}
     {data.status==="sent"&&!mine&&<section className="rounded-[28px] bg-white p-6 dark:bg-[#1D1D20]">
      <h2 className="text-lg font-semibold">Sign as {data.myParty}</h2>
      <p className="mt-2 text-xs leading-5 text-[#74859A]">Read the entire document and fingerprint. Your name, signing time, and hashed network address become audit evidence.</p>
      <label className="mt-5 block text-xs font-semibold text-[#74859A]">Full legal name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} maxLength={160}
       placeholder="First and last name" className={field}/></label>
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-xs leading-5 text-[#555] dark:text-[#DDD]">
       <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1 accent-[#819A28]"/>
       I have reviewed this exact document and intend my typed name to serve as my electronic signature on behalf of my organization.
      </label>
      <button type="button" onClick={()=>void sign()} disabled={busy||!consent||name.trim().length<3}
       className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#26390A] disabled:opacity-50"><ShieldCheck size={16}/> Sign document</button>
     </section>}
     {data.status==="signed"&&<DepositCheckout contractId={data.id}/>}
     {data.status==="sent"&&mine&&<div className="rounded-[28px] bg-white p-6 text-sm text-[#74859A] dark:bg-[#1D1D20]">Your signature is recorded. Waiting for the other party.</div>}
    </aside>
   </div>}
  </div>
 </main>;
}