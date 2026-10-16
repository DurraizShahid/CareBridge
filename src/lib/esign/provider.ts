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

export type SigningSessionStatus = "pending" | "completed" | "declined" | "expired";

export type SigningPartyConfig = {
  party: SigningParty;
  signerUserId: string;
  signerOrgId: string;
  signerName?: string;
  signerEmail?: string;
};

export type CreateSigningSessionRequest = {
  contractId: string;
  documentText: string;
  expectedDocumentHash: string;
  parties: SigningPartyConfig[];
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export type SigningSession = {
  sessionId: string;
  provider: string;
  status: SigningSessionStatus;
  signingUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
};

export type SigningSessionStatusResponse = {
  sessionId: string;
  status: SigningSessionStatus;
  completedAt?: Date;
  signatures?: {
    party: SigningParty;
    signedAt: Date;
  }[];
  metadata?: Record<string, unknown>;
};

export type ExecutedDocumentResponse = {
  sessionId: string;
  documentHash: string;
  documentText?: string;
  evidence: EsignEvidence[];
  certificateUrl?: string;
  completedAt: Date;
};

export interface EsignProvider {
  readonly id: string;
  sign(request: SigningRequest): Promise<EsignEvidence>;
  createSigningSession(request: CreateSigningSessionRequest): Promise<SigningSession>;
  checkStatus(sessionId: string): Promise<SigningSessionStatusResponse>;
  retrieveExecutedDocument(sessionId: string): Promise<ExecutedDocumentResponse>;
  getExecutedDocument?(sessionId: string): Promise<ExecutedDocumentResponse>;
}

// Built-in standard provider: executes immediate cryptographic signature evidence.
// An external provider (e.g. DocuSign or Dropbox Sign) implements the EsignProvider interface;
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

  async createSigningSession(request: CreateSigningSessionRequest): Promise<SigningSession> {
    return {
      sessionId: `standard_${request.contractId}`,
      provider: this.id,
      status: "pending",
    };
  }

  async checkStatus(sessionId: string): Promise<SigningSessionStatusResponse> {
    return {
      sessionId,
      status: "completed",
    };
  }

  async retrieveExecutedDocument(sessionId: string): Promise<ExecutedDocumentResponse> {
    return {
      sessionId,
      documentHash: "",
      evidence: [],
      completedAt: new Date(),
    };
  }

  async getExecutedDocument(sessionId: string): Promise<ExecutedDocumentResponse> {
    return this.retrieveExecutedDocument(sessionId);
  }
}

/**
 * Provider factory for electronic signatures.
 * Default implementation is StandardEsignProvider.
 *
 * External provider choice (e.g. DocuSign vs. Dropbox Sign) is pending client decision.
 * To integrate an external provider later, implement EsignProvider and update this factory
 * to return the external instance; callers and contract services remain unchanged.
 */
export function getEsignProvider(): EsignProvider {
  return new StandardEsignProvider();
}