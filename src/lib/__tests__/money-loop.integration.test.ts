import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";



const authState = vi.hoisted(() => ({ type: "hospital" as "hospital"|"facility"|"none" }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server-organization", () => ({
  getServerOrganization: async () => authState.type === "none" ? null :
    authState.type === "hospital"
    ? {organizationId:"verify-hospital-org",userId:"verify-hospital-user",role:"social-worker"}
    : {organizationId:"verify-facility-org",userId:"verify-facility-user",role:"facility-coordinator"},
}));

import { POST as postReferral, GET as listReferral } from "@/app/api/referrals/route";
import { PATCH as patchReferral } from "@/app/api/referrals/[id]/route";
import { GET as getReferralContract } from "@/app/api/referrals/[id]/contract/route";

import { POST as sendContract } from "@/app/api/contracts/[id]/send/route";
import { POST as signContract } from "@/app/api/contracts/[id]/sign/route";
import { POST as startPayment } from "@/app/api/contracts/[id]/payment/route";
import { POST as finishDemoPayment } from "@/app/api/payments/[id]/demo-complete/route";
import { POST as convertReferral } from "@/app/api/referrals/[id]/convert/route";
import { documentSha256 } from "@/lib/esign/document";
import { getPaymentMode } from "@/lib/payment-mode";
import { prisma } from "@/lib/prisma";

const run = process.env.CAREBRIDGE_LOCAL_E2E === "1";
const params=(id:string)=>({params:Promise.resolve({id})});
const body=(url:string,value:unknown)=>new Request("http://localhost:3000"+url,{
  method:"POST", headers:{"Content-Type":"application/json","Origin":"http://localhost:3000"},
  body:JSON.stringify(value),
});
const empty=(url:string)=>new Request("http://localhost:3000"+url,{method:"POST",headers:{"Origin":"http://localhost:3000"}});
const patch=(id:string,status:string)=>new Request("http://localhost:3000/api/referrals/"+id,{
  method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status}),
});
async function check<T=any>(response:Response,status=200):Promise<T>{
 const value=await response.json();
 expect(response.status,JSON.stringify(value)).toBe(status);
 return value;
}
const switchTo=(value:"hospital"|"facility"|"none")=>{authState.type=value};
async function makeReferral(facilityId:string,mrn:string){
 switchTo("hospital");
 const ref=await check<{id:string;status:string}>(await postReferral(body("/api/referrals",{
  patientName:"Synthetic Verification Patient",patientMrn:mrn,
  patientDateOfBirth:"1960-01-02",careLevel:"skilled_nursing",
  requiredServices:["Therapy"],facilityId,status:"sent",
 })),201);
 expect((await prisma.referral.findUniqueOrThrow({where:{id:ref.id}})).status).toBe("sent");
 switchTo("facility");
 await check(await patchReferral(patch(ref.id,"accepted"),params(ref.id)));
 const contract=await prisma.contract.findUniqueOrThrow({where:{referralId:ref.id}});
 expect(contract.status).toBe("draft");
 expect(contract.documentText).not.toContain(mrn);
 return {refId:ref.id,contractId:contract.id};
}
async function finishAgreement(contractId:string){
 switchTo("hospital");
 await check(await sendContract(body("/api/contracts/"+contractId+"/send",{
  depositAmountCents:5000,facilityTerms:"Verification care stay terms and approved refundable deposit.",
 }),params(contractId)));
 let contract=await prisma.contract.findUniqueOrThrow({where:{id:contractId}});
 expect(contract.status).toBe("sent");
 expect(documentSha256(contract.documentText!)).toBe(contract.documentHash);
 const h=await check(await signContract(body("/api/contracts/"+contractId+"/sign",{
  typedName:"Verification Hospital",consent:true,
 }),params(contractId)));
 expect(h.status).toBe("sent");
 expect((await prisma.contractSignature.count({where:{contractId}}))).toBe(1);
 switchTo("facility");
 const f=await check(await signContract(body("/api/contracts/"+contractId+"/sign",{
  typedName:"Verification Facility",consent:true,
 }),params(contractId)));
 expect(f.status).toBe("signed");
 contract=await prisma.contract.findUniqueOrThrow({where:{id:contractId}});
 expect(contract.status).toBe("signed");
 expect((await prisma.contractSignature.count({where:{contractId}}))).toBe(2);
 switchTo("hospital");
 const intent=await check<{paymentId:string;isDemo:boolean;clientSecret:string}>(
  await startPayment(empty("/api/contracts/"+contractId+"/payment"),params(contractId)));
 expect(intent.isDemo).toBe(true);
 expect(intent.clientSecret.startsWith("demo_pi_")).toBe(true);
 expect((await prisma.payment.findUniqueOrThrow({where:{id:intent.paymentId}})).status).toBe("pending");
 return intent.paymentId;
}

describe.skipIf(!run)("REAL LOCAL POSTGRESQL money-loop API + SQL verification",()=>{
 const suffix=randomUUID().slice(0,8);
 const refs:string[]=[];
 const facilityIds:string[]=[];
 let primaryId:string;
 beforeAll(async()=>{
  if(!run)return;
  expect(process.env.DATABASE_URL).toContain("localhost:5433");
  expect(getPaymentMode()).toBe("demo");
  expect(readFileSync("src/components/payments/deposit-checkout.tsx","utf8")).toContain("DEMO MODE — add your Stripe keys to accept real payments");
  expect(process.env.STRIPE_SECRET_KEY||"").toBe("");
  process.env.ESIGN_IP_HASH_SECRET="local-verification-ip-secret-very-long-and-private";
  await prisma.organization.createMany({data:[
   {id:"verify-hospital-org",name:"Synthetic Verification Hospital",slug:"verify-hospital"},
   {id:"verify-facility-org",name:"Synthetic Verification Facility Organization",slug:"verify-facility",type:"facility"},
  ].map(x=>({...x,type:(x as any).type??"hospital"})),skipDuplicates:true});
  await prisma.user.createMany({data:[
   {id:"verify-hospital-user",email:"verification.hospital@example.invalid",firstName:"Test",lastName:"Hospital",
    role:"social_worker",title:"Social Worker",department:"Discharge",hospitalId:"verification-hospital",
    phone:"000",organizationId:"verify-hospital-org"},
   {id:"verify-facility-user",email:"verification.facility@example.invalid",firstName:"Test",lastName:"Facility",
    role:"facility_coordinator",title:"Coordinator",department:"Admissions",hospitalId:"verification-facility",
    phone:"000",organizationId:"verify-facility-org"},
  ],skipDuplicates:true});
  const makeFacility=async(capacity:number)=>{
   const id="verify-fac-"+randomUUID();
   facilityIds.push(id);
   await prisma.facility.create({data:{
    id,name:"Synthetic Facility "+id.slice(-7),type:"skilled_nursing_facility",
    address:{city:"Verification"},phone:"000",email:id+"@example.invalid",
    contacts:[],licensure:[],accreditations:[],capacity,currentOccupancy:0,
    insuranceAccepted:[],careLevelsOffered:["skilled_nursing"],specialties:["Therapy"],
    rating:0,reviewsCount:0,hasAvailability:true,organizationId:"verify-facility-org",
   }});
   return id;
  };
  primaryId=await makeFacility(1);
  await prisma.patient.create({data:{
   id:"verify-patient-"+suffix,mrn:"VERIFY-"+suffix,
   firstName:"Synthetic",lastName:"Verification Patient",
   dateOfBirth:new Date("1960-01-02"),age:66,gender:"unspecified",
   address:{synthetic:true},phone:"000",emergencyContact:{synthetic:true},
   insurance:{synthetic:true},primaryDiagnosis:"Verification only",secondaryDiagnoses:[],
   careLevelRequired:"skilled_nursing",notes:"Synthetic integration fixture",
   socialWorkerId:"verify-hospital-user",hospitalId:"verification-hospital",
   organizationId:"verify-hospital-org",admissionDate:new Date("2026-01-01"),
  }});
 });
 afterAll(async()=>{
  if(!run)return;
  // Keep DB evidence for post-test SQL inspection. No external PHI used.
  await prisma.$disconnect();
 });

 it("entire hospital -> facility -> contract -> demo payment -> conversion flow",async()=>{
  const {refId,contractId}=await makeReferral(primaryId,"VERIFY-"+suffix);
  refs.push(refId);
  switchTo("hospital");
  const hospitalList=await check<any[]>(await listReferral());
  expect(hospitalList.some(x=>x.id===refId)).toBe(true);
  const link=await check<any>(await getReferralContract(new Request("http://localhost:3000"),params(refId)));
  expect(link.id).toBe(contractId);
  const paymentId=await finishAgreement(contractId);
  switchTo("hospital");
  const paymentResult=await check<any>(await finishDemoPayment(empty("/api/payments/"+paymentId+"/demo-complete"),params(paymentId)));
  expect(paymentResult.status).toBe("paid");
  expect((await prisma.payment.findUniqueOrThrow({where:{id:paymentId}})).status).toBe("demo_paid");
  expect(await prisma.bedReservation.count({where:{referralId:refId}})).toBe(1);
  expect((await prisma.facility.findUniqueOrThrow({where:{id:primaryId}})).currentOccupancy).toBe(1);
  const duplicated=await check<any>(await finishDemoPayment(empty("/api/payments/"+paymentId+"/demo-complete"),params(paymentId)));
  expect(duplicated.status).toBe("duplicate");
  expect(await prisma.bedReservation.count({where:{referralId:refId}})).toBe(1);
  switchTo("facility");
  const conversion=await check<any>(await convertReferral(empty("/api/referrals/"+refId+"/convert"),params(refId)));
  expect(conversion.status).toBe("converted");
  const second=await check<any>(await convertReferral(empty("/api/referrals/"+refId+"/convert"),params(refId)));
  expect(second.alreadyConverted).toBe(true);
  expect(second.placementId).toBe(conversion.placementId);
  expect((await prisma.referral.findUniqueOrThrow({where:{id:refId}})).convertedPlacementId).toBe(conversion.placementId);
  expect(await prisma.placement.count({where:{id:conversion.placementId}})).toBe(1);
  expect(await prisma.bedReservation.count({where:{referralId:refId}})).toBe(0);
  expect((await prisma.facility.findUniqueOrThrow({where:{id:primaryId}})).currentOccupancy).toBe(1);
  switchTo("hospital");
  const lateReplay=await check<any>(await finishDemoPayment(empty("/api/payments/"+paymentId+"/demo-complete"),params(paymentId)));
  expect(lateReplay.status).toBe("duplicate");
  console.log("E2E_FULL_LOOP_PASS",refId,"single placement, no reservation, occupancy 1");
 });

 it("two concurrent demo deposits for the last bed: exactly one reserves",async()=>{
  const facId="verify-fac-race-"+randomUUID();
  await prisma.facility.create({data:{
    id:facId,name:"Synthetic Last Bed",type:"skilled_nursing_facility",
    address:{synthetic:true},phone:"000",email:facId+"@example.invalid",
    contacts:[],licensure:[],accreditations:[],capacity:1,currentOccupancy:0,
    insuranceAccepted:[],careLevelsOffered:["skilled_nursing"],specialties:["Therapy"],
    rating:0,reviewsCount:0,hasAvailability:true,organizationId:"verify-facility-org",
  }});
  const first=await makeReferral(facId,"RACE-A-"+suffix);
  const second=await makeReferral(facId,"RACE-B-"+suffix);
  const p1=await finishAgreement(first.contractId);
  const p2=await finishAgreement(second.contractId);
  switchTo("hospital");
  const results=await Promise.all([
    finishDemoPayment(empty("/api/payments/"+p1+"/demo-complete"),params(p1)),
    finishDemoPayment(empty("/api/payments/"+p2+"/demo-complete"),params(p2)),
  ]);
  const statuses=await Promise.all(results.map(async r=>(await r.json()).status));
  const payments=await prisma.payment.findMany({where:{id:{in:[p1,p2]}}});
  expect(payments.filter(p=>p.status==="demo_paid")).toHaveLength(1);
  expect(payments.filter(p=>p.status==="demo_refunded")).toHaveLength(1);
  expect(await prisma.bedReservation.count({where:{facilityId:facId}})).toBe(1);
  expect((await prisma.facility.findUniqueOrThrow({where:{id:facId}})).currentOccupancy).toBe(1);
  expect(statuses.sort()).toEqual(["demo_refunded","paid"]);
  console.log("CONCURRENT_LAST_BED_PASS","one paid","one refunded","occupancy=1");
 });
 it("capacity gone at payment: refund and flag without reserving",async()=>{
  const facId="verify-fac-cap-"+randomUUID();
  await prisma.facility.create({data:{
    id:facId,name:"Synthetic Capacity Gone",type:"skilled_nursing_facility",
    address:{synthetic:true},phone:"000",email:facId+"@example.invalid",
    contacts:[],licensure:[],accreditations:[],capacity:1,currentOccupancy:0,
    insuranceAccepted:[],careLevelsOffered:["skilled_nursing"],specialties:["Therapy"],
    rating:0,reviewsCount:0,hasAvailability:true,organizationId:"verify-facility-org",
  }});
  const {refId,contractId}=await makeReferral(facId,"CAP-"+suffix);
  const payId=await finishAgreement(contractId);
  await prisma.facility.update({where:{id:facId},data:{currentOccupancy:1,hasAvailability:false}});
  switchTo("hospital");
  const result=await check<any>(await finishDemoPayment(empty("/api/payments/"+payId+"/demo-complete"),params(payId)));
  expect(result.status).toBe("demo_refunded");
  expect((await prisma.payment.findUniqueOrThrow({where:{id:payId}})).status).toBe("demo_refunded");
  expect((await prisma.referral.findUniqueOrThrow({where:{id:refId}})).depositIssue).toBe("CAPACITY_LOST_REFUNDED");
  expect(await prisma.bedReservation.count({where:{referralId:refId}})).toBe(0);
  console.log("CAPACITY_GONE_REFUND_PASS",refId);
 });
});