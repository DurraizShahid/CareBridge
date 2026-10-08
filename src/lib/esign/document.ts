import { createHash } from "node:crypto";

export type ContractSnapshot = {
  referralId: string;
  hospitalName: string;
  facilityName: string;
  facilityId: string;
  careLevel: string;
  requiredServices: string[];
  depositAmountCents: number;
  currency: string;
  facilityTerms: string;
};

export function renderContract(snapshot: ContractSnapshot): string {
  const amount = (snapshot.depositAmountCents / 100).toFixed(2);
  // Referral ID is an internal random identifier, not the patient's MRN/name.
  // Do not add patient identifiers or diagnoses to this document.
  return [
    "CAREBRIDGE | PLACEMENT AGREEMENT",
    "",
    "Agreement reference: " + snapshot.referralId,
    "Sending hospital: " + snapshot.hospitalName,
    "Receiving facility: " + snapshot.facilityName,
    "Facility reference: " + snapshot.facilityId,
    "",
    "SERVICES",
    "Care level: " + snapshot.careLevel.replaceAll("_", " "),
    "Requested services: " + (snapshot.requiredServices.join(", ") || "None specified"),
    "",
    "FINANCIAL TERMS",
    "Required deposit: " + snapshot.currency.toUpperCase() + " " + amount,
    "The deposit is payable only through the payment workflow after this agreement is signed.",
    "",
    "FACILITY TERMS",
    snapshot.facilityTerms,
    "",
    "SIGNATURES",
    "Authorized representatives of both the hospital and facility must sign",
    "this exact agreement. Any change to its text requires a new agreement.",
    "",
    "This document records agreed placement terms; no clinical record is included.",
  ].join("\n");
}

export function documentSha256(documentText: string): string {
  return createHash("sha256").update(documentText, "utf8").digest("hex");
}