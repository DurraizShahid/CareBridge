"use client";
import {useEffect,useMemo,useState} from "react";
import {Elements,PaymentElement,useElements,useStripe} from "@stripe/react-stripe-js";
import {loadStripe} from "@stripe/stripe-js";
import {CheckCircle2,ShieldCheck,RefreshCcw} from "lucide-react";

type PaymentStatus="pending"|"paid"|"demo_paid"|"failed"|"refund_pending"|"refunded"|"demo_refunded";
type PaymentRow={id:string;amountCents:number;currency:string;status:PaymentStatus;isDemo:boolean;failureReason:string|null};
type Current={contract:{id:string;status:string;depositAmountCents:number;currency:string};
  payment:PaymentRow|null;mode:"demo"|"test"|"live";canPay:boolean};
type Intent={paymentId:string;clientSecret:string;isDemo:boolean;amountMinor:number;currency:string;mode:string};

function CardPayment({after}:{after:()=>Promise<void>}) {
 const stripe=useStripe(), elements=useElements();
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function submit(e:React.FormEvent){
  e.preventDefault();if(!stripe||!elements)return;
  setBusy(true);setMessage("");
  try{
   const result=await stripe.confirmPayment({
    elements,confirmParams:{return_url:window.location.href},redirect:"if_required",
   });
   if(result.error) setMessage(result.error.message??"Payment failed");
   else {
    setMessage("Stripe payment submitted. Waiting for signed webhook confirmation.");
    await after();
   }
  }catch{setMessage("Unable to confirm payment")}finally{setBusy(false)}
 }
 return <form onSubmit={submit} className="mt-5 space-y-4">
  <PaymentElement/>
  {message&&<p role="status" className="text-xs text-[#74859A]">{message}</p>}
  <button type="submit" disabled={!stripe||!elements||busy} className="w-full rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#26390A] disabled:opacity-50">
   {busy?"Processing…":"Pay securely with Stripe"}
  </button>
 </form>;
}
const amount=(minor:number,currency:string)=>new Intl.NumberFormat("en-US",{style:"currency",currency:currency.toUpperCase()}).format(minor/100);

export function DepositCheckout({contractId}:{contractId:string}){
 const [current,setCurrent]=useState<Current|null>(null);
 const [intent,setIntent]=useState<Intent|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const publishable=process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
 const stripe=useMemo(()=>(current?.mode==="test"||current?.mode==="live") && (publishable?.startsWith("pk_test_")||publishable?.startsWith("pk_live_")) ? loadStripe(publishable) : null,[publishable,current?.mode]);
 async function refresh(){
  const r=await fetch("/api/contracts/"+encodeURIComponent(contractId)+"/payment",{cache:"no-store"});
  const body=await r.json();
  if(!r.ok)throw new Error(body.error??"Unable to retrieve deposit status");
  setCurrent(body);
 }
 useEffect(()=>{void refresh().catch(()=>setError("Deposit status unavailable"))},[contractId]);
 async function start(){
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/contracts/"+encodeURIComponent(contractId)+"/payment",{method:"POST"});
   const body=await r.json();if(!r.ok)throw new Error(body.error??"Unable to create deposit");
   setIntent(body);await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Checkout unavailable")}finally{setBusy(false)}
 }
 async function demoFinish(){
  if(!intent)return;setBusy(true);setError("");
  try{
   const r=await fetch("/api/payments/"+encodeURIComponent(intent.paymentId)+"/demo-complete",{method:"POST"});
   const body=await r.json();if(!r.ok)throw new Error(body.error??"Simulation failed");
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Simulation failed")}finally{setBusy(false)}
 }
 if(!current)return <section className="rounded-[28px] bg-white p-6 text-sm text-[#74859A] dark:bg-[#1D1D20]">Loading deposit…</section>;
 const isDemo=current.mode==="demo";
 const status=current.payment?.status;
 const complete=status==="paid"||status==="demo_paid";
 const reversed=status==="refunded"||status==="demo_refunded"||status==="refund_pending";
 return <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(16,43,78,0.055)] dark:bg-[#1D1D20]">
  <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-[#255DCE]"/><h2 className="text-lg font-semibold">Placement deposit</h2></div>
  {isDemo&&<div role="status" className="mt-4 rounded-2xl bg-[#FFF3D6] p-4 text-sm font-semibold leading-6 text-[#79541B]">
   DEMO MODE — add your Stripe keys to accept real payments. No money will be charged.
  </div>}
  {current.mode==="test"&&<p className="mt-3 text-xs font-semibold text-[#668141]">STRIPE TEST MODE — no real charges</p>}
  <p className="mt-5 text-3xl font-semibold tabular-nums">{amount(current.contract.depositAmountCents,current.contract.currency)}</p>
  <p className="mt-2 text-xs leading-5 text-[#828282]">Deposit for the signed care-facility placement agreement. A bed is reserved only after payment succeeds and capacity is reconfirmed.</p>
  {complete&&<div className="mt-5 rounded-2xl bg-[#EDF9D9] p-4 text-sm font-semibold text-[#476514]"><CheckCircle2 size={17} className="mr-2 inline"/>Payment confirmed. Bed reserved.{isDemo?" (Demo only)":""}</div>}
  {reversed&&<div role="alert" className="mt-5 rounded-2xl bg-[#FFF0E9] p-4 text-sm text-[#8A4C30]">Capacity is no longer available. {status==="refund_pending"?"Refund being processed.":"Deposit refunded."} Contact the referring hospital to select another facility.</div>}
  {status==="failed"&&<p role="alert" className="mt-4 text-sm text-red-700">Payment failed. You can retry with a new intent.</p>}
  {status==="failed"&&current.canPay&&<button type="button" disabled={busy} onClick={()=>void start()} className="mt-4 w-full rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#26390A] disabled:opacity-50">Retry deposit</button>}
  {error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
  {!current.canPay&&!complete&&<p className="mt-5 text-sm text-[#8291A4]">The sending hospital will arrange this deposit.</p>}
  {current.canPay&&!complete&&!reversed&&status!=="failed"&&<>
    {!intent&&!status&&<button type="button" disabled={busy} onClick={()=>void start()} className="mt-5 w-full rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#26390A] disabled:opacity-50">{busy?"Preparing…":"Continue to deposit"}</button>}
    {!intent&&status==="pending"&&<button type="button" disabled={busy} onClick={()=>void start()} className="mt-5 w-full rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#26390A] disabled:opacity-50">Resume checkout</button>}
    {intent?.isDemo&&<button type="button" disabled={busy} onClick={()=>void demoFinish()} className="mt-5 w-full rounded-full bg-[#D9F477] px-6 py-3 text-sm font-semibold text-[#26390A] disabled:opacity-50">{busy?"Simulating…":"Simulate successful payment"}</button>}
    {intent&&!intent.isDemo&&stripe&&<Elements stripe={stripe} options={{clientSecret:intent.clientSecret,appearance:{theme:"stripe",variables:{borderRadius:"16px"}}}}><CardPayment after={refresh}/></Elements>}
    {intent&&!intent.isDemo&&!stripe&&<p className="mt-4 text-sm text-red-700">Missing Stripe publishable test key.</p>}
  </>}
  <button type="button" onClick={()=>void refresh().catch(()=>setError("Unable to refresh status"))} className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-[#8291A4]"><RefreshCcw size={14}/> Refresh status</button>
 </section>;
}