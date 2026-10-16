import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { referralContext, ReferralError } from "@/lib/referrals";
import { documentSha256, renderContract, type ContractSnapshot } from "@/lib/esign/document";
import { getEsignProvider, type SigningParty } from "@/lib/esign/provider";

export async function contractContext(id: string) {
  const ctx = await referralContext();
  const contract = await prisma.contract.findFirst({
    where: { id, referral: ctx.type === "hospital"
      ? { sendingOrgId: ctx.organizationId }
      : { facility: { organizationId: ctx.organizationId }, status: { not: "draft" } } },
    include: { referral: { include: {
      sendingOrganization: { select: { name: true } },
      facility: { select: { name: true, organizationId: true } },
    } }, signatures: { orderBy: { signedAt: "asc" } } },
  });
  if (!contract || (ctx.type === "facility" && contract.status === "draft"))
    throw new ReferralError(404, "Contract not found");
  return { ctx, contract };
}

export async function getContract(id: string) {
  const { ctx, contract } = await contractContext(id);
  if (contract.documentText && contract.documentHash &&
      documentSha256(contract.documentText) !== contract.documentHash)
    throw new ReferralError(409, "Document integrity check failed");
  return {
    id: contract.id, referralId: contract.referralId, status: contract.status,
    documentText: contract.documentText, documentHash: contract.documentHash,
    depositAmountCents: contract.depositAmountCents, currency: contract.currency,
    facilityTermsSnapshot: contract.facilityTermsSnapshot, sentAt: contract.sentAt,
    hospitalSignedAt: contract.hospitalSignedAt, facilitySignedAt: contract.facilitySignedAt,
    signatures: contract.signatures.map(s => ({
      party: s.party, typedName: s.typedName, signerUserId: s.signerUserId,
      signerOrgId: s.signerOrgId, signedAt: s.signedAt,
      documentHash: s.documentHash, provider: s.provider,
    })),
    myParty: ctx.type, canPrepare: ctx.type === "hospital" && contract.status === "draft",
    hospitalName: contract.referral.sendingOrganization.name,
    facilityName: contract.referral.facility.name,
  };
}

export async function contractForReferral(referralId: string) {
  const ctx = await referralContext();
  return prisma.contract.findFirst({
    where: { referralId, referral: ctx.type === "hospital"
      ? { sendingOrgId: ctx.organizationId }
      : { facility: { organizationId: ctx.organizationId }, status: { not: "draft" } } },
    select: { id: true, status: true },
  });
}

const PHI_PATTERNS: RegExp[] = [
  // SSN style sequences (XXX-XX-XXXX, labeled SSN)
  /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/,
  /\b(?:ssn|social\s+security)[^a-z\n\r]*\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/i,
  // Phone numbers (e.g. (555) 123-4567, 555-123-4567, +1-555-123-4567)
  /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\b\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  // Dates of birth (MM/DD/YYYY, YYYY-MM-DD, Month DD, YYYY, explicit DOB)
  /\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b/,
  /\b(?:19|20)\d{2}[/-](?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])\b/,
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+(?:19|20)\d{2}\b/i,
  /\b(?:dob|date\s+of\s+birth|birth\s*date)\b[:\s]*[^\n,;]+/i,
  // Street addresses (e.g. 123 Main St, 456 Elm Ave, P.O. Box 789)
  /\b\d{1,5}\s+(?:[A-Za-z0-9#.]+\s+){1,4}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way|terrace|ter|place|pl|circle|cir|highway|hwy|parkway|pkwy)\b/i,
  /\b(?:p\.?\s*o\.?\s*box|post\s+office\s+box)\s+\d+\b/i,
];

export function containsPhiPattern(text: string): boolean {
  return PHI_PATTERNS.some((pattern) => pattern.test(text));
}

export async function sendContract(id: string, payload: unknown) {
  const { ctx, contract } = await contractContext(id);
  if (ctx.type !== "hospital") throw new ReferralError(403, "Hospital access required");
  if (contract.status !== "draft" || contract.referral.status !== "accepted")
    throw new ReferralError(409, "Only accepted referral drafts can be sent");
  if (!payload || typeof payload !== "object") throw new ReferralError(400, "Invalid terms");
  const b = payload as Record<string, unknown>;
  const deposit = b.depositAmountCents;
  const terms = typeof b.facilityTerms === "string" ? b.facilityTerms.trim() : "";
  if (typeof deposit !== "number" || !Number.isSafeInteger(deposit) || deposit < 50 || deposit > 100_000_000)
    throw new ReferralError(400, "Deposit must be at least 50 cents");
  if (terms.length < 15 || terms.length > 8000)
    throw new ReferralError(400, "Terms must contain 15 to 8000 characters");
  // Keep raw patient identifiers out of freeform contract terms.
  const lowerTerms = terms.toLocaleLowerCase();
  const identifiers = [contract.referral.patientName?.trim() ?? "", contract.referral.patientMrn?.trim() ?? ""]
    .filter(value => value.length >= 3);
  if (identifiers.some(value => lowerTerms.includes(value.toLocaleLowerCase())))
    throw new ReferralError(400, "Do not include patient names or MRNs in contract terms");
  if (containsPhiPattern(terms))
    throw new ReferralError(400, "Contract terms contain potential protected health information (PHI). Please use structured fields instead of free text.");
  const snapshot: ContractSnapshot = {
    referralId: contract.referral.id,
    hospitalName: contract.referral.sendingOrganization.name,
    facilityName: contract.referral.facility.name,
    facilityId: contract.referral.facilityId,
    careLevel: contract.referral.careLevel,
    requiredServices: contract.referral.requiredServices,
    depositAmountCents: deposit, currency: "usd", facilityTerms: terms,
  };
  const documentText = renderContract(snapshot);
  const documentHash = documentSha256(documentText);
  const result = await prisma.contract.updateMany({
    where: { id, status: "draft", referral: { sendingOrgId: ctx.organizationId, status: "accepted" } },
    data: { depositAmountCents: deposit, currency: "usd", facilityTermsSnapshot: snapshot,
      documentText, documentHash, status: "sent", sentAt: new Date() },
  });
  if (!result.count) throw new ReferralError(409, "Contract was already sent");
  return { id, status: "sent", documentHash };
}

export async function signContract(id: string, typedName: unknown, ipAddress: string, consented: boolean) {
  const { ctx, contract } = await contractContext(id);
  const party = ctx.type as SigningParty;
  if (contract.status !== "sent" || contract.referral.status !== "accepted")
    throw new ReferralError(409, "Contract is not awaiting signatures");
  if (!contract.documentText || !contract.documentHash)
    throw new ReferralError(409, "Contract document is missing");
  const expectedOrg = party === "hospital" ? contract.referral.sendingOrgId
    : contract.referral.facility.organizationId;
  if (ctx.organizationId !== expectedOrg) throw new ReferralError(403, "Signer organization mismatch");
  if (!consented) throw new ReferralError(400, "Electronic signature consent is required");
  if (typeof typedName !== "string") throw new ReferralError(400, "Full name required");
  let evidence;
  try {
    evidence = await getEsignProvider().sign({
      typedName, party, signerUserId: ctx.userId, signerOrgId: ctx.organizationId,
      ipAddress, consented, documentText: contract.documentText, expectedDocumentHash: contract.documentHash,
    });
  } catch (e) {
    throw new ReferralError(e instanceof Error && /full legal name/i.test(e.message) ? 400 : 409,
      e instanceof Error ? e.message : "Signature unavailable");
  }
  return prisma.$transaction(async tx => {
    // Parameterized SQL row lock serializes both parties and repeat-click races.
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Contract" WHERE "id" = ${id} FOR UPDATE`);
    const locked = await tx.contract.findUnique({
      where: { id }, include: { signatures: true },
    });
    if (!locked || locked.status !== "sent" || locked.documentText !== contract.documentText ||
      locked.documentHash !== evidence.documentHash ||
      documentSha256(locked.documentText ?? "") !== evidence.documentHash)
      throw new ReferralError(409, "Document changed; signature rejected");
    if (locked.signatures.some(s => s.party === party))
      throw new ReferralError(409, "This party has already signed");
    await tx.contractSignature.create({
      data: { contractId: id, party, typedName: evidence.typedName,
        signerUserId: evidence.signerUserId, signerOrgId: evidence.signerOrgId,
        signedAt: evidence.signedAt, ipHash: evidence.ipHash, consentStatement: evidence.consentStatement,
        documentHash: evidence.documentHash, provider: evidence.provider },
    });
    const second = locked.signatures.some(s => s.party !== party);
    await tx.contract.update({
      where: { id }, data: {
        ...(party === "hospital" ? { hospitalSignedBy: evidence.signerUserId, hospitalSignedAt: evidence.signedAt }
          : { facilitySignedBy: evidence.signerUserId, facilitySignedAt: evidence.signedAt }),
        status: second ? "signed" : "sent",
      },
    });
    return { id, status: second ? "signed" : "sent", signedParty: party, documentHash: evidence.documentHash };
  });
}