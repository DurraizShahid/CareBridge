"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";

const CARE_LEVELS = ["independent_living","assisted_living","skilled_nursing","long_term_care","rehabilitation","home_health","hospice","memory_care"];
const label = (v:string) => v.replaceAll("_"," ").replace(/\b\w/g,c => c.toUpperCase());
type Candidate = { id: string; name: string; availableBeds: number; specialties: string[] };

export function NewReferralForm() {
 const router = useRouter();
 const [patientName, setPatientName] = useState("");
 const [patientMrn, setPatientMrn] = useState("");
 const [dob, setDob] = useState("");
 const [careLevel, setCareLevel] = useState("skilled_nursing");
 const [serviceText, setServiceText] = useState("");
 const [facilityId, setFacilityId] = useState("");
 const [candidates, setCandidates] = useState<Candidate[]>([]);
 const [busy, setBusy] = useState(false);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const services = serviceText.split(",").map(x => x.trim()).filter(Boolean);
 useEffect(() => {
  let active = true;
  const query = new URLSearchParams({ careLevel });
  for(const service of services) query.append("service", service);
  fetch("/api/referrals/facilities?" + query.toString(), { cache: "no-store" })
   .then(async r => { if(!r.ok) throw new Error("Unable to match facilities"); return r.json(); })
   .then((data: Candidate[]) => {if(active) {setCandidates(data); setFacilityId(old => data.some(x=>x.id===old) ? old : ""); setError("");}})
   .catch(() => { if(active) {setCandidates([]);setError("Facility matching is unavailable.");} })
   .finally(() => {if(active)setLoading(false);});
  return () => {active=false;};
 // Re-evaluate only when eligibility requirements change.
 }, [careLevel, serviceText]);
 async function submit(status: "draft" | "sent") {
  setBusy(true); setError("");
  try {
   const res = await fetch("/api/referrals", {method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({patientName,patientMrn,patientDateOfBirth:dob,careLevel,requiredServices:services,facilityId,status})});
   const data = await res.json();
   if(!res.ok) throw new Error(data.error || "Unable to create referral");
   router.push("/referrals/" + data.id);
  } catch(e) {setError(e instanceof Error ? e.message : "Unable to create referral");setBusy(false);}
 }
 const field = "w-full rounded-2xl bg-[#F5F5F2] px-4 py-3 text-sm outline-none ring-0 focus:ring-2 focus:ring-[#CBE56A] dark:bg-white/10";
 return (
  <main className="min-h-screen bg-[#F7F7F5] px-5 py-10 text-[#1A1A1A] dark:bg-[#0E0E10] dark:text-white md:px-10">
  <div className="mx-auto max-w-4xl">
   <Link href="/referrals" className="inline-flex items-center gap-2 text-sm text-[#777] hover:text-black"><ArrowLeft size={16}/> Back to referrals</Link>
   <div className="mt-8"><span className="rounded-full bg-[#EAF6C2] px-4 py-1.5 text-xs font-semibold text-[#354500]">NEW REFERRAL</span>
    <h1 className="mt-5 text-4xl font-semibold tracking-tight">Find the right next step.</h1>
    <p className="mt-2 text-sm text-[#777]">Enter only the information needed to request care-home placement.</p>
   </div>
   <form onSubmit={e => {e.preventDefault();void submit("sent");}} className="mt-8 space-y-6">
    <section className="rounded-[30px] bg-white p-7 shadow-[0_15px_45px_rgba(0,0,0,0.035)] dark:bg-[#1D1D20]">
     <h2 className="mb-5 text-lg font-semibold">01 · Patient essentials</h2>
     <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-xs font-medium text-[#777]">Patient full name <input required maxLength={160} value={patientName} onChange={e=>setPatientName(e.target.value)} className={field} placeholder="Full name" autoComplete="off"/></label>
      <label className="space-y-2 text-xs font-medium text-[#777]">Medical record number <input required maxLength={80} value={patientMrn} onChange={e=>setPatientMrn(e.target.value)} className={field} placeholder="MRN" autoComplete="off"/></label>
      <label className="space-y-2 text-xs font-medium text-[#777]">Date of birth <input required type="date" value={dob} onChange={e=>setDob(e.target.value)} max={new Date().toISOString().slice(0,10)} className={field}/></label>
      <label className="space-y-2 text-xs font-medium text-[#777]">Care level <select value={careLevel} onChange={e=>setCareLevel(e.target.value)} className={field}>{CARE_LEVELS.map(level=><option key={level} value={level}>{label(level)}</option>)}</select></label>
     </div>
     <label className="mt-5 block space-y-2 text-xs font-medium text-[#777]">Required services <span className="font-normal">(comma-separated; only if needed)</span><input value={serviceText} onChange={e=>setServiceText(e.target.value)} className={field} placeholder="e.g. physical therapy, wound care" maxLength={400}/></label>
    </section>
    <section className="rounded-[30px] bg-white p-7 shadow-[0_15px_45px_rgba(0,0,0,0.035)] dark:bg-[#1D1D20]">
     <h2 className="mb-2 text-lg font-semibold">02 · Matched facilities</h2><p className="mb-5 text-sm text-[#888]">Candidates support the care level, required specialties, and have an open bed.</p>
     {loading ? <p className="text-sm text-[#777]">Checking facility availability...</p> :
      candidates.length===0 ? <p className="rounded-2xl bg-[#F7F7F5] p-5 text-sm text-[#777]">No eligible facilities are available. Adjust care needs or check facility profiles.</p>
      :<div className="space-y-3">{candidates.map(c=><label key={c.id} className={"flex cursor-pointer items-center gap-4 rounded-[20px] p-4 transition-colors " + (facilityId===c.id ? "bg-[#EFF8CE]" : "bg-[#F7F7F5] hover:bg-[#F1F4E8]")}>
        <input type="radio" name="facilityId" checked={facilityId===c.id} onChange={()=>setFacilityId(c.id)} className="accent-[#758F22]"/>
        <Building2 className="text-[#728159]" size={22}/><span className="flex-1 font-semibold text-[#232323]">{c.name}</span><span className="rounded-full bg-white px-3 py-1 text-xs text-[#4B6136]">{c.availableBeds} beds</span>
       </label>)}</div>}
    </section>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap justify-end gap-3">
     <button type="button" disabled={busy || !facilityId} onClick={()=>void submit("draft")} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#333] disabled:opacity-50 dark:bg-white/10 dark:text-white">Save draft</button>
     <button type="submit" disabled={busy || !facilityId} className="inline-flex items-center gap-2 rounded-full bg-[#D9F477] px-7 py-3 text-sm font-semibold text-[#1D2606] shadow-sm disabled:opacity-50">{busy ? "Saving..." : "Send referral"} <ArrowRight size={17}/></button>
    </div>
   </form>
  </div>
  </main>
 );
}