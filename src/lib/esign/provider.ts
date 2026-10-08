import { createHash, timingSafeEqual } from "node:crypto";
import { documentSha256 } from "./document";

export type SigningParty = "hospital" | "facility";
export type EsignEvidence = {
  typedName: string;
  consentStatement: string;
  party: SigningParty;
  signerUserId: string;
  signerOrgId: string;
  signedAt: Date;
  ipHash: string;
  documentHash: string;
  provider: string;
};
export type SigningRequest = {
  typedName: string;
  party: SigningParty;
  signerUserId: string;
  signerOrgId: string;
  ipAddress: string;
  consented: boolean;
  documentText: string;
  expectedDocumentHash: string;
};

export interface EsignProvider {
  readonly id: string;
  sign(request: SigningRequest): Promise<EsignEvidence>;
}

// An external provider (DocuSign / Dropbox Sign) implements this interface;
// configure getEsignProvider() to return it. Routes and contract service stay unchanged.
// External providers should verify signed webhooks before returning evidence.
export class StandardEsignProvider implements EsignProvider {
  readonly id = "standard";
  async sign(request: SigningRequest): Promise<EsignEvidence> {
    if (!request.consented) throw new Error("Electronic signature consent is required");
    const name = request.typedName.trim().replace(/\s+/g, " ");
    if (name.length < 3 || name.length > 160 || name.split(" ").length < 2)
      throw new Error("Enter your full legal name");
    const actual = documentSha256(request.documentText);
    if (!/^[0-9a-f]{64}$/.test(request.expectedDocumentHash) ||
      !timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(request.expectedDocumentHash, "hex")))
      throw new Error("Document integrity check failed");
    const secret = process.env.ESIGN_IP_HASH_SECRET;
    if (!secret || secret.length < 32)
      throw new Error("E-sign IP hashing secret is not configured");
    return {
      typedName: name, consentStatement: "I reviewed this exact document and intend my typed name to be my electronic signature on behalf of my organization.", party: request.party,
      signerUserId: request.signerUserId, signerOrgId: request.signerOrgId,
      signedAt: new Date(), provider: this.id, documentHash: actual,
      ipHash: createHash("sha256").update(secret + ":" + request.ipAddress).digest("hex"),
    };
  }
}
export function getEsignProvider(): EsignProvider {
  return new StandardEsignProvider();
}