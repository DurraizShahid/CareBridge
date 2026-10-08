import "server-only";
import { prisma } from "@/lib/prisma";
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

export async function sendContract(id: string, payload: unknown) {
  const { ctx, contract } = await contractContext(id);
  if (ctx.type !== "hospital") throw new ReferralError(403, "Hospital access required");
  if (contract.status !== "draft" || contract.referral.status !== "accepted")
    throw new ReferralError(409, "Only accepted referral drafts can be sent");
  if (!payload || typeof payload !== "object") throw new ReferralError(400, "Invalid terms");
  const b = payload as Record<string, unknown>;
  const deposit = b.depositAmountCents;
  const terms = typeof b.facilityTerms === "string" ? b.facilityTerms.trim() : "";
  if (typeof deposit !== "number" || !Number.isSafeInteger(deposit) || deposit < 0 || deposit > 100_000_000)
    throw new ReferralError(400, "Deposit must be a valid amount in cents");
  if (terms.length < 15 || terms.length > 8000)
    throw new ReferralError(400, "Terms must contain 15 to 8000 characters");
  // Keep raw patient identifiers out of freeform contract terms.
  const lowerTerms = terms.toLocaleLowerCase();
  const identifiers = [contract.referral.patientName.trim(), contract.referral.patientMrn.trim()]
    .filter(value => value.length >= 3);
  if (identifiers.some(value => lowerTerms.includes(value.toLocaleLowerCase())))
    throw new ReferralError(400, "Do not include patient names or MRNs in contract terms");
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
    await tx.$queryRawUnsafe('SELECT "id" FROM "Contract" WHERE "id" = $1 FOR UPDATE', id);
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