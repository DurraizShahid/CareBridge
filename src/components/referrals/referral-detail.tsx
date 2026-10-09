"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Send } from "lucide-react";
type Detail={ id:string; patientName:string; patientDateOfBirth:string; patientMrn:string; careLevel:string;
 requiredServices:string[]; status:string; sentAt:string|null; convertedPlacementId:string|null;
 facility:{name:string}; sendingOrganization:{name:string} };
const label=(s:string)=>s.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
export function ReferralDetail({id}:{id:string}) {
 const router=useRouter();
 const [data,setData]=useState<Detail|null>(null);
 const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 const [facilityView,setFacilityView]=useState(false);
 const [contractLink,setContractLink]=useState<string|null>(null);
 const [paymentStatus,setPaymentStatus]=useState<string|null>(null);
 useEffect(()=>{
  Promise.all([fetch("/api/referrals/"+encodeURIComponent(id),{cache:"no-store"}),fetch("/api/referrals/context",{cache:"no-store"})])
   .then(async ([r,c])=>{if(!r.ok||!c.ok)throw new Error("Unable to load referral");return [await r.json(),await c.json()]})
   .then(([r,c])=>{setData(r);setFacilityView(c.type==="facility")})
   .catch(()=>setError("Referral unavailable."));
 },[id]);
 useEffect(()=>{
  fetch("/api/referrals/"+encodeURIComponent(id)+"/contract",{cache:"no-store"})
    .then(r=>r.ok?r.json():null).then(c=>setContractLink(c?.id??null)).catch(()=>{});
 },[id,data?.status]);
 useEffect(()=>{
  if(!contractLink){setPaymentStatus(null);return}
  let active=true;
  fetch("/api/contracts/"+encodeURIComponent(contractLink)+"/payment",{cache:"no-store"})
   .then(r=>r.ok?r.json():null)
   .then(value=>{if(active)setPaymentStatus(value?.payment?.status??null)})
   .catch(()=>{if(active)setPaymentStatus(null)});
  return ()=>{active=false};
 },[contractLink,data?.status]);
 async function convert(){
  setBusy(true);setError("");
  try{
   const result=await fetch("/api/referrals/"+encodeURIComponent(id)+"/convert",{method:"POST"});
   const body=await result.json();
   if(!result.ok)throw new Error(body.error??"Conversion failed");
   setData(old=>old?{...old,status:"converted",convertedPlacementId:body.placementId}:old);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Conversion failed")}finally{setBusy(false)}
 }
 async function action(status:"sent"|"accepted"|"declined") {
  setBusy(true);setError("");
  try {
   const r=await fetch("/api/referrals/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
   const value=await r.json();if(!r.ok)throw new Error(value.error||"Action failed");
   setData(old=>old?{...old,status}:old);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Action failed")}finally{setBusy(false)}
 }
 return <main className="min-h-screen bg-[#F7F7F5] px-5 py-10 text-[#102B4E] dark:bg-[#0E0E10] dark:text-white md:px-10">
 <div className="mx-auto max-w-4xl"><Link href="/referrals" className="inline-flex items-center gap-2 text-sm text-[#8291A4]"><ArrowLeft size={16}/> All referrals</Link>
 {error&&<p role="alert" className="mt-6 text-sm text-red-700">{error}</p>}
 {!data?<p className="mt-8 text-sm text-[#8291A4]">Loading referral...</p>:
 <>
 <div className="mt-8"><span className="rounded-full bg-[#EAF6C2] px-4 py-1.5 text-xs font-semibold text-[#344600]">{label(data.status)}</span>
 <h1 className="mt-5 text-4xl font-semibold tracking-tight">Referral details</h1>
 <p className="mt-2 text-sm text-[#8291A4]">{data.sendingOrganization.name} → {data.facility.name}</p></div>
 <section className="mt-8 rounded-[30px] bg-white p-7 shadow-[0_20px_60px_rgba(16,43,78,0.055)] dark:bg-[#1D1D20]">
  <h2 className="text-lg font-semibold">Patient & care requirements</h2>
  <dl className="mt-6 grid gap-6 sm:grid-cols-2">
   {[["Patient",data.patientName],["MRN",data.patientMrn],["Date of birth",data.patientDateOfBirth.slice(0,10)],
    ["Care level",label(data.careLevel)],["Required services",data.requiredServices.join(", ")||"None specified"],["Status",label(data.status)]]
    .map(([key,value])=><div key={key}><dt className="text-xs text-[#898989]">{key}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}
  </dl>
 </section>
 <div className="mt-6 flex flex-wrap gap-3">
  {facilityView&&data.status==="sent"&&<>
   <button disabled={busy} onClick={()=>void action("accepted")} className="inline-flex items-center gap-2 rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#263000] disabled:opacity-50"><Check size={16}/> Accept referral</button>
   <button disabled={busy} onClick={()=>void action("declined")} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#555] disabled:opacity-50 dark:bg-white/10 dark:text-white"><X size={16}/> Decline</button>
  </>}
  {!facilityView&&data.status==="draft"&&<button disabled={busy} onClick={()=>void action("sent")} className="inline-flex items-center gap-2 rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#263000] disabled:opacity-50"><Send size={16}/> Send to facility</button>}
  {contractLink&&<Link href={"/contracts/"+contractLink} className="inline-flex items-center rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#26390A]">View placement agreement</Link>}
  {facilityView&&data.status==="accepted"&&(paymentStatus==="paid"||paymentStatus==="demo_paid")&&<button type="button" disabled={busy} onClick={()=>void convert()} className="inline-flex items-center gap-2 rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#26390A] shadow-sm transition-colors hover:bg-[#CBEC60] disabled:opacity-50"><Check size={16}/>{busy?"Converting…":"Convert to placement"}</button>}
  {facilityView&&data.status==="accepted"&&paymentStatus!=="paid"&&paymentStatus!=="demo_paid"&&contractLink&&<p className="text-sm text-[#74859A]">Placement conversion unlocks after both signatures and deposit confirmation.</p>}
  {data.status==="converted"&&data.convertedPlacementId&&<p className="rounded-full bg-[#ECF7D2] px-5 py-3 text-sm font-semibold text-[#425F15]">Placement confirmed · Ref {data.convertedPlacementId.slice(0,8)}</p>}
  {data.status==="converted"&&!facilityView&&data.convertedPlacementId&&<Link href={"/placements/"+data.convertedPlacementId} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#444]">Open placement</Link>}
  {data.status==="accepted"&&!contractLink&&<p className="text-sm text-[#668035]">Accepted. Preparing agreement…</p>}
 </div>
 </>}
 </div></main>;
}